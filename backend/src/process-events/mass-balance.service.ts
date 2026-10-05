/**
 * Mass Balance Service — SIRAGU Trace (§15).
 *
 * Formula: Input = Output + Waste + Remaining + Held/Other Accounted
 *
 * Tolerance thresholds:
 *   BALANCED : |diff| ≤ 0.5% of total input
 *   WARNING  : 0.5% < |diff| ≤ 5.0%  (explanation required)
 *   BLOCKED  : |diff| > 5.0%          (admin override required)
 *
 * No quantity is allowed to disappear silently (BR-002).
 */

import { Injectable } from '@nestjs/common';
import { MassBalanceStatus } from '@prisma/client';

export interface MassBalanceInput {
  totalInput: number;   // sum of all input quantities (same unit assumed)
  totalOutput: number;  // sum of all output quantities
  totalWaste: number;   // sum of all waste quantities
  totalRemaining: number; // sum of all remaining quantities
}

export interface MassBalanceResult {
  status: MassBalanceStatus;
  diff: number;          // input - (output + waste + remaining); positive = unaccounted
  diffPct: number;       // |diff| / totalInput * 100
  isValid: boolean;      // false if BLOCKED
}

const BALANCED_THRESHOLD_PCT = 0.5;
const WARNING_THRESHOLD_PCT  = 5.0;

@Injectable()
export class MassBalanceService {
  compute(data: MassBalanceInput): MassBalanceResult {
    const { totalInput, totalOutput, totalWaste, totalRemaining } = data;

    // Guard: avoid division by zero for empty events
    if (totalInput === 0) {
      return { status: MassBalanceStatus.BALANCED, diff: 0, diffPct: 0, isValid: true };
    }

    const accounted = totalOutput + totalWaste + totalRemaining;
    const diff      = totalInput - accounted;
    const diffPct   = Math.abs(diff / totalInput) * 100;

    let status: MassBalanceStatus;
    if (diffPct <= BALANCED_THRESHOLD_PCT) {
      status = MassBalanceStatus.BALANCED;
    } else if (diffPct <= WARNING_THRESHOLD_PCT) {
      status = MassBalanceStatus.WARNING;
    } else {
      status = MassBalanceStatus.BLOCKED;
    }

    return {
      status,
      diff: parseFloat(diff.toFixed(6)),
      diffPct: parseFloat(diffPct.toFixed(4)),
      isValid: status !== MassBalanceStatus.BLOCKED,
    };
  }
}
