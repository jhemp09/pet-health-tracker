"use client";

import { useState, useTransition } from "react";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import { deleteFeedingLog, saveFeedingForDate } from "./actions";
import { MealFoodsList } from "./meal-foods-list";

type LogInfo = { id: string; percent_eaten: number; notes: string | null };
type Food = {
  id: string;
  url: string;
  title: string | null;
  image_url: string | null;
  amount: string | null;
};

export function MealRow({
  petId,
  dateStr,
  scheduleId,
  label,
  timeLabel,
  log,
  foods = [],
}: {
  petId: string;
  dateStr: string;
  scheduleId: string | null;
  label: string;
  timeLabel?: string;
  log: LogInfo | null;
  foods?: Food[];
}) {
  const [percent, setPercent] = useState(log?.percent_eaten?.toString() ?? "");
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function triggerSave(nextPercent: string, nextNotes: string) {
    if (nextPercent === "") return;
    setSaved(false);
    const formData = new FormData();
    formData.set("percent_eaten", nextPercent);
    formData.set("notes", nextNotes);
    startTransition(async () => {
      await saveFeedingForDate(petId, scheduleId, dateStr, log?.id ?? null, formData);
      setSaved(true);
    });
  }

  const debouncedSave = useDebouncedCallback(triggerSave, 700);

  function handleClear() {
    if (!log) return;
    startTransition(async () => {
      await deleteFeedingLog(petId, log.id);
      setPercent("");
      setNotes("");
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 p-3">
      <div className="flex flex-wrap items-end gap-2">
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
            onChange={(e) => {
              setPercent(e.target.value);
              debouncedSave(e.target.value, notes);
            }}
            placeholder="—"
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Notes
          <input
            type="text"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              debouncedSave(percent, e.target.value);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
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
        {isPending && <span className="text-xs text-gray-400">Saving…</span>}
        {saved && !isPending && (
          <span className="text-xs text-green-700">Saved</span>
        )}
      </div>

      {scheduleId && (
        <MealFoodsList petId={petId} scheduleId={scheduleId} foods={foods} />
      )}
    </div>
  );
}
