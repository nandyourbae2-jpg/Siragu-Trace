import { describe, it, expect } from 'vitest';
import { classify, summarize, simulateReadings, isPlausibleReading, DEFAULT_SPEC } from './temp-scoring.js';

const t0 = new Date('2026-10-01T00:00:00Z');
const at = (min: number, tempC: number, rhPct?: number) => ({ ts: new Date(t0.getTime() + min * 60_000), tempC, rhPct });

describe('classify (boundaries)', () => {
  it('20 and 26 are normal', () => {
    expect(classify(20, DEFAULT_SPEC)).toBe('normal');
    expect(classify(26, DEFAULT_SPEC)).toBe('normal');
  });
  it('>26..27 is warning (27.0 inclusive)', () => {
    expect(classify(26.01, DEFAULT_SPEC)).toBe('warning');
    expect(classify(27, DEFAULT_SPEC)).toBe('warning');
  });
  it('>27 is deviation, <20 is below range', () => {
    expect(classify(27.01, DEFAULT_SPEC)).toBe('deviation');
    expect(classify(19.9, DEFAULT_SPEC)).toBe('below');
  });
});

describe('summarize', () => {
  it('returns NO_DATA for empty input (never invents values)', () => {
    const s = summarize([]);
    expect(s.status).toBe('NO_DATA');
    expect(s.minC).toBeNull();
  });
  it('accumulates deviation minutes and caps long gaps', () => {
    const s = summarize([at(0, 24), at(10, 28), at(20, 28.5), at(30, 24), at(500, 28)]);
    expect(s.status).toBe('DEVIATION');
    expect(s.deviationCount).toBe(3);
    // 10 + 10 minutes, plus last reading reuses previous gap capped at 60 → 60
    expect(s.deviationMinutes).toBe(80);
  });
  it('below range alone does not raise status', () => {
    const s = summarize([at(0, 18), at(10, 22)]);
    expect(s.status).toBe('OK');
    expect(s.belowRangeCount).toBe(1);
  });
  it('tracks RH > 65 as a separate channel', () => {
    const s = summarize([at(0, 23, 60), at(10, 23, 70)]);
    expect(s.status).toBe('OK');
    expect(s.rhExceedCount).toBe(1);
    expect(s.maxRhPct).toBe(70);
  });
});

describe('simulator scenarios', () => {
  const base = { start: t0, points: 2000, intervalMinutes: 5 };
  it('normal → OK', () => expect(summarize(simulateReadings({ ...base, scenario: 'normal' })).status).toBe('OK'));
  it('warning → WARNING', () => expect(summarize(simulateReadings({ ...base, scenario: 'warning' })).status).toBe('WARNING'));
  it('deviation → DEVIATION with duration', () => {
    const s = summarize(simulateReadings({ ...base, scenario: 'deviation' }));
    expect(s.status).toBe('DEVIATION');
    expect(s.deviationMinutes).toBeGreaterThan(0);
  });
  it('is deterministic', () => {
    expect(simulateReadings({ ...base, scenario: 'normal' })).toEqual(simulateReadings({ ...base, scenario: 'normal' }));
  });
});

describe('isPlausibleReading', () => {
  it('rejects absurd values', () => {
    expect(isPlausibleReading({ tempC: 999 })).toBe(false);
    expect(isPlausibleReading({ tempC: 23, rhPct: 140 })).toBe(false);
    expect(isPlausibleReading({ tempC: 23, rhPct: 60 })).toBe(true);
  });
});
