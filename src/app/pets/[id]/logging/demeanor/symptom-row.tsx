"use client";

import { useState, useTransition } from "react";
import { RELATIVE_5_LABELS, type SymptomDef } from "@/lib/symptoms";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import { deleteObservation, saveObservation } from "./actions";

type Observation = {
  id: string;
  value_numeric: number | null;
  value_text: string | null;
  notes: string | null;
};

export function SymptomRow({
  petId,
  dateStr,
  def,
  observation,
}: {
  petId: string;
  dateStr: string;
  def: SymptomDef;
  observation: Observation | null;
}) {
  const initialValue = observation?.value_numeric?.toString() ?? "";
  const [value, setValue] = useState(initialValue);
  const [notes, setNotes] = useState(observation?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function triggerSave(nextValue: string, nextNotes: string) {
    if (nextValue === "") return;
    setSaved(false);
    const formData = new FormData();
    formData.set("value", nextValue);
    formData.set("notes", nextNotes);
    startTransition(async () => {
      await saveObservation(petId, def.key, dateStr, formData);
      setSaved(true);
    });
  }

  const debouncedSave = useDebouncedCallback(triggerSave, 700);

  function handleClear() {
    if (!observation) return;
    startTransition(async () => {
      await deleteObservation(petId, observation.id);
      setValue("");
      setNotes("");
    });
  }

  return (
    <div className="card flex flex-wrap items-end gap-2 p-3">
      <p className="mr-auto flex min-w-[7rem] items-center gap-2 text-sm font-medium">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--color-demeanor)" }}
        />
        {def.label}
      </p>

      {def.scale.type === "count" && (
        <label className="flex flex-col gap-1 text-xs">
          Count
          <input
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              debouncedSave(e.target.value, notes);
            }}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      )}

      {def.scale.type === "relative_5" && (
        <label className="flex flex-col gap-1 text-xs">
          Compared to normal
          <select
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              triggerSave(e.target.value, notes);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {RELATIVE_5_LABELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs">
        Notes
        <input
          type="text"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            debouncedSave(value, e.target.value);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      {observation && (
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
  );
}
