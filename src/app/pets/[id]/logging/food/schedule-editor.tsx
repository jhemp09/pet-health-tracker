"use client";

import { useState, useTransition } from "react";
import {
  addFeedingSchedule,
  removeFeedingSchedule,
  updateFeedingSchedule,
} from "./actions";
import { MealFoodsList } from "./meal-foods-list";

type Schedule = { id: string; label: string; scheduled_time: string };
type Food = {
  id: string;
  url: string;
  title: string | null;
  image_url: string | null;
  amount: string | null;
};

function ScheduleRow({
  petId,
  schedule,
  foods,
}: {
  petId: string;
  schedule: Schedule;
  foods: Food[];
}) {
  const [label, setLabel] = useState(schedule.label);
  const [time, setTime] = useState(schedule.scheduled_time.slice(0, 5));
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 p-3">
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
          className="btn-primary px-3 py-1.5 text-sm"
        >
          Save
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => removeFeedingSchedule(petId, schedule.id))}
          className="text-xs text-red-600 underline"
        >
          Delete
        </button>
      </div>
      <MealFoodsList petId={petId} scheduleId={schedule.id} foods={foods} />
    </div>
  );
}

export function ScheduleEditor({
  petId,
  schedules,
  foodsBySchedule,
}: {
  petId: string;
  schedules: Schedule[];
  foodsBySchedule: Map<string, Food[]>;
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
            <ScheduleRow
              key={s.id}
              petId={petId}
              schedule={s}
              foods={foodsBySchedule.get(s.id) ?? []}
            />
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
        className="btn-primary px-3 py-1.5 text-sm"
      >
        Add meal
      </button>
    </form>
  );
}
