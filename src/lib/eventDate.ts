/**
 * Parse an event date value into a local-time Date.
 *
 * Supabase returns `event_date` as a plain `YYYY-MM-DD` string (no time, no
 * zone). Passing that directly to `new Date()` parses it as UTC midnight,
 * which renders as the previous day in any timezone west of UTC. We need
 * the date to represent the calendar day the host picked, so we construct
 * the Date in local time instead.
 */
export function parseEventDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;

  // Bare YYYY-MM-DD -> build in local time so the displayed day matches input.
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (ymd) {
    return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  }

  // YYYY-MM-DD followed by a time (no zone) -> also treat as local.
  const ymdT = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (ymdT) {
    return new Date(
      Number(ymdT[1]),
      Number(ymdT[2]) - 1,
      Number(ymdT[3]),
      Number(ymdT[4]),
      Number(ymdT[5]),
      Number(ymdT[6] ?? 0),
    );
  }

  // Full ISO with offset / Z — trust the engine.
  return new Date(value);
}
