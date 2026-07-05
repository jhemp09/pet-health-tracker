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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => goTo(shiftDate(selectedDate, -1))}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        aria-label="Previous day"
      >
        ←
      </button>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => e.target.value && goTo(e.target.value)}
        max={todayDate}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <button
        type="button"
        onClick={() => goTo(shiftDate(selectedDate, 1))}
        disabled={selectedDate >= todayDate}
        className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
        aria-label="Next day"
      >
        →
      </button>
      {selectedDate !== todayDate && (
        <button
          type="button"
          onClick={() => goTo(todayDate)}
          className="text-sm underline"
        >
          Today
        </button>
      )}
    </div>
  );
}
