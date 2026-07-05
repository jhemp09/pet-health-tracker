"use client";

export function TimezoneInput() {
  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  return <input type="hidden" name="timezone" value={timezone} readOnly />;
}
