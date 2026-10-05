/**
 * ProcessEventService — SIRAGU Trace (§44).
 *
 * Responsibilities:
 *   1. Create process events (with input lots + output lots)
 *   2. Auto-create output lots when not provided
 *   3. Create LotRelations linking inputs → outputs
 *   4. Compute and persist mass balance
 *   5. Update lot statuses (inputs → IN_PROCESS, outputs → READY)
 *   6. Append LotEvents for traceability trail
 */

import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MassBalanceService } from './mass-balance.service.js';
import { LotStateMachineService } from '../lots/lot-state-machine.service.js';
import type { CreateProcessEventDto } from './dto/create-process-event.dto.js';
import { LotType, MassBalanceStatus, ProcessEventType, RelationType, LotStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Determine the relation type from process type
function defaultRelationType(eventType: ProcessEventType): RelationType {
  switch (eventType) {
    case ProcessEventType.MIXING: return RelationType.MIXED_INTO;
    case ProcessEventType.REWORK:  return RelationType.REWORKED_FROM;
    case ProcessEventType.PACKING_PREP: return RelationType.PACKED_FROM;
    default: return RelationType.TRANSFORMED_TO;
  }
}

// LotType for new output lots
function outputLotType(eventType: ProcessEventType): LotType {
  switch (eventType) {
    case ProcessEventType.MIXING:       return LotType.MIX_OUTPUT;
    case ProcessEventType.REWORK:       return LotType.REWORK_OUTPUT;
    case ProcessEventType.PACKING_PREP: return LotType.PACK_OUTPUT;
    default: return LotType.PROCESS_OUTPUT;
  }
}

@Injectable()
export class ProcessEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly massBalance: MassBalanceService,
    private readonly stateMachine: LotStateMachineService,
  ) {}

  // ── CREATE ──────────────────────────────────────────────────────────────────

  async create(orgId: string, actorId: string, dto: CreateProcessEventDto) {
    // 1. Validate & fetch all input lots (tenant-scoped)
    const inputLots = await Promise.all(
      dto.inputs.map(async (inp) => {
        const lot = await this.prisma.lot.findFirst({
          where: { id: inp.lotId, organizationId: orgId, deletedAt: null },
        });
        if (!lot) throw new NotFoundException(`Input lot "${inp.lotId}" not found.`);
        return { lot, dto: inp };
      }),
    );

    // 2. Generate event code
    const eventCode = await this.generateEventCode(orgId);

    // 3. Compute mass balance
    const totalInput     = dto.inputs.reduce((s, i) => s + i.quantity, 0);
    const totalOutput    = dto.outputs.reduce((s, o) => s + o.quantity, 0);
    const totalWaste     = dto.outputs.reduce((s, o) => s + (o.waste ?? 0), 0);
    const totalRemaining = dto.outputs.reduce((s, o) => s + (o.remaining ?? 0), 0);
    const mb = this.massBalance.compute({ totalInput, totalOutput, totalWaste, totalRemaining });

    if (mb.status === MassBalanceStatus.BLOCKED && !dto.massBalanceNote) {
      throw new BadRequestException(
        `Mass balance is BLOCKED (${mb.diffPct.toFixed(2)}% unaccounted). ` +
        'Provide massBalanceNote to explain the discrepancy.',
      );
    }

    // 4. Run everything in a transaction
    const event = await this.prisma.$transaction(async (tx) => {
      // 4a. Create the ProcessEvent
      const evt = await tx.processEvent.create({
        data: {
          organizationId:   orgId,
          eventCode,
          eventType:        dto.eventType,
          customEventName:  dto.customEventName,
          siteId:           dto.siteId,
          locationId:       dto.locationId,
          startAt:          new Date(dto.startAt),
          endAt:            dto.endAt ? new Date(dto.endAt) : null,
          createdById:      actorId,
          notes:            dto.notes,
          evidenceUrls:     dto.evidenceUrls ?? [],
          massBalanceStatus: mb.status,
          massBalanceDiff:  mb.diff,
          massBalanceNote:  dto.massBalanceNote,
        },
      });

      // 4b. Create ProcessEventInputs + move input lots to IN_PROCESS
      for (const { lot, dto: inp } of inputLots) {
        await tx.processEventInput.create({
          data: { eventId: evt.id, lotId: lot.id, quantity: inp.quantity, unit: inp.unit },
        });

        // State transition: whatever current status → IN_PROCESS (if not already)
        if (lot.status !== LotStatus.IN_PROCESS) {
          this.stateMachine.assert(lot.status, LotStatus.IN_PROCESS);
          await tx.lot.update({
            where: { id: lot.id },
            data:  { status: LotStatus.IN_PROCESS },
          });
          await tx.lotEvent.create({
            data: {
              lotId: lot.id, actorId, eventType: 'STATUS_CHANGED',
              payload: { from: lot.status, to: LotStatus.IN_PROCESS, reason: `Used in event ${eventCode}` },
            },
          });
        }
      }

      // 4c. Create output lots (or use existing) + ProcessEventOutputs
      const outputLots: Array<{ id: string; productName: string }> = [];
      for (const out of dto.outputs) {
        let outputLotId: string;

        if (out.lotId) {
          // Reference existing lot
          const existing = await tx.lot.findFirst({
            where: { id: out.lotId, organizationId: orgId },
          });
          if (!existing) throw new NotFoundException(`Output lot "${out.lotId}" not found.`);
          outputLotId = existing.id;
          outputLots.push(existing);
        } else {
          // Auto-create new output lot
          if (!out.lotCode) throw new BadRequestException('Output requires lotId or lotCode.');
          const existing = await tx.lot.findFirst({
            where: { organizationId: orgId, lotCode: out.lotCode, deletedAt: null },
          });
          if (existing) throw new ConflictException(`Lot code "${out.lotCode}" already exists.`);

          const newLot = await tx.lot.create({
            data: {
              organizationId: orgId,
              lotCode:       out.lotCode,
              lotType:       outputLotType(dto.eventType),
              productName:   out.productName ?? inputLots[0].lot.productName,
              quantity:      out.quantity,
              unit:          out.unit,
              status:        LotStatus.READY,
              siteId:        dto.siteId,
              locationId:    dto.locationId,
              createdById:   actorId,
            },
          });
          outputLotId = newLot.id;
          outputLots.push(newLot);
          await tx.lotEvent.create({
            data: {
              lotId: newLot.id, actorId, eventType: 'LOT_CREATED',
              payload: { lotCode: newLot.lotCode, createdByEvent: eventCode },
            },
          });
        }

        await tx.processEventOutput.create({
          data: {
            eventId:   evt.id,
            lotId:     outputLotId,
            quantity:  out.quantity,
            unit:      out.unit,
            waste:     out.waste ?? 0,
            remaining: out.remaining ?? 0,
          },
        });
      }

      // 4d. Create LotRelations — many-to-many: each input × each output
      const relationType = defaultRelationType(dto.eventType);
      for (const { lot: srcLot, dto: inp } of inputLots) {
        for (const outLot of outputLots) {
          await tx.lotRelation.create({
            data: {
              organizationId: orgId,
              sourceLotId:    srcLot.id,
              targetLotId:    outLot.id,
              relationType,
              quantity:       inp.quantity,
              unit:           inp.unit,
              eventId:        evt.id,
            },
          });
        }
      }

      return evt;
    });

    return this.findOne(orgId, event.id);
  }

  // ── LIST ──────────────────────────────────────────────────────────────────

  async findAll(orgId: string, query: { eventType?: ProcessEventType; limit?: number; offset?: number }) {
    const where: Prisma.ProcessEventWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(query.eventType && { eventType: query.eventType }),
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.processEvent.findMany({
        where,
        include: {
          inputs:  { include: { lot: { select: { id: true, lotCode: true, productName: true } } } },
          outputs: { include: { lot: { select: { id: true, lotCode: true, productName: true } } } },
          createdBy: { select: { id: true, name: true } },
          site:     { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 20,
        skip: query.offset ?? 0,
      }),
      this.prisma.processEvent.count({ where }),
    ]);

    return { data: events, total, limit: query.limit ?? 20, offset: query.offset ?? 0 };
  }

  // ── GET ONE ──────────────────────────────────────────────────────────────────

  async findOne(orgId: string, id: string) {
    const event = await this.prisma.processEvent.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        inputs:  { include: { lot: { select: { id: true, lotCode: true, productName: true, status: true, quantity: true, unit: true } } } },
        outputs: { include: { lot: { select: { id: true, lotCode: true, productName: true, status: true, quantity: true, unit: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
        site:      { select: { id: true, name: true } },
        location:  { select: { id: true, name: true } },
        lotRelations: true,
      },
    });
    if (!event) throw new NotFoundException(`Process event "${id}" not found.`);
    return event;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async generateEventCode(orgId: string): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.prisma.processEvent.count({
      where: { organizationId: orgId, eventCode: { startsWith: `PE-${year}-` } },
    });
    return `PE-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
