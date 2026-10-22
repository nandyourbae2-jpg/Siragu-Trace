import { describe, it, expect } from 'vitest';
import { generateToken, isValidTokenShape, CROCKFORD } from './crockford.js';
import { formatBatchNumber, jakartaDay } from './batch-number.js';
import { validateBpom, validateHalalNumber } from './bpom.js';
import { certStatus } from './cert-status.js';
import { computeNetto, toLotUnit } from './weights.js';

describe('token', () => {
  it('is 10 chars Crockford and unique-ish', () => {
    const set = new Set(Array.from({ length: 2000 }, () => generateToken()));
    expect(set.size).toBe(2000);
    for (const t of set) {
      expect(t).toHaveLength(10);
      for (const c of t) expect(CROCKFORD).toContain(c);
      expect(isValidTokenShape(t)).toBe(true);
    }
  });
  it('rejects bad shapes', () => {
    expect(isValidTokenShape('short')).toBe(false);
    expect(isValidTokenShape('../etc/passwd')).toBe(false);
  });
});

describe('batch number', () => {
  it('formats B{YY}-{MMDD}-{NN}', () => expect(formatBatchNumber('20240912', 7)).toBe('B24-0912-07'));
  it('uses the Jakarta calendar day (UTC 17:30 is already next day)', () => {
    expect(jakartaDay(new Date('2026-10-22T17:30:00Z'))).toBe('20261023');
  });
});

describe('bpom', () => {
  it('accepts valid MD and canonicalises', () => expect(validateBpom('MD', 'md123456789012')).toBe('MD 123456789012'));
  it('rejects NA cosmetic-style numbers for MD', () => {
    expect(() => validateBpom('MD', 'NA1824123456')).toThrow(/MD/);
  });
  it('validates P-IRT 15 digits', () => {
    expect(validateBpom('PIRT', '206337401000124')).toBe('P-IRT 206337401000124');
    expect(() => validateBpom('PIRT', '123')).toThrow();
  });
  it('halal minimal validation', () => {
    expect(validateHalalNumber('ID32110001234560123')).toBeTruthy();
    expect(() => validateHalalNumber('  ')).toThrow();
  });
});

describe('certStatus', () => {
  const now = new Date('2026-10-22T00:00:00Z');
  it('expired is never active', () => expect(certStatus(new Date('2024-11-10'), now)).toBe('EXPIRED'));
  it('<90 days is expiring', () => expect(certStatus(new Date('2026-12-01'), now)).toBe('EXPIRING'));
  it('>90 days is active', () => expect(certStatus(new Date('2028-12-31'), now)).toBe('ACTIVE'));
  it('valid through the end of the last day', () => expect(certStatus(new Date('2026-10-22'), now)).toBe('EXPIRING'));
});

describe('weights', () => {
  it('netto = bruto - tara', () => expect(computeNetto(105.5, 5.5)).toBe(100));
  it('rejects tara >= bruto', () => expect(() => computeNetto(10, 10)).toThrow());
  it('converts g to kg', () => expect(toLotUnit(250, 'g', 'kg')).toBe(0.25));
  it('rejects incompatible units', () => expect(() => toLotUnit(1, 'pcs', 'kg')).toThrow());
});
