"use client";

import { useTransition } from "react";
import {
  addFeedingSchedule,
  deleteFeedingLog,
  logFeeding,
  removeFeedingSchedule,
} from "./actions";

type Schedule = {
  id: string;
  label: string;
  scheduled_time: string;
};

type LogEntry = {
  id: string;
  fed_at: string;
  percent_eaten: number;
  notes: string | null;
  schedule_id: string | null;
};

export function FeedingSection({
  petId,
  schedules,
  logs,
}: {
  petId: string;
  schedules: Schedule[];
  logs: LogEntry[];
}) {
  const [isPending, startTransition] = useTransition();
  const scheduleLabel = (id: string | null) =>
    schedules.find((s) => s.id === id)?.label ?? "Unscheduled";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium">Feeding</h2>

      <div className="rounded border border-gray-200 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Meal schedule
        </h3>
        {schedules.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-1 text-sm">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span>
                  {s.label} — {s.scheduled_time.slice(0, 5)}
                </span>
                <button
                  type="button"
                  className="text-xs text-red-600 underline"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => removeFeedingSchedule(petId, s.id))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-gray-500">
            No meals configured yet.
          </p>
        )}
        <form
          action={(formData) => addFeedingSchedule(petId, formData)}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            Meal name
            <input
              type="text"
              name="label"
              placeholder="e.g. Breakfast"
              required
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Time
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
            Add meal
          </button>
        </form>
      </div>

      <div className="rounded border border-gray-200 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Log a feeding
        </h3>
        <form
          action={(formData) => logFeeding(petId, formData)}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            Meal
            <select
              name="schedule_id"
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">Unscheduled / snack</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            % eaten
            <input
              type="number"
              name="percent_eaten"
              min={0}
              max={100}
              step={5}
              required
              defaultValue={100}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            />
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
            Log
          </button>
        </form>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Recent feedings
        </h3>
        {logs.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-gray-700">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between">
                <span>
                  {new Date(log.fed_at).toLocaleString()} —{" "}
                  {scheduleLabel(log.schedule_id)} — {log.percent_eaten}%
                  {log.notes ? ` — ${log.notes}` : ""}
                </span>
                <button
                  type="button"
                  className="text-xs text-red-600 underline"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => deleteFeedingLog(petId, log.id))
                  }
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No feedings logged yet.</p>
        )}
      </div>
    </section>
  );
}
