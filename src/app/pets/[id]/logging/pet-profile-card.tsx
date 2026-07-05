"use client";

import { useState, useTransition } from "react";
import { updatePetProfile } from "./profile-actions";

type Stats = {
  latestWeight: { value: number; unit: string; changeText: string } | null;
  foodIntake: { avg: number; trendText: string } | null;
  medAdherence: { pct: number } | null;
  demeanorDaysLogged: number;
};

function StatTile({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: bg }}>
      <p className="text-xs font-medium" style={{ color }}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
    </div>
  );
}

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
  const [isExpanded, setIsExpanded] = useState(true);
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
      <section className="card p-4">
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
              className="btn-primary flex-1 px-3 py-1.5 text-sm"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-outline flex-1 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((e) => !e)}
          className="flex flex-1 items-start gap-2 text-left"
        >
          <span
            className="mt-1 text-xs transition-transform"
            style={{
              color: "var(--color-primary)",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold">{name}</h2>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {breed ? `${breed} · ` : ""}
              {age ?? "Age unknown"}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm underline"
          style={{ color: "var(--color-primary)" }}
        >
          Edit
        </button>
      </div>

      {isExpanded && (
        <>
          {birthDate && (
            <p className="ml-5 mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
              Born {birthDate}
            </p>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <StatTile
              label="Latest weight"
              value={
                stats.latestWeight
                  ? `${stats.latestWeight.value} ${stats.latestWeight.unit}${
                      stats.latestWeight.changeText
                        ? ` (${stats.latestWeight.changeText})`
                        : ""
                    }`
                  : "—"
              }
              color="var(--color-weight)"
              bg="var(--color-weight-light)"
            />
            <StatTile
              label="Food intake (7d avg)"
              value={
                stats.foodIntake
                  ? `${stats.foodIntake.avg}%${
                      stats.foodIntake.trendText
                        ? ` (${stats.foodIntake.trendText})`
                        : ""
                    }`
                  : "—"
              }
              color="var(--color-food)"
              bg="var(--color-food-light)"
            />
            <StatTile
              label="Meds given (7d)"
              value={stats.medAdherence ? `${stats.medAdherence.pct}%` : "—"}
              color="var(--color-meds)"
              bg="var(--color-meds-light)"
            />
            <StatTile
              label="Demeanor logged"
              value={`${stats.demeanorDaysLogged}/7 days`}
              color="var(--color-demeanor)"
              bg="var(--color-demeanor-light)"
            />
          </dl>
        </>
      )}
    </section>
  );
}
