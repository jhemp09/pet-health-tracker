"use client";

import { useState, useTransition } from "react";
import { saveMedicationForDate } from "./actions";

type Medication = { id: string; name: string };

export function ExtraDoseForm({
  petId,
  dateStr,
  medications,
}: {
  petId: string;
  dateStr: string;
  medications: Medication[];
}) {
  const [open, setOpen] = useState(false);
  const [medicationId, setMedicationId] = useState(medications[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (medications.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm underline"
      >
        + Add extra dose
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded border border-dashed border-gray-300 p-3">
      <label className="flex flex-col gap-1 text-xs">
        Medication
        <select
          value={medicationId}
          onChange={(e) => setMedicationId(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {medications.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
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
        disabled={isPending || !medicationId}
        onClick={() => {
          const formData = new FormData();
          formData.set("given", "true");
          formData.set("notes", notes);
          startTransition(async () => {
            await saveMedicationForDate(
              petId,
              medicationId,
              null,
              dateStr,
              null,
              formData
            );
            setOpen(false);
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
