"use client";

import { useState, useTransition } from "react";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import {
  addDiagnosis,
  removeDiagnosis,
  updateDiagnosis,
  updateMedicalNotes,
} from "./actions";

type Diagnosis = { id: string; diagnosis: string };

export function DiagnosesSection({
  petId,
  catalog,
  diagnoses,
  medicalNotes,
}: {
  petId: string;
  catalog: string[];
  diagnoses: Diagnosis[];
  medicalNotes: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(medicalNotes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

  const debouncedSaveNotes = useDebouncedCallback((value: string) => {
    setNotesSaved(false);
    startTransition(async () => {
      await updateMedicalNotes(petId, value);
      setNotesSaved(true);
    });
  }, 700);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">Diagnoses</h2>

      <div className="flex flex-col gap-2">
        {diagnoses.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <select
              value={d.diagnosis}
              onChange={(e) =>
                startTransition(() => updateDiagnosis(petId, d.id, e.target.value))
              }
              className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Select a diagnosis…</option>
              {catalog.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {d.diagnosis && !catalog.includes(d.diagnosis) && (
                <option value={d.diagnosis}>{d.diagnosis}</option>
              )}
            </select>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeDiagnosis(petId, d.id))}
              className="shrink-0 text-xs text-red-600 underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => addDiagnosis(petId))}
          className="self-start text-sm text-blue-600 underline disabled:opacity-50"
        >
          + Add diagnosis
        </button>
      </div>

      <label className="flex flex-col gap-1 text-xs text-gray-600">
        Additional medical information
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            debouncedSaveNotes(e.target.value);
          }}
          placeholder="Anything else worth noting — past surgeries, ongoing concerns, things your vet has said, etc."
          rows={3}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
        />
        {notesSaved && <span className="text-green-700">Saved</span>}
      </label>
    </section>
  );
}
