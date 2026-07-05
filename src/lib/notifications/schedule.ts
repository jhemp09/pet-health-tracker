// Helpers for figuring out whether a scheduled reminder is "due" right now,
// in a household's own timezone. The cron route is expected to run every
// CRON_WINDOW_MINUTES minutes; a reminder is due if its scheduled time falls
// within the window that just elapsed since the previous run. This doesn't
// handle the midnight wraparound edge case (e.g. a window spanning 23:55 ->
// 00:05), which is an acceptable simplification for reminders like feeding
// times that aren't set right at midnight.

export const WINDOW_MINUTES = Number(process.env.CRON_WINDOW_MINUTES ?? 15);

export function localParts(timezone: string, now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((p) => [p.type, p.value])
  );

  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const minute = Number(parts.minute);

  return {
    weekday: parts.weekday, // "Mon", "Tue", ...
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

export function timeStringToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function isDue(
  scheduledMinutes: number,
  nowMinutes: number,
  windowMinutes = WINDOW_MINUTES
) {
  return (
    scheduledMinutes <= nowMinutes &&
    scheduledMinutes > nowMinutes - windowMinutes
  );
}
