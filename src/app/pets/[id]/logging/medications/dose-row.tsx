"use client";

import { useState, useTransition } from "react";
import { deleteMedicationLog, saveMedicationForDate } from "./actions";

type LogInfo = { id: string; given: boolean; notes: string | null };

export function DoseRow({
  petId,
  dateStr,
  medicationId,
  scheduleTimeId,
  label,
  timeLabel,
  log,
}: {
  petId: string;
  dateStr: string;
  medicationId: string;
  scheduleTimeId: string | null;
  label: string;
  timeLabel?: string;
  log: LogInfo | null;
}) {
  const [given, setGiven] = useState<boolean | null>(log?.given ?? null);
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave(value: boolean) {
    setGiven(value);
    setSaved(false);
    const formData = new FormData();
    formData.set("given", String(value));
    formData.set("notes", notes);
    startTransition(async () => {
      await saveMedicationForDate(
        petId,
        medicationId,
        scheduleTimeId,
        dateStr,
        log?.id ?? null,
        formData
      );
      setSaved(true);
    });
  }

  function handleClear() {
    if (!log) return;
    startTransition(async () => {
      await deleteMedicationLog(petId, log.id);
      setGiven(null);
      setNotes("");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-3">
      <div className="mr-auto min-w-[7rem]">
        <p className="text-sm font-medium">{label}</p>
        {timeLabel && <p className="text-xs text-gray-500">{timeLabel}</p>}
        {!timeLabel && <p className="text-xs text-gray-500">Extra dose</p>}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSave(true)}
          className={`rounded px-3 py-1.5 text-sm text-white disabled:opacity-50 ${
            given === true ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          Given
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleSave(false)}
          className={`rounded px-3 py-1.5 text-sm text-white disabled:opacity-50 ${
            given === false ? "bg-gray-600" : "bg-gray-300"
          }`}
        >
          Not given
        </button>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        Notes
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
      {saved && !isPending && (
        <span className="text-xs text-green-700">Saved</span>
      )}
    </div>
  );
}
