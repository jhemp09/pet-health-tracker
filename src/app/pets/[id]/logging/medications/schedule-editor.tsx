"use client";

import { useState, useTransition } from "react";
import {
  addMedication,
  addScheduleTime,
  removeMedication,
  removeScheduleTime,
  updateMedication,
  updateScheduleTime,
} from "./actions";

type ScheduleTime = { id: string; scheduled_time: string };
type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  times: ScheduleTime[];
};

function TimeRow({
  petId,
  time,
}: {
  petId: string;
  time: ScheduleTime;
}) {
  const [value, setValue] = useState(time.scheduled_time.slice(0, 5));
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const formData = new FormData();
          formData.set("scheduled_time", value);
          startTransition(() => updateScheduleTime(petId, time.id, formData));
        }}
        className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => removeScheduleTime(petId, time.id))}
        className="text-xs text-red-600 underline"
      >
        Remove
      </button>
    </div>
  );
}

function AddTimeForm({
  petId,
  medicationId,
}: {
  petId: string;
  medicationId: string;
}) {
  return (
    <form
      action={addScheduleTime.bind(null, petId, medicationId)}
      className="flex items-center gap-2"
    >
      <input
        type="time"
        name="scheduled_time"
        required
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-black px-2 py-1 text-xs text-white"
      >
        + Add time
      </button>
    </form>
  );
}

function MedicationRow({
  petId,
  medication,
}: {
  petId: string;
  medication: Medication;
}) {
  const [name, setName] = useState(medication.name);
  const [dosage, setDosage] = useState(medication.dosage ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Dosage
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            const formData = new FormData();
            formData.set("name", name);
            formData.set("dosage", dosage);
            startTransition(() =>
              updateMedication(petId, medication.id, formData)
            );
          }}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => removeMedication(petId, medication.id))}
          className="text-xs text-red-600 underline"
        >
          Delete medication
        </button>
      </div>
      <div className="flex flex-col gap-1 pl-2">
        {medication.times.map((t) => (
          <TimeRow key={t.id} petId={petId} time={t} />
        ))}
        <AddTimeForm petId={petId} medicationId={medication.id} />
      </div>
    </div>
  );
}

export function ScheduleEditor({
  petId,
  medications,
}: {
  petId: string;
  medications: Medication[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-gray-200 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium underline"
      >
        {open ? "Hide medications editor" : "Edit medications"}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {medications.map((m) => (
            <MedicationRow key={m.id} petId={petId} medication={m} />
          ))}
          <form
            action={addMedication.bind(null, petId)}
            className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3"
          >
            <label className="flex flex-col gap-1 text-xs">
              Name
              <input
                type="text"
                name="name"
                required
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Dosage
              <input
                type="text"
                name="dosage"
                placeholder="e.g. 5mg"
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              First time
              <input
                type="time"
                name="scheduled_time"
                required
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-black px-3 py-1.5 text-sm text-white"
            >
              Add medication
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
