// Helpers for the once-daily reminder digest. Vercel's Hobby plan only
// allows cron jobs that run once per day, so instead of nudging someone at
// the exact minute a meal or dose is due, the cron route runs once daily (at
// a fixed UTC time — see vercel.json) and reports what hasn't been logged
// yet in the pet's household-local "today".

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
