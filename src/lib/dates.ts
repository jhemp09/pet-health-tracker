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

// Whether a medication scheduled every `intervalDays` days (anchored at
// `startDate`) is due on `targetDate`. All three are "YYYY-MM-DD" calendar
// day strings, so this is pure date arithmetic with no timezone involved.
// Dates before the anchor are treated as due, so editing historical entries
// from before an interval was configured isn't hidden by the filter.
// Renders a birth date as a human age like "3 years" or "8 months", using
// whole months once past a year so early life stages stay legible.
export function formatAge(birthDate: string, now: Date): string {
  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  const nowUtc = new Date(
    `${now.toISOString().slice(0, 10)}T00:00:00.000Z`
  );
  let months =
    (nowUtc.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (nowUtc.getUTCMonth() - birth.getUTCMonth());
  if (nowUtc.getUTCDate() < birth.getUTCDate()) months -= 1;
  months = Math.max(0, months);

  if (months < 1) return "newborn";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

export function isDueOnInterval(
  startDate: string | null,
  targetDate: string,
  intervalDays: number
): boolean {
  if (intervalDays <= 1 || !startDate || targetDate < startDate) return true;
  const diffDays = Math.round(
    (Date.parse(targetDate) - Date.parse(startDate)) / (24 * 60 * 60 * 1000)
  );
  return diffDays % intervalDays === 0;
}
