"use client";

import { useTransition } from "react";
import {
  addMedication,
  deleteMedicationLog,
  logMedicationDose,
  removeMedication,
} from "./actions";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  schedule_times: string[];
};

type LogEntry = {
  id: string;
  medication_id: string;
  given: boolean;
  given_at: string;
};

export function MedicationsSection({
  petId,
  medications,
  logs,
}: {
  petId: string;
  medications: Medication[];
  logs: LogEntry[];
}) {
  const [isPending, startTransition] = useTransition();
  const medName = (id: string) =>
    medications.find((m) => m.id === id)?.name ?? "Unknown medication";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Medications</h2>

      <div className="rounded border border-gray-200 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Current medications
        </h3>
        {medications.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2 text-sm">
            {medications.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <span>
                  {m.name}
                  {m.dosage ? ` — ${m.dosage}` : ""}
                  {m.schedule_times.length > 0
                    ? ` — ${m.schedule_times.map((t) => t.slice(0, 5)).join(", ")}`
                    : ""}
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                    onClick={() =>
                      startTransition(() =>
                        logMedicationDose(petId, m.id, true)
                      )
                    }
                  >
                    Given
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className="rounded bg-gray-400 px-2 py-1 text-xs text-white"
                    onClick={() =>
                      startTransition(() =>
                        logMedicationDose(petId, m.id, false)
                      )
                    }
                  >
                    Not given
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className="text-xs text-red-600 underline"
                    onClick={() =>
                      startTransition(() => removeMedication(petId, m.id))
                    }
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-gray-500">
            No medications configured yet.
          </p>
        )}
        <form
          action={(formData) => addMedication(petId, formData)}
          className="flex flex-wrap items-end gap-2"
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
            Times (comma separated)
            <input
              type="text"
              name="schedule_times"
              placeholder="08:00, 20:00"
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

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Recent doses
        </h3>
        {logs.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-gray-700">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between">
                <span>
                  {new Date(log.given_at).toLocaleString()} —{" "}
                  {medName(log.medication_id)} —{" "}
                  {log.given ? "Given" : "Not given"}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  className="text-xs text-red-600 underline"
                  onClick={() =>
                    startTransition(() => deleteMedicationLog(petId, log.id))
                  }
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No doses logged yet.</p>
        )}
      </div>
    </section>
  );
}
