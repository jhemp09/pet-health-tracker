// Timezone-aware date helpers shared across the cron digest and the
// per-pet UI (which lets you view/edit logs for a specific household-local
// calendar day).

export function localDateStr(timezone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // "YYYY-MM-DD"
}

export function daysSince(timezone: string, isoTimestamp: string, now: Date) {
  const then = localDateStr(timezone, new Date(isoTimestamp));
  const today = localDateStr(timezone, now);
  const diffMs = Date.parse(today) - Date.parse(then);
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

// Returns the UTC instant for noon on `dateStr` (YYYY-MM-DD) as experienced
// in `timezone`. Used when creating a log for a specific past/future day
// where only the calendar day matters, not the exact time — noon avoids any
// chance of the stored UTC instant rounding into the adjacent local day.
export function localNoonInstant(timezone: string, dateStr: string): Date {
  const naiveUtc = new Date(`${dateStr}T12:00:00.000Z`);
  const asIfUtc = new Date(naiveUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  const asIfTimezone = new Date(
    naiveUtc.toLocaleString("en-US", { timeZone: timezone })
  );
  const offset = asIfUtc.getTime() - asIfTimezone.getTime();
  return new Date(naiveUtc.getTime() + offset);
}
