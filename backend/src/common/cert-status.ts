export type CertStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED';

const DAY_MS = 86_400_000;

/** Computed from validUntil; an expired certificate must never be shown as valid. */
export function certStatus(validUntil: Date, now: Date = new Date()): CertStatus {
  // validUntil is inclusive through the end of that day (UTC).
  const endOfDay = Date.UTC(
    validUntil.getUTCFullYear(),
    validUntil.getUTCMonth(),
    validUntil.getUTCDate(),
    23,
    59,
    59,
    999,
  );
  const diff = endOfDay - now.getTime();
  if (diff < 0) return 'EXPIRED';
  if (diff < 90 * DAY_MS) return 'EXPIRING';
  return 'ACTIVE';
}
