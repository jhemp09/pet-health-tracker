"use client";

import { useState, useTransition } from "react";
import type { SymptomDef } from "@/lib/symptoms";
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
  const initialValue =
    def.scale.type === "enum"
      ? observation?.value_text ?? ""
      : (observation?.value_numeric?.toString() ?? "");
  const [value, setValue] = useState(initialValue);
  const [notes, setNotes] = useState(observation?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    const formData = new FormData();
    formData.set("value", value);
    formData.set("notes", notes);
    startTransition(async () => {
      await saveObservation(petId, def.key, dateStr, formData);
      setSaved(true);
    });
  }

  function handleClear() {
    if (!observation) return;
    startTransition(async () => {
      await deleteObservation(petId, observation.id);
      setValue("");
      setNotes("");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-3">
      <p className="mr-auto min-w-[7rem] text-sm font-medium">{def.label}</p>

      {def.scale.type === "count" && (
        <label className="flex flex-col gap-1 text-xs">
          Count
          <input
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      )}

      {def.scale.type === "rating_1_10" && (
        <label className="flex flex-col gap-1 text-xs">
          Rating (1-10)
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      {def.scale.type === "enum" && (
        <label className="flex flex-col gap-1 text-xs">
          Value
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">—</option>
            {def.scale.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
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
          onChange={(e) => setNotes(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={isPending || value === ""}
        onClick={handleSave}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Save
      </button>
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
      {saved && !isPending && (
        <span className="text-xs text-green-700">Saved</span>
      )}
    </div>
  );
}
