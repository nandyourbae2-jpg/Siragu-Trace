/** Format B{YY}-{MMDD}-{NN}, e.g. 12 Sept 2024, 7th batch → B24-0912-07. */
export function formatBatchNumber(day: string, seq: number): string {
  // day is YYYYMMDD in Asia/Jakarta
  const yy = day.slice(2, 4);
  const mmdd = day.slice(4, 8);
  return `B${yy}-${mmdd}-${String(seq).padStart(2, '0')}`;
}

/** YYYYMMDD for the Asia/Jakarta calendar day of the given instant. */
export function jakartaDay(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts.replaceAll('-', '');
}
