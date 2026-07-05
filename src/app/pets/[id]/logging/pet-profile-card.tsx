"use client";

import { useState, useTransition } from "react";
import { updatePetProfile } from "./profile-actions";

type Stats = {
  latestWeight: { value: number; unit: string; changeText: string } | null;
  foodIntake: { avg: number; trendText: string } | null;
  medAdherence: { pct: number } | null;
  demeanorDaysLogged: number;
};

export function PetProfileCard({
  petId,
  name,
  species,
  breed,
  birthDate,
  age,
  stats,
}: {
  petId: string;
  name: string;
  species: string;
  breed: string | null;
  birthDate: string | null;
  age: string | null;
  stats: Stats;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePetProfile(petId, formData);
      if (!result.ok) setError(result.error ?? "Could not save");
      else setIsEditing(false);
    });
  }

  if (isEditing) {
    return (
      <section className="rounded-lg border border-gray-200 p-4">
        <form action={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              name="name"
              defaultValue={name}
              required
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Species
            <select
              name="species"
              defaultValue={species}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Breed
            <input
              name="breed"
              defaultValue={breed ?? ""}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Birthday
            <input
              type="date"
              name="birth_date"
              defaultValue={birthDate ?? ""}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-medium">{name}</h2>
          <p className="text-sm text-gray-600">
            {breed ? `${breed} · ` : ""}
            {age ?? "Age unknown"}
          </p>
          {birthDate && (
            <p className="text-xs text-gray-500">Born {birthDate}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm text-gray-500 underline"
        >
          Edit
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-gray-500">Latest weight</dt>
          <dd>
            {stats.latestWeight
              ? `${stats.latestWeight.value} ${stats.latestWeight.unit}${
                  stats.latestWeight.changeText
                    ? ` (${stats.latestWeight.changeText})`
                    : ""
                }`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Food intake (7d avg)</dt>
          <dd>
            {stats.foodIntake
              ? `${stats.foodIntake.avg}%${
                  stats.foodIntake.trendText
                    ? ` (${stats.foodIntake.trendText})`
                    : ""
                }`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Meds given (7d)</dt>
          <dd>{stats.medAdherence ? `${stats.medAdherence.pct}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Demeanor logged</dt>
          <dd>{stats.demeanorDaysLogged}/7 days</dd>
        </div>
      </dl>
    </section>
  );
}
