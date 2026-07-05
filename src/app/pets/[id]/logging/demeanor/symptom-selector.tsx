"use client";

import { useState, useTransition } from "react";
import { SYMPTOM_CATALOG } from "@/lib/symptoms";
import { addSymptom, removeSymptom } from "./actions";

type ActiveSymptom = { id: string; symptom_key: string };

export function SymptomSelector({
  petId,
  active,
}: {
  petId: string;
  active: ActiveSymptom[];
}) {
  const [open, setOpen] = useState(false);
  const activeKeys = new Set(active.map((a) => a.symptom_key));
  const available = SYMPTOM_CATALOG.filter((s) => !activeKeys.has(s.key));
  const [selectedKey, setSelectedKey] = useState(available[0]?.key ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded border border-gray-200 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium underline"
      >
        {open ? "Hide symptom tracking editor" : "Edit tracked symptoms"}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <ul className="flex flex-col gap-1">
            {active.map((a) => {
              const def = SYMPTOM_CATALOG.find((s) => s.key === a.symptom_key);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between text-sm"
                >
                  {def?.label ?? a.symptom_key}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => removeSymptom(petId, a.id))
                    }
                    className="text-xs text-red-600 underline"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          {available.length > 0 && (
            <div className="flex items-end gap-2 border-t border-gray-100 pt-3">
              <label className="flex flex-col gap-1 text-xs">
                Add a symptom to track
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  {available.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={isPending || !selectedKey}
                onClick={() =>
                  startTransition(() => addSymptom(petId, selectedKey))
                }
                className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
