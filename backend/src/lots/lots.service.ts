import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchService } from '../common/batch.service.js';
import { AuditService } from '../common/audit.service.js';
import { computeNetto } from '../common/weights.js';
import { validateBpom } from '../common/bpom.js';
import type { CreateLotDto } from './dto/create-lot.dto.js';
import type { UpdateLotDto } from './dto/update-lot.dto.js';
import type { ListLotsQueryDto } from './dto/list-lots-query.dto.js';
import { LotStatus, type Prisma } from '@prisma/client';

@Injectable()
export class LotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchService: BatchService,
    private readonly auditService: AuditService,
  ) {}

  // ── CREATE ──────────────────────────────────────────────────────────────────

  async create(organizationId: string, createdById: string, dto: CreateLotDto) {
    // Check lotCode uniqueness within org.
    const existing = await this.prisma.lot.findFirst({
      where: { organizationId, lotCode: dto.lotCode, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        `Lot code "${dto.lotCode}" already exists in your organisation.`,
      );
    }

    // Weight calculation & validation: netto = bruto - tara
    let finalQty = dto.quantity;
    if (dto.grossWeight !== undefined && dto.tareWeight !== undefined) {
      const calculatedNetto = computeNetto(Number(dto.grossWeight), Number(dto.tareWeight));
      if (finalQty !== undefined && Math.abs(finalQty - calculatedNetto) > 0.001) {
        throw new BadRequestException(
          `Kuantitas netto (${finalQty}) tidak cocok dengan hasil perhitungan bruto (${dto.grossWeight}) - tara (${dto.tareWeight}) = ${calculatedNetto}.`,
        );
      }
      finalQty = calculatedNetto;
    }

    if (finalQty === undefined || finalQty <= 0) {
      throw new BadRequestException('Kuantitas netto lot harus lebih besar dari 0.');
    }

    // BPOM validation if provided
    let canonicalBpom = dto.bpomNumber;
    if (dto.bpomType && dto.bpomNumber) {
      canonicalBpom = validateBpom(dto.bpomType, dto.bpomNumber);
    }

    // Atomic batch number generation if not specified
    const batchNumber = dto.batchNumber ?? (await this.batchService.next(organizationId));

    const lot = await this.prisma.lot.create({
      data: {
        organizationId,
        createdById,
        lotCode: dto.lotCode,
        batchNumber,
        productName: dto.productName,
        quantity: finalQty,
        grossWeight: dto.grossWeight,
        tareWeight: dto.tareWeight,
        unit: dto.unit,
        status: dto.status ?? LotStatus.DRAFT,
        lotType: dto.lotType ?? 'RECEIVED',
        supplierId: dto.supplierId ?? null,
        siteId: dto.siteId ?? null,
        locationId: dto.locationId ?? null,
        bpomType: dto.bpomType ?? null,
        bpomNumber: canonicalBpom ?? null,
        halalCertId: dto.halalCertId ?? null,
        distributorName: dto.distributorName ?? null,
        isDemo: dto.isDemo ?? false,
        description: dto.description ?? null,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
      },
      include: this.defaultInclude(),
    });

    // Append creation event & AuditLog
    await this.appendEvent(lot.id, createdById, 'LOT_CREATED', {
      lotCode: lot.lotCode,
      batchNumber: lot.batchNumber,
      productName: lot.productName,
      status: lot.status,
    });

    await this.auditService.log({
      organizationId,
      actorId: createdById,
      action: 'LOT_CREATED',
      entity: 'Lot',
      entityId: lot.id,
      lotId: lot.id,
      newValue: { lotCode: lot.lotCode, batchNumber: lot.batchNumber, quantity: Number(lot.quantity) },
    });

    return lot;
  }

  // ── LIST ─────────────────────────────────────────────────────────────────────

  async findAll(organizationId: string, query: ListLotsQueryDto) {
    const where: Prisma.LotWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.locationId && { locationId: query.locationId }),
      ...(query.search && {
        OR: [
          { lotCode: { contains: query.search, mode: 'insensitive' } },
          { productName: { contains: query.search, mode: 'insensitive' } },
          { batchNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [lots, total] = await this.prisma.$transaction([
      this.prisma.lot.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 20,
        skip: query.offset ?? 0,
      }),
      this.prisma.lot.count({ where }),
    ]);

    return { data: lots, total, limit: query.limit ?? 20, offset: query.offset ?? 0 };
  }

  // ── GET ONE ──────────────────────────────────────────────────────────────────

  async findOne(organizationId: string, id: string) {
    const lot = await this.prisma.lot.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        ...this.defaultInclude(),
        supplier: { select: { id: true, name: true, code: true, village: true, district: true, publicConsent: true } },
        halalCert: true,
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 50,
          include: { actor: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    if (!lot) {
      throw new NotFoundException(`Lot "${id}" not found.`);
    }

    if (lot.organizationId !== organizationId) {
      throw new ForbiddenException('Cross-tenant access denied.');
    }

    return lot;
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────────

  async update(organizationId: string, actorId: string, id: string, dto: UpdateLotDto) {
    const lot = await this.findOne(organizationId, id);

    // Lock rule: RELEASED lots are locked; modifications require explicit audit note/reason
    if (lot.status === LotStatus.RELEASED) {
      if (!dto.note || dto.note.trim().length < 5) {
        throw new BadRequestException(
          'Lot berstatus RELEASED terkunci. Perubahan wajib menyertakan alasan koreksi bertanda audit (note minimal 5 karakter).',
        );
      }
    }

    const { note, ...fields } = dto;

    const updated = await this.prisma.lot.update({
      where: { id: lot.id },
      data: {
        ...fields,
        quantity: fields.quantity !== undefined ? fields.quantity : undefined,
        locationId: fields.locationId !== undefined ? fields.locationId : undefined,
        metadata: fields.metadata !== undefined ? (fields.metadata as Prisma.InputJsonValue) : undefined,
      },
      include: this.defaultInclude(),
    });

    await this.appendEvent(lot.id, actorId, 'LOT_UPDATED', {
      changes: fields,
      note: note ?? null,
    });

    await this.auditService.log({
      organizationId,
      actorId,
      action: lot.status === LotStatus.RELEASED ? 'LOT_CORRECTION_RELEASED' : 'LOT_UPDATED',
      entity: 'Lot',
      entityId: lot.id,
      lotId: lot.id,
      oldValue: { quantity: Number(lot.quantity), status: lot.status },
      newValue: { quantity: Number(updated.quantity), status: updated.status },
      reason: note ?? null,
    });

    return updated;
  }

  // ── SOFT DELETE ──────────────────────────────────────────────────────────────

  async softDelete(organizationId: string, actorId: string, id: string) {
    const lot = await this.findOne(organizationId, id);

    if (lot.status === LotStatus.RELEASED) {
      throw new BadRequestException('Lot yang sudah berstatus RELEASED tidak boleh dihapus.');
    }

    await this.prisma.lot.update({
      where: { id: lot.id },
      data: { deletedAt: new Date() },
    });

    await this.appendEvent(lot.id, actorId, 'LOT_DELETED', {});

    await this.auditService.log({
      organizationId,
      actorId,
      action: 'LOT_DELETED',
      entity: 'Lot',
      entityId: lot.id,
      lotId: lot.id,
      reason: 'Soft deleted by user',
    });
  }

  // ── LOT EVENTS (trail per lot) ────────────────────────────────────────────

  async getEvents(organizationId: string, lotId: string) {
    await this.findOne(organizationId, lotId); // ensures lot belongs to org
    return this.prisma.lotEvent.findMany({
      where: { lotId },
      orderBy: { occurredAt: 'desc' },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async appendEvent(
    lotId: string,
    actorId: string | null,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.lotEvent.create({
      data: { lotId, actorId, eventType, payload: payload as Prisma.InputJsonValue },
    });
  }

  private defaultInclude(): Prisma.LotInclude {
    return {
      location: { select: { id: true, name: true, type: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    };
  }
}
