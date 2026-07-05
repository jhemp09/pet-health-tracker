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

type ScheduleTime = {
  id: string;
  scheduled_time: string;
  linked_schedule_id: string | null;
};
type FeedingSchedule = { id: string; label: string };
type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  notes: string | null;
  product_url: string | null;
  interval_days: number;
  start_date: string | null;
  times: ScheduleTime[];
};

function LinkedMealSelect({
  name,
  defaultValue,
  feedingSchedules,
}: {
  name: string;
  defaultValue: string;
  feedingSchedules: FeedingSchedule[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="rounded border border-gray-300 px-2 py-1 text-sm"
    >
      <option value="">No linked meal</option>
      {feedingSchedules.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

function TimeRow({
  petId,
  time,
  feedingSchedules,
}: {
  petId: string;
  time: ScheduleTime;
  feedingSchedules: FeedingSchedule[];
}) {
  const [value, setValue] = useState(time.scheduled_time.slice(0, 5));
  const [linkedScheduleId, setLinkedScheduleId] = useState(
    time.linked_schedule_id ?? ""
  );
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <select
        value={linkedScheduleId}
        onChange={(e) => setLinkedScheduleId(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="">No linked meal</option>
        {feedingSchedules.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const formData = new FormData();
          formData.set("scheduled_time", value);
          formData.set("linked_schedule_id", linkedScheduleId);
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
  feedingSchedules,
}: {
  petId: string;
  medicationId: string;
  feedingSchedules: FeedingSchedule[];
}) {
  return (
    <form
      action={addScheduleTime.bind(null, petId, medicationId)}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="time"
        name="scheduled_time"
        required
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <LinkedMealSelect
        name="linked_schedule_id"
        defaultValue=""
        feedingSchedules={feedingSchedules}
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
  todayDate,
  feedingSchedules,
}: {
  petId: string;
  medication: Medication;
  todayDate: string;
  feedingSchedules: FeedingSchedule[];
}) {
  const [name, setName] = useState(medication.name);
  const [dosage, setDosage] = useState(medication.dosage ?? "");
  const [notes, setNotes] = useState(medication.notes ?? "");
  const [productUrl, setProductUrl] = useState(medication.product_url ?? "");
  const [intervalDays, setIntervalDays] = useState(
    medication.interval_days.toString()
  );
  const [startDate, setStartDate] = useState(medication.start_date ?? todayDate);
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
        <label className="flex flex-col gap-1 text-xs">
          Every ___ day(s)
          <input
            type="number"
            min={1}
            step={1}
            value={intervalDays}
            onChange={(e) => setIntervalDays(e.target.value)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Cycle start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          How to give it
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. crush into food"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          Product link
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://…"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            const formData = new FormData();
            formData.set("name", name);
            formData.set("dosage", dosage);
            formData.set("notes", notes);
            formData.set("product_url", productUrl);
            formData.set("interval_days", intervalDays);
            formData.set("start_date", startDate);
            startTransition(() =>
              updateMedication(petId, medication.id, formData)
            );
          }}
          className="btn-primary px-3 py-1.5 text-sm"
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
      <p className="pl-2 text-xs text-gray-500">
        Changing the cycle start date only affects which future days this
        shows up as due — past entries are kept as-is. Each time below can
        link to a different meal (e.g. an AM dose with breakfast, a PM dose
        with dinner).
      </p>
      <div className="flex flex-col gap-1 pl-2">
        {medication.times.map((t) => (
          <TimeRow
            key={t.id}
            petId={petId}
            time={t}
            feedingSchedules={feedingSchedules}
          />
        ))}
        <AddTimeForm
          petId={petId}
          medicationId={medication.id}
          feedingSchedules={feedingSchedules}
        />
      </div>
    </div>
  );
}

export function ScheduleEditor({
  petId,
  medications,
  todayDate,
  feedingSchedules,
}: {
  petId: string;
  medications: Medication[];
  todayDate: string;
  feedingSchedules: FeedingSchedule[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium underline"
        style={{ color: "var(--color-meds)" }}
      >
        {open ? "Hide medications editor" : "Edit medications"}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {medications.map((m) => (
            <MedicationRow
              key={m.id}
              petId={petId}
              medication={m}
              todayDate={todayDate}
              feedingSchedules={feedingSchedules}
            />
          ))}
          <form
            action={addMedication.bind(null, petId)}
            className="flex flex-col gap-2 border-t border-gray-100 pt-3"
          >
            <div className="flex flex-wrap items-end gap-2">
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
              <label className="flex flex-col gap-1 text-xs">
                Linked meal
                <LinkedMealSelect
                  name="linked_schedule_id"
                  defaultValue=""
                  feedingSchedules={feedingSchedules}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Every ___ day(s)
                <input
                  type="number"
                  name="interval_days"
                  min={1}
                  step={1}
                  defaultValue={1}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Cycle start date
                <input
                  type="date"
                  name="start_date"
                  defaultValue={todayDate}
                  required
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs">
                How to give it
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. crush into food"
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs">
                Product link
                <input
                  type="url"
                  name="product_url"
                  placeholder="https://…"
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
            </div>
            <button
              type="submit"
              className="btn-primary w-fit px-3 py-1.5 text-sm"
            >
              Add medication
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
