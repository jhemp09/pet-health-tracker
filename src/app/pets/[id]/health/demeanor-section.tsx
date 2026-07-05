"use client";

import { useTransition } from "react";
import { deleteDemeanorLog, logDemeanor } from "./actions";

type LogEntry = {
  id: string;
  logged_at: string;
  energy_level: number | null;
  vomiting: boolean;
  vomiting_count: number;
  distancing: boolean;
  notes: string | null;
};

export function DemeanorSection({
  petId,
  logs,
}: {
  petId: string;
  logs: LogEntry[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Demeanor</h2>
      <div className="rounded border border-gray-200 p-4">
        <form
          action={(formData) => logDemeanor(petId, formData)}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-xs">
            Energy level (1 = lethargic, 5 = hyper)
            <input
              type="range"
              name="energy_level"
              min={1}
              max={5}
              defaultValue={3}
              className="w-full"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input type="checkbox" name="vomiting" /> Vomiting
            </label>
            <label className="flex items-center gap-1">
              Count
              <input
                type="number"
                name="vomiting_count"
                min={0}
                defaultValue={1}
                className="w-16 rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" name="distancing" /> Distancing / hiding
            </label>
          </div>
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
            className="w-fit rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            Log demeanor
          </button>
        </form>
      </div>

      {logs.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-gray-700">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between">
              <span>
                {new Date(log.logged_at).toLocaleString()} — energy{" "}
                {log.energy_level ?? "?"}/5
                {log.vomiting ? ` — vomited x${log.vomiting_count}` : ""}
                {log.distancing ? " — distancing" : ""}
                {log.notes ? ` — ${log.notes}` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                className="text-xs text-red-600 underline"
                onClick={() =>
                  startTransition(() => deleteDemeanorLog(petId, log.id))
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No demeanor logs yet.</p>
      )}
    </section>
  );
}
