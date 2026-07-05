"use client";

import { useState, useTransition } from "react";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
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
  const [saved, setSaved] = useState(false);

  function triggerSave(nextWeight: string, nextUnit: string, nextNotes: string) {
    if (nextWeight === "" || Number(nextWeight) <= 0) return;
    setSaved(false);
    const formData = new FormData();
    formData.set("weight", nextWeight);
    formData.set("unit", nextUnit);
    formData.set("notes", nextNotes);
    startTransition(async () => {
      await updateWeightLog(petId, log.id, formData);
      setSaved(true);
    });
  }

  const debouncedSave = useDebouncedCallback(triggerSave, 700);

  if (editing) {
    return (
      <li className="card flex flex-wrap items-end gap-2 p-2">
        <label className="flex flex-col gap-1 text-xs">
          Weight
          <input
            type="number"
            step={0.1}
            min={0}
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              debouncedSave(e.target.value, unit, notes);
            }}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Unit
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              triggerSave(weight, e.target.value, notes);
            }}
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
            onChange={(e) => {
              setNotes(e.target.value);
              debouncedSave(weight, unit, e.target.value);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-gray-500 underline"
        >
          Done
        </button>
        {isPending && <span className="text-xs text-gray-400">Saving…</span>}
        {saved && !isPending && (
          <span className="text-xs text-green-700">Saved</span>
        )}
      </li>
    );
  }

  return (
    <li className="card flex items-center justify-between px-3 py-2 text-sm">
      <span>
        <span className="font-semibold" style={{ color: "var(--color-weight)" }}>
          {log.weight} {log.unit}
        </span>
        <span style={{ color: "var(--color-muted)" }}>
          {" "}
          · {new Date(log.logged_at).toLocaleString()}
          {log.notes ? ` — ${log.notes}` : ""}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs underline"
          style={{ color: "var(--color-primary)" }}
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
