import { BadRequestException } from '@nestjs/common';

/** netto = bruto − tara, validated server-side (never trust the client's netto). */
export function computeNetto(gross: number, tare: number): number {
  if (!(gross > 0)) throw new BadRequestException('Berat bruto harus lebih dari 0.');
  if (tare < 0) throw new BadRequestException('Berat tara tidak boleh negatif.');
  if (tare >= gross) throw new BadRequestException('Berat tara harus lebih kecil dari berat bruto.');
  return Math.round((gross - tare) * 1000) / 1000;
}

/** Converts a package size to the lot's unit (supports g ↔ kg). */
export function toLotUnit(size: number, packageUnit: string, lotUnit: string): number {
  const p = packageUnit.toLowerCase();
  const l = lotUnit.toLowerCase();
  if (p === l) return size;
  if (p === 'g' && l === 'kg') return size / 1000;
  if (p === 'kg' && l === 'g') return size * 1000;
  throw new BadRequestException(`Satuan kemasan "${packageUnit}" tidak kompatibel dengan satuan lot "${lotUnit}".`);
}
