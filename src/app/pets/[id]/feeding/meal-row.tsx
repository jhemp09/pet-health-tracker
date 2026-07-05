"use client";

import { useState, useTransition } from "react";
import { deleteFeedingLog, saveFeedingForDate } from "./actions";

type LogInfo = { id: string; percent_eaten: number; notes: string | null };

export function MealRow({
  petId,
  dateStr,
  scheduleId,
  label,
  timeLabel,
  log,
}: {
  petId: string;
  dateStr: string;
  scheduleId: string | null;
  label: string;
  timeLabel?: string;
  log: LogInfo | null;
}) {
  const [percent, setPercent] = useState(log?.percent_eaten?.toString() ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    const formData = new FormData();
    formData.set("percent_eaten", percent);
    formData.set("notes", notes);
    startTransition(async () => {
      await saveFeedingForDate(petId, scheduleId, dateStr, log?.id ?? null, formData);
      setSaved(true);
    });
  }

  function handleClear() {
    if (!log) return;
    startTransition(async () => {
      await deleteFeedingLog(petId, log.id);
      setPercent("");
      setNotes("");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-3">
      <div className="mr-auto min-w-[7rem]">
        <p className="text-sm font-medium">{label}</p>
        {timeLabel && <p className="text-xs text-gray-500">{timeLabel}</p>}
        {!timeLabel && <p className="text-xs text-gray-500">Extra feeding</p>}
      </div>
      <label className="flex flex-col gap-1 text-xs">
        % eaten
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="—"
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Notes
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={isPending || percent === ""}
        onClick={handleSave}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Save
      </button>
      {log && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleClear}
          className="text-xs text-red-600 underline"
        >
          Clear
        </button>
      )}
      {saved && !isPending && (
        <span className="text-xs text-green-700">Saved</span>
      )}
    </div>
  );
}
