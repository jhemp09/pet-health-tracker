"use client";

import { useTransition } from "react";
import { deleteWeightLog, logWeight } from "./actions";

type LogEntry = {
  id: string;
  weight: number;
  unit: string;
  logged_at: string;
  notes: string | null;
};

export function WeightSection({
  petId,
  logs,
}: {
  petId: string;
  logs: LogEntry[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Weight</h2>
      <div className="rounded border border-gray-200 p-4">
        <form
          action={(formData) => logWeight(petId, formData)}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            Weight
            <input
              type="number"
              name="weight"
              step={0.1}
              min={0}
              required
              className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Unit
            <select
              name="unit"
              defaultValue="lb"
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
              name="notes"
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            Log weight
          </button>
        </form>
      </div>

      {logs.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-gray-700">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between">
              <span>
                {new Date(log.logged_at).toLocaleString()} — {log.weight}{" "}
                {log.unit}
                {log.notes ? ` — ${log.notes}` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                className="text-xs text-red-600 underline"
                onClick={() =>
                  startTransition(() => deleteWeightLog(petId, log.id))
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No weight logged yet.</p>
      )}
    </section>
  );
}
