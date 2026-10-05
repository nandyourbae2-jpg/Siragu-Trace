import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLotDto } from './dto/create-lot.dto.js';
import type { UpdateLotDto } from './dto/update-lot.dto.js';
import type { ListLotsQueryDto } from './dto/list-lots-query.dto.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class LotsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const lot = await this.prisma.lot.create({
      data: {
        organizationId,
        createdById,
        lotCode: dto.lotCode,
        productName: dto.productName,
        quantity: dto.quantity,
        unit: dto.unit,
        status: dto.status ?? 'DRAFT',
        locationId: dto.locationId ?? null,
        description: dto.description ?? null,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
      },
      include: this.defaultInclude(),
    });

    // Append creation event.
    await this.appendEvent(lot.id, createdById, 'LOT_CREATED', {
      lotCode: lot.lotCode,
      productName: lot.productName,
      status: lot.status,
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
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 50,
          include: { actor: { select: { id: true, name: true, email: true, role: true } } },
        },
        inputs: { include: { inputLot: { select: { id: true, lotCode: true, productName: true } } } },
        outputs: { include: { outputLot: { select: { id: true, lotCode: true, productName: true } } } },
      },
    });

    if (!lot) {
      throw new NotFoundException(`Lot "${id}" not found.`);
    }

    // Tenant isolation — verified by the WHERE clause above but belt-and-braces.
    if (lot.organizationId !== organizationId) {
      throw new ForbiddenException('Cross-tenant access denied.');
    }

    return lot;
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────────

  async update(organizationId: string, actorId: string, id: string, dto: UpdateLotDto) {
    const lot = await this.findOne(organizationId, id);

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

    return updated;
  }

  // ── SOFT DELETE ──────────────────────────────────────────────────────────────

  async softDelete(organizationId: string, actorId: string, id: string) {
    const lot = await this.findOne(organizationId, id);

    await this.prisma.lot.update({
      where: { id: lot.id },
      data: { deletedAt: new Date() },
    });

    await this.appendEvent(lot.id, actorId, 'LOT_DELETED', {});
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
