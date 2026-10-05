/**
 * Lot State Machine Service — SIRAGU Trace (§50).
 *
 * All lot status transitions go through this service.
 * Direct Prisma updates that bypass this are not allowed for status changes.
 *
 * Valid transitions:
 *   DRAFT      → RECEIVED
 *   RECEIVED   → IN_PROCESS | HOLD
 *   IN_PROCESS → READY | HOLD | BLOCKED
 *   READY      → RELEASED | IN_PROCESS | HOLD
 *   RELEASED   → CLOSED
 *   HOLD       → IN_PROCESS | BLOCKED | CLOSED
 *   BLOCKED    → CLOSED  (OWNER only — enforced in controller)
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { LotStatus } from '@prisma/client';

export type TransitionResult =
  | { ok: true; nextStatus: LotStatus }
  | { ok: false; reason: string };

// Adjacency map for the state machine
const ALLOWED_TRANSITIONS: Record<LotStatus, LotStatus[]> = {
  DRAFT: [LotStatus.RECEIVED],
  RECEIVED: [LotStatus.IN_PROCESS, LotStatus.HOLD],
  IN_PROCESS: [LotStatus.READY, LotStatus.HOLD, LotStatus.BLOCKED],
  READY: [LotStatus.RELEASED, LotStatus.IN_PROCESS, LotStatus.HOLD],
  RELEASED: [LotStatus.CLOSED],
  HOLD: [LotStatus.IN_PROCESS, LotStatus.BLOCKED, LotStatus.CLOSED],
  BLOCKED: [LotStatus.CLOSED],
  CLOSED: [], // terminal
};

@Injectable()
export class LotStateMachineService {
  /**
   * Validate a proposed transition. Returns {ok:true} or {ok:false, reason}.
   */
  validate(current: LotStatus, next: LotStatus): TransitionResult {
    const allowed = ALLOWED_TRANSITIONS[current];
    if (allowed.includes(next)) {
      return { ok: true, nextStatus: next };
    }
    return {
      ok: false,
      reason: `Cannot transition from ${current} to ${next}. Allowed: [${allowed.join(', ') || 'none — terminal state'}].`,
    };
  }

  /**
   * Validate and throw BadRequestException if invalid.
   */
  assert(current: LotStatus, next: LotStatus): void {
    const result = this.validate(current, next);
    if (!result.ok) throw new BadRequestException(result.reason);
  }

  /**
   * Returns all valid next statuses from a given state.
   */
  nextStates(current: LotStatus): LotStatus[] {
    return ALLOWED_TRANSITIONS[current] ?? [];
  }
}
