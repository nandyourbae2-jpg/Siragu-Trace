/**
 * Helper format tanggal & angka — SIRAGU Trace.
 *
 * Seluruh timestamp disimpan dalam format lokal `YYYY-MM-DD HH:mm`
 * agar mudah dibaca dan konsisten antar halaman.
 */

const pad = (n: number) => String(n).padStart(2, '0');

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Format Date → `YYYY-MM-DD HH:mm` (waktu lokal). */
export function toStamp(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Stempel waktu sekarang. */
export const nowStamp = () => toStamp(new Date());

/** Stempel waktu `days` hari yang lalu pada jam tertentu (HH:mm). */
export function stampDaysAgo(days: number, time = '08:00'): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return toStamp(d);
}

/** Tanggal (YYYY-MM-DD) `days` hari dari sekarang (bisa negatif). */
export function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse `YYYY-MM-DD[ HH:mm]` → Date. */
export function parseStamp(stamp: string): Date {
  const [datePart, timePart = '00:00'] = stamp.split(' ');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0);
}

/** True jika stempel berada di hari ini. */
export function isToday(stamp: string): boolean {
  return stamp.slice(0, 10) === nowStamp().slice(0, 10);
}

/** `5 Okt 2026, 08:15` */
export function formatDateTime(stamp: string): string {
  const d = parseStamp(stamp);
  if (Number.isNaN(d.getTime())) return stamp;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `5 Okt 2026` */
export function formatDate(stamp: string): string {
  const d = parseStamp(stamp);
  if (Number.isNaN(d.getTime())) return stamp;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** Selisih hari dari hari ini ke tanggal target (positif = masa depan). */
export function daysUntil(date: string): number {
  const target = parseStamp(date);
  const today = parseStamp(nowStamp().slice(0, 10));
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Waktu relatif singkat: "baru saja", "5 menit lalu", "2 hari lalu". */
export function timeAgo(stamp: string): string {
  const diffMs = Date.now() - parseStamp(stamp).getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return 'baru saja';
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.round(hr / 24);
  return `${day} hari lalu`;
}

/** Format angka gaya Indonesia (titik ribuan, koma desimal). */
export function formatNumber(n: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: maxFractionDigits }).format(n);
}

/** `12,5 kg` */
export const formatKg = (n: number) => `${formatNumber(n, 2)} kg`;
