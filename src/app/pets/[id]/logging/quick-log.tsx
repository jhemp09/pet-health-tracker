"use client";

import { useState, useTransition } from "react";
import { RELATIVE_5_LABELS, type SymptomDef } from "@/lib/symptoms";
import { saveFeedingForDate } from "./food/actions";
import { saveMedicationForDate } from "./medications/actions";
import { saveObservation } from "./demeanor/actions";

export type PendingMeal = { key: string; scheduleId: string; label: string };
export type PendingDose = {
  key: string;
  medicationId: string;
  scheduleTimeId: string;
  label: string;
};
export type PendingSymptom = {
  key: string;
  symptomKey: string;
  def: SymptomDef;
};

function QuickRow({
  color,
  bg,
  label,
  children,
}: {
  color: string;
  bg: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
      style={{ background: bg }}
    >
      <span className="text-sm font-medium" style={{ color }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function MealRow({
  petId,
  dateStr,
  meal,
  onDone,
}: {
  petId: string;
  dateStr: string;
  meal: PendingMeal;
  onDone: (key: string) => void;
}) {
  const [percent, setPercent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (percent === "") return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("percent_eaten", percent);
      formData.set("notes", "");
      await saveFeedingForDate(petId, meal.scheduleId, dateStr, null, formData);
      onDone(meal.key);
    });
  }

  return (
    <QuickRow color="var(--color-food)" bg="var(--color-food-light)" label={meal.label}>
      <input
        type="number"
        min={0}
        max={100}
        step={5}
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        placeholder="%"
        disabled={isPending}
        className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <button
        type="button"
        disabled={isPending || percent === ""}
        onClick={handleSave}
        className="flex h-7 w-7 items-center justify-center rounded-full text-white disabled:opacity-40"
        style={{ background: "var(--color-food)" }}
        aria-label="Save"
      >
        ✓
      </button>
    </QuickRow>
  );
}

function DoseRow({
  petId,
  dateStr,
  dose,
  onDone,
}: {
  petId: string;
  dateStr: string;
  dose: PendingDose;
  onDone: (key: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSave(given: boolean) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("given", String(given));
      formData.set("notes", "");
      await saveMedicationForDate(
        petId,
        dose.medicationId,
        dose.scheduleTimeId,
        dateStr,
        null,
        formData
      );
      onDone(dose.key);
    });
  }

  return (
    <QuickRow color="var(--color-meds)" bg="var(--color-meds-light)" label={dose.label}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleSave(true)}
        className="rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        style={{ background: "#16a34a" }}
      >
        Given
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleSave(false)}
        className="rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        style={{ background: "#57534e" }}
      >
        Not given
      </button>
    </QuickRow>
  );
}

function SymptomRow({
  petId,
  dateStr,
  symptom,
  onDone,
}: {
  petId: string;
  dateStr: string;
  symptom: PendingSymptom;
  onDone: (key: string) => void;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function save(nextValue: string) {
    if (nextValue === "") return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("value", nextValue);
      formData.set("notes", "");
      await saveObservation(petId, symptom.symptomKey, dateStr, formData);
      onDone(symptom.key);
    });
  }

  return (
    <QuickRow
      color="var(--color-demeanor)"
      bg="var(--color-demeanor-light)"
      label={symptom.def.label}
    >
      {symptom.def.scale.type === "count" ? (
        <>
          <input
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            disabled={isPending || value === ""}
            onClick={() => save(value)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white disabled:opacity-40"
            style={{ background: "var(--color-demeanor)" }}
            aria-label="Save"
          >
            ✓
          </button>
        </>
      ) : (
        <select
          value={value}
          disabled={isPending}
          onChange={(e) => {
            setValue(e.target.value);
            save(e.target.value);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">—</option>
          {RELATIVE_5_LABELS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </QuickRow>
  );
}

export function QuickLog({
  petId,
  dateStr,
  meals,
  doses,
  symptoms,
}: {
  petId: string;
  dateStr: string;
  meals: PendingMeal[];
  doses: PendingDose[];
  symptoms: PendingSymptom[];
}) {
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());

  function markDone(key: string) {
    setDoneKeys((prev) => new Set(prev).add(key));
  }

  const remainingMeals = meals.filter((m) => !doneKeys.has(m.key));
  const remainingDoses = doses.filter((d) => !doneKeys.has(d.key));
  const remainingSymptoms = symptoms.filter((s) => !doneKeys.has(s.key));
  const totalRemaining =
    remainingMeals.length + remainingDoses.length + remainingSymptoms.length;

  if (meals.length + doses.length + symptoms.length === 0) return null;

  return (
    <section className="card p-4">
      <h2 className="font-heading text-lg font-semibold">Quick Log</h2>
      {totalRemaining === 0 ? (
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
          All caught up for today! 🎉
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {remainingMeals.map((meal) => (
            <MealRow key={meal.key} petId={petId} dateStr={dateStr} meal={meal} onDone={markDone} />
          ))}
          {remainingDoses.map((dose) => (
            <DoseRow key={dose.key} petId={petId} dateStr={dateStr} dose={dose} onDone={markDone} />
          ))}
          {remainingSymptoms.map((symptom) => (
            <SymptomRow
              key={symptom.key}
              petId={petId}
              dateStr={dateStr}
              symptom={symptom}
              onDone={markDone}
            />
          ))}
        </div>
      )}
    </section>
  );
}
