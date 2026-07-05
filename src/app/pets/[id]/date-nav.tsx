"use client";

import { useRouter } from "next/navigation";

function shiftDate(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function DateNav({
  basePath,
  selectedDate,
  todayDate,
}: {
  basePath: string;
  selectedDate: string;
  todayDate: string;
}) {
  const router = useRouter();

  function goTo(dateStr: string) {
    const suffix = dateStr === todayDate ? "" : `?date=${dateStr}`;
    router.push(`${basePath}${suffix}`);
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => goTo(shiftDate(selectedDate, -1))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-sm hover:bg-gray-50"
        aria-label="Previous day"
      >
        ←
      </button>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => e.target.value && goTo(e.target.value)}
        max={todayDate}
        className="w-[8.5rem] min-w-0 rounded-full border border-gray-200 px-2 py-1.5 text-sm"
      />
      <button
        type="button"
        onClick={() => goTo(shiftDate(selectedDate, 1))}
        disabled={selectedDate >= todayDate}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40"
        aria-label="Next day"
      >
        →
      </button>
      {selectedDate !== todayDate && (
        <button
          type="button"
          onClick={() => goTo(todayDate)}
          className="rounded-full px-2 py-1 text-xs font-medium underline"
          style={{ color: "var(--color-primary)" }}
        >
          Today
        </button>
      )}
    </div>
  );
}
