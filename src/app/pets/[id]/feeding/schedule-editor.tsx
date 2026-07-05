"use client";

import { useState, useTransition } from "react";
import {
  addFeedingSchedule,
  removeFeedingSchedule,
  updateFeedingSchedule,
} from "./actions";

type Schedule = { id: string; label: string; scheduled_time: string };

function ScheduleRow({
  petId,
  schedule,
}: {
  petId: string;
  schedule: Schedule;
}) {
  const [label, setLabel] = useState(schedule.label);
  const [time, setTime] = useState(schedule.scheduled_time.slice(0, 5));
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs">
        Meal name
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Time
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const formData = new FormData();
          formData.set("label", label);
          formData.set("scheduled_time", time);
          startTransition(() =>
            updateFeedingSchedule(petId, schedule.id, formData)
          );
        }}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() => removeFeedingSchedule(petId, schedule.id))
        }
        className="text-xs text-red-600 underline"
      >
        Delete
      </button>
    </div>
  );
}

export function ScheduleEditor({
  petId,
  schedules,
}: {
  petId: string;
  schedules: Schedule[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-gray-200 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium underline"
      >
        {open ? "Hide meal schedule editor" : "Edit meal schedule"}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {schedules.map((s) => (
            <ScheduleRow key={s.id} petId={petId} schedule={s} />
          ))}
          <AddScheduleForm petId={petId} />
        </div>
      )}
    </div>
  );
}

function AddScheduleForm({ petId }: { petId: string }) {
  return (
    <form
      action={addFeedingSchedule.bind(null, petId)}
      className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3"
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
  );
}
