import { randomInt } from 'node:crypto';

/** Crockford base32 alphabet: no I, L, O, U (avoids look-alikes and accidental words). */
export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Cryptographically random, non-sequential token (default 10 chars ≈ 50 bits). */
export function generateToken(length = 10): string {
  let out = '';
  for (let i = 0; i < length; i++) out += CROCKFORD[randomInt(CROCKFORD.length)];
  return out;
}

/** Normalises user-typed tokens: uppercase, Crockford look-alike mapping (O→0, I/L→1). */
export function normalizeToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
}

export function isValidTokenShape(raw: string): boolean {
  return /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{10,12}$/.test(normalizeToken(raw));
}
