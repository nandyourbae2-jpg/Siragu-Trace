/**
 * Pure temperature/RH scoring for shipment boxes (WS5).
 * Rules (configurable per product, defaults from spec):
 *   min..normalMax  → normal         (20–26 °C)
 *   >normalMax..alarm → warning      (>26–27 °C)
 *   >alarm          → deviation      (>27 °C, duration accumulated)
 *   <min            → below range    (recorded as a note, not a deviation)
 * RH > rhAlarm is a separate quality risk (caking), tracked as a supporting channel.
 */

export type TempStatusName = 'NO_DATA' | 'OK' | 'WARNING' | 'DEVIATION';

export interface TempSpec {
  minC: number;
  normalMaxC: number;
  alarmC: number;
  rhAlarmPct: number;
}

export const DEFAULT_SPEC: TempSpec = { minC: 20, normalMaxC: 26, alarmC: 27, rhAlarmPct: 65 };

export interface ReadingInput {
  ts: Date;
  tempC: number;
  rhPct?: number | null;
}

export interface TempSummaryResult {
  status: TempStatusName;
  count: number;
  minC: number | null;
  avgC: number | null;
  maxC: number | null;
  warningCount: number;
  deviationCount: number;
  deviationMinutes: number;
  belowRangeCount: number;
  maxRhPct: number | null;
  rhExceedCount: number;
  firstTs: Date | null;
  lastTs: Date | null;
}

/** A gap longer than this between two readings is not counted as continuous deviation. */
export const MAX_GAP_MINUTES = 60;

export function classify(tempC: number, spec: TempSpec): 'below' | 'normal' | 'warning' | 'deviation' {
  if (tempC > spec.alarmC) return 'deviation';
  if (tempC > spec.normalMaxC) return 'warning';
  if (tempC < spec.minC) return 'below';
  return 'normal';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(input: ReadingInput[], spec: TempSpec = DEFAULT_SPEC): TempSummaryResult {
  if (input.length === 0) {
    return {
      status: 'NO_DATA', count: 0, minC: null, avgC: null, maxC: null, warningCount: 0,
      deviationCount: 0, deviationMinutes: 0, belowRangeCount: 0, maxRhPct: null,
      rhExceedCount: 0, firstTs: null, lastTs: null,
    };
  }
  const rs = [...input].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  let sum = 0, min = Infinity, max = -Infinity;
  let warning = 0, deviation = 0, below = 0, rhExceed = 0;
  let maxRh: number | null = null;
  let devMs = 0;
  let prevGapMs = 0;

  rs.forEach((r, i) => {
    sum += r.tempC;
    min = Math.min(min, r.tempC);
    max = Math.max(max, r.tempC);
    const c = classify(r.tempC, spec);
    if (c === 'warning') warning++;
    if (c === 'deviation') deviation++;
    if (c === 'below') below++;
    if (r.rhPct != null) {
      maxRh = maxRh === null ? r.rhPct : Math.max(maxRh, r.rhPct);
      if (r.rhPct > spec.rhAlarmPct) rhExceed++;
    }
    const next = rs[i + 1];
    const gap = next
      ? Math.min(next.ts.getTime() - r.ts.getTime(), MAX_GAP_MINUTES * 60_000)
      : prevGapMs; // last reading reuses the previous interval
    prevGapMs = gap;
    if (c === 'deviation') devMs += gap;
  });

  const status: TempStatusName = deviation > 0 ? 'DEVIATION' : warning > 0 ? 'WARNING' : 'OK';
  return {
    status,
    count: rs.length,
    minC: round2(min),
    avgC: round2(sum / rs.length),
    maxC: round2(max),
    warningCount: warning,
    deviationCount: deviation,
    deviationMinutes: Math.round(devMs / 60_000),
    belowRangeCount: below,
    maxRhPct: maxRh,
    rhExceedCount: rhExceed,
    firstTs: rs[0].ts,
    lastTs: rs[rs.length - 1].ts,
  };
}

// ── Ingest validation ────────────────────────────────────────────────────────

export const TEMP_RANGE = { min: -40, max: 85 };

export function isPlausibleReading(r: { tempC: number; rhPct?: number | null }): boolean {
  if (!Number.isFinite(r.tempC) || r.tempC < TEMP_RANGE.min || r.tempC > TEMP_RANGE.max) return false;
  if (r.rhPct != null && (!Number.isFinite(r.rhPct) || r.rhPct < 0 || r.rhPct > 100)) return false;
  return true;
}

// ── Simulator (demo + tests) ─────────────────────────────────────────────────

export type Scenario = 'normal' | 'warning' | 'deviation';

/** Deterministic PRNG (mulberry32) so simulator output is reproducible in tests. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateReadings(opts: {
  scenario: Scenario;
  start: Date;
  points: number;
  intervalMinutes: number;
  seed?: number;
}): Required<ReadingInput>[] {
  const rand = rng(opts.seed ?? 42);
  const out: Required<ReadingInput>[] = [];
  for (let i = 0; i < opts.points; i++) {
    const t = i / Math.max(1, opts.points - 1);
    const daily = Math.sin(t * Math.PI * 2) * 0.8;
    let temp = 23 + daily + (rand() - 0.5) * 0.8; // always inside 22–24.2 for "normal"
    if (opts.scenario === 'warning' && t > 0.4 && t < 0.6) temp = 26.4 + rand() * 0.5;
    if (opts.scenario === 'deviation' && t > 0.5 && t < 0.7) temp = 27.6 + rand() * 1.4;
    const rh = 55 + Math.sin(t * Math.PI) * 6 + rand() * 2;
    out.push({
      ts: new Date(opts.start.getTime() + i * opts.intervalMinutes * 60_000),
      tempC: round2(temp),
      rhPct: round2(rh),
    });
  }
  return out;
}
