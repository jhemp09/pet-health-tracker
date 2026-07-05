"use client";

import { useState, useTransition } from "react";
import { saveFeedingForDate } from "./actions";

export function ExtraFeedingForm({
  petId,
  dateStr,
}: {
  petId: string;
  dateStr: string;
}) {
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState("100");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm underline"
      >
        + Add extra feeding
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-dashed border-gray-300 p-3">
      <label className="flex flex-col gap-1 text-xs">
        % eaten
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Notes
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. treat, snack"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={isPending || percent === ""}
        onClick={() => {
          const formData = new FormData();
          formData.set("percent_eaten", percent);
          formData.set("notes", notes);
          startTransition(async () => {
            await saveFeedingForDate(petId, null, dateStr, null, formData);
            setOpen(false);
            setPercent("100");
            setNotes("");
          });
        }}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-gray-500 underline"
      >
        Cancel
      </button>
    </div>
  );
}
