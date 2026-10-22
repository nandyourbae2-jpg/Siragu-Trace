import { BadRequestException } from '@nestjs/common';

export type BpomTypeName = 'MD' | 'ML' | 'PIRT';

export const BPOM_CHECK_URL = 'https://cekbpom.pom.go.id/';
export const HALAL_CHECK_URL = 'https://bpjph.halal.go.id/search_prod';

interface Rule {
  re: RegExp;
  canonical: (digits: string) => string;
  message: string;
}

// Assumption (to be confirmed by owner before go-live): MD/ML = prefix + 12 digits;
// P-IRT/SPP-IRT = 15 digits. See docs/AUDIT-GOLIVE.md, decision 1.
const RULES: Record<BpomTypeName, Rule> = {
  MD: {
    re: /^MD\s?(\d{12})$/i,
    canonical: (d) => `MD ${d}`,
    message: 'Nomor MD harus berformat "MD" diikuti 12 digit (contoh: MD 123456789012).',
  },
  ML: {
    re: /^ML\s?(\d{12})$/i,
    canonical: (d) => `ML ${d}`,
    message: 'Nomor ML harus berformat "ML" diikuti 12 digit (contoh: ML 123456789012).',
  },
  PIRT: {
    re: /^(?:P-?IRT|SPP-?IRT)?\s?(?:No\.?\s?)?(\d{15})$/i,
    canonical: (d) => `P-IRT ${d}`,
    message: 'Nomor P-IRT/SPP-IRT harus terdiri dari 15 digit (contoh: P-IRT 206337401000124).',
  },
};

/** Validates and returns the canonical BPOM number for the declared type. */
export function validateBpom(type: BpomTypeName, raw: string): string {
  const rule = RULES[type];
  if (!rule) throw new BadRequestException('Jenis nomor BPOM tidak dikenal.');
  const m = rule.re.exec(raw.trim());
  if (!m) throw new BadRequestException(rule.message);
  return rule.canonical(m[1]);
}

/** Halal number is stored as typed; only basic sanity checks apply. */
export function validateHalalNumber(raw: string): string {
  const v = raw.trim();
  if (!/^[A-Za-z0-9./\- ]{5,40}$/.test(v)) {
    throw new BadRequestException('Nomor sertifikat halal tidak valid (5–40 karakter huruf/angka).');
  }
  return v;
}
