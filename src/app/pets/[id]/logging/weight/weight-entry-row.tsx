"use client";

import { useState, useTransition } from "react";
import { deleteWeightLog, updateWeightLog } from "./actions";

type LogEntry = {
  id: string;
  weight: number;
  unit: string;
  logged_at: string;
  notes: string | null;
};

export function WeightEntryRow({
  petId,
  log,
}: {
  petId: string;
  log: LogEntry;
}) {
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(log.weight.toString());
  const [unit, setUnit] = useState(log.unit);
  const [notes, setNotes] = useState(log.notes ?? "");
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-2">
        <label className="flex flex-col gap-1 text-xs">
          Weight
          <input
            type="number"
            step={0.1}
            min={0}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Unit
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
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
          disabled={isPending}
          onClick={() => {
            const formData = new FormData();
            formData.set("weight", weight);
            formData.set("unit", unit);
            formData.set("notes", notes);
            startTransition(async () => {
              await updateWeightLog(petId, log.id, formData);
              setEditing(false);
            });
          }}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-gray-500 underline"
        >
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between text-sm text-gray-700">
      <span>
        {new Date(log.logged_at).toLocaleString()} — {log.weight} {log.unit}
        {log.notes ? ` — ${log.notes}` : ""}
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-blue-600 underline"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteWeightLog(petId, log.id))}
          className="text-xs text-red-600 underline"
        >
          Delete
        </button>
      </span>
    </li>
  );
}
