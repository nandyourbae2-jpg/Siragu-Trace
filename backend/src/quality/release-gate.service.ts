/**
 * Release Gate Service — SIRAGU Trace (§19-20, §34, §84).
 *
 * Enforces the strict business rules (BR-003, BR-004) before a lot can transition to RELEASED.
 * Never allows bypassing of these checks. If failed, provides human-readable blocking reasons.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LotStateMachineService } from '../lots/lot-state-machine.service.js';
import { LotStatus, QualityStatus, MassBalanceStatus, LotType } from '@prisma/client';

export interface ReadinessResult {
  canRelease: boolean;
  reasons: string[];
}

@Injectable()
export class ReleaseGateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: LotStateMachineService,
  ) {}

  /**
   * Evaluates if a lot is ready for release. Returns explicitly readable blocking reasons if not.
   */
  async checkReadiness(orgId: string, lotId: string): Promise<ReadinessResult> {
    const lot = await this.prisma.lot.findFirst({
      where: { id: lotId, organizationId: orgId, deletedAt: null },
      include: {
        evidences: true,
        inspections: true,
        asTarget: true, // relations where this lot is the output
        processOutputs: {
          include: {
            event: true
          }
        }
      },
    });

    if (!lot) throw new NotFoundException(`Lot "${lotId}" not found.`);

    const reasons: string[] = [];

    // 0. State machine check
    const transitionCheck = this.stateMachine.validate(lot.status, LotStatus.RELEASED);
    if (!transitionCheck.ok) {
      reasons.push(`Invalid status transition: ${transitionCheck.reason}`);
    }

    // 1. Lineage completeness
    if (lot.lotType === LotType.RECEIVED) {
      if (!lot.supplierId) {
        reasons.push('Release blocked: RECEIVED lot must have an assigned supplier.');
      }
    } else {
      if (lot.asTarget.length === 0) {
        reasons.push(`Release blocked: Produced lot (${lot.lotType}) must have at least one input source relationship.`);
      }
    }

    // 2. Quality Status Check
    // If there are inspections, none can be HOLD or PENDING. Ideally at least one APPROVED.
    const hasHoldInspection = lot.inspections.some(i => i.status === QualityStatus.HOLD);
    const hasPendingInspection = lot.inspections.some(i => i.status === QualityStatus.PENDING);
    if (hasHoldInspection) {
      reasons.push('Release blocked: Lot has an inspection marked as HOLD (BR-004).');
    }
    if (hasPendingInspection) {
      reasons.push('Release blocked: Lot has pending inspections that must be completed.');
    }
    // We mandate at least 1 APPROVED inspection for release (strict quality gate)
    const hasApproved = lot.inspections.some(i => i.status === QualityStatus.APPROVED);
    if (!hasApproved && !hasHoldInspection && !hasPendingInspection) {
        reasons.push('Release blocked: Lot requires at least one APPROVED inspection.');
    }

    // 3. Evidence
    if (lot.evidences.length === 0) {
      // In a real system, we might check specific document types. For MVP, just presence.
      reasons.push('Release blocked: Mandatory evidence document is missing.');
    }

    // 4. Mass Balance (if applicable)
    if (lot.processOutputs.length > 0) {
      for (const po of lot.processOutputs) {
        if (po.event.massBalanceStatus === MassBalanceStatus.BLOCKED) {
          reasons.push(`Release blocked: Creating process event (${po.event.eventCode}) has a BLOCKED mass balance.`);
          break; // One blocked event is enough to block the lot
        }
      }
    }

    return {
      canRelease: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Attempts to release the lot. Throws BadRequestException if readiness checks fail.
   */
  async executeRelease(orgId: string, lotId: string, actorId: string): Promise<void> {
    const readiness = await this.checkReadiness(orgId, lotId);
    
    if (!readiness.canRelease) {
      throw new BadRequestException({
        message: 'Release blocked due to failed readiness checks.',
        reasons: readiness.reasons,
      });
    }

    // Perform the state transition inside a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.lot.update({
        where: { id: lotId },
        data: {
          status: LotStatus.RELEASED,
          releasedAt: new Date(),
          releasedById: actorId,
        },
      });

      await tx.lotEvent.create({
        data: {
          lotId: lotId,
          actorId: actorId,
          eventType: 'STATUS_CHANGED',
          payload: { from: 'READY', to: 'RELEASED', reason: 'Passed all release gates.' },
        }
      });
    });
  }
}
