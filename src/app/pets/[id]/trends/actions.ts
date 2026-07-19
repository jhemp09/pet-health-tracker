"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatAge } from "@/lib/dates";
import { RELATIVE_5_LABELS, SYMPTOM_CATALOG } from "@/lib/symptoms";
import { generatePetSynopsis } from "@/lib/pet-synopsis";

type WeightLog = { weight: number; unit: string; logged_at: string; notes: string | null };
type FeedingLog = {
  fed_at: string;
  percent_eaten: number;
  notes: string | null;
  schedule_id: string | null;
};
type FeedingSchedule = { id: string; label: string; scheduled_time: string; active: boolean };
type MealFood = { schedule_id: string; title: string | null; url: string };
type DemeanorObservation = {
  symptom_key: string;
  observed_date: string;
  value_numeric: number | null;
  notes: string | null;
};
type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  active: boolean;
  interval_days: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
};
type MedicationScheduleTime = {
  id: string;
  medication_id: string;
  scheduled_time: string;
  linked_schedule_id: string | null;
};
type MedicationLogRow = { medication_id: string; observed_date: string; given: boolean };
type BloodworkResultRow = {
  date: string;
  test_name: string;
  value: string;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
};
type ChangeLogEntry = { event_date: string; category: string; description: string };

function buildDataSummary(data: {
  name: string;
  species: string;
  breed: string | null;
  age: string;
  diagnoses: string[];
  medicalNotes: string | null;
  weightLogs: WeightLog[];
  feedingLogs: FeedingLog[];
  feedingSchedules: FeedingSchedule[];
  mealFoods: MealFood[];
  activeSymptomKeys: string[];
  demeanorObservations: DemeanorObservation[];
  medications: Medication[];
  medicationScheduleTimes: MedicationScheduleTime[];
  medicationLogs: MedicationLogRow[];
  bloodworkResults: BloodworkResultRow[];
  changeLogEntries: ChangeLogEntry[];
}): string {
  const lines: string[] = [];

  lines.push(
    `Pet: ${data.name}, ${data.species}${data.breed ? `, ${data.breed}` : ""}, age ${data.age}.`,
    `Known diagnoses: ${data.diagnoses.length > 0 ? data.diagnoses.join(", ") : "None recorded."}`,
    `Additional owner-provided medical notes: ${data.medicalNotes ?? "None."}`,
    ""
  );

  lines.push("WEIGHT HISTORY:");
  if (data.weightLogs.length === 0) {
    lines.push("No weight logs recorded.");
  } else {
    for (const w of data.weightLogs) {
      lines.push(
        `- ${w.logged_at.slice(0, 10)}: ${w.weight} ${w.unit}${w.notes ? ` (${w.notes})` : ""}`
      );
    }
  }
  lines.push("");

  const mealLabelById = new Map(data.feedingSchedules.map((s) => [s.id, s.label]));
  const mealFoodsByScheduleId = new Map<string, MealFood[]>();
  for (const mf of data.mealFoods) {
    const list = mealFoodsByScheduleId.get(mf.schedule_id) ?? [];
    list.push(mf);
    mealFoodsByScheduleId.set(mf.schedule_id, list);
  }

  lines.push("FEEDING SCHEDULE (configured meals):");
  if (data.feedingSchedules.length === 0) {
    lines.push("No feeding schedule configured.");
  } else {
    for (const s of data.feedingSchedules) {
      const foods = mealFoodsByScheduleId.get(s.id) ?? [];
      const foodText =
        foods.length > 0 ? foods.map((f) => f.title ?? f.url).join(", ") : "no food linked";
      lines.push(
        `- ${s.label} at ${s.scheduled_time}${s.active ? "" : " (inactive)"} — food: ${foodText}`
      );
    }
  }
  lines.push("");

  lines.push("FOOD INTAKE (last 90 days, % of meal eaten):");
  if (data.feedingLogs.length === 0) {
    lines.push("No feeding logs recorded.");
  } else {
    const byDay = new Map<string, number[]>();
    for (const f of data.feedingLogs) {
      const day = f.fed_at.slice(0, 10);
      const list = byDay.get(day) ?? [];
      list.push(f.percent_eaten);
      byDay.set(day, list);
    }
    const days = Array.from(byDay.keys()).sort();
    const avgOf = (subset: string[]) => {
      const vals = subset.flatMap((d) => byDay.get(d) ?? []);
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };
    const half = Math.floor(days.length / 2);
    const overallAvg = avgOf(days);
    const earlierAvg = avgOf(days.slice(0, half));
    const laterAvg = avgOf(days.slice(half));
    lines.push(`- Overall daily average: ${overallAvg}%`);
    if (earlierAvg != null && laterAvg != null && half > 0) {
      lines.push(`- Earlier half of period average: ${earlierAvg}%, later half average: ${laterAvg}%`);
    }

    const byMeal = new Map<string, number[]>();
    for (const f of data.feedingLogs) {
      const key = f.schedule_id ?? "unscheduled";
      const list = byMeal.get(key) ?? [];
      list.push(f.percent_eaten);
      byMeal.set(key, list);
    }
    lines.push("- By meal:");
    for (const [scheduleId, vals] of byMeal.entries()) {
      const label = mealLabelById.get(scheduleId) ?? "Extra/unscheduled feeding";
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      lines.push(`  - ${label}: average ${avg}% eaten (${vals.length} logged instances)`);
    }

    for (const f of data.feedingLogs.filter((f) => f.notes).slice(-10)) {
      lines.push(`- ${f.fed_at.slice(0, 10)} note: ${f.notes}`);
    }
  }
  lines.push("");

  lines.push("DEMEANOR SYMPTOMS TRACKED:");
  if (data.activeSymptomKeys.length === 0) {
    lines.push("No symptoms actively tracked.");
  } else {
    for (const key of data.activeSymptomKeys) {
      const def = SYMPTOM_CATALOG.find((d) => d.key === key);
      const label = def?.label ?? key;
      const obs = data.demeanorObservations
        .filter((o) => o.symptom_key === key)
        .sort((a, b) => a.observed_date.localeCompare(b.observed_date));
      if (obs.length === 0) {
        lines.push(`- ${label}: no observations logged.`);
        continue;
      }
      if (def?.scale.type === "count") {
        const total = obs.reduce((sum, o) => sum + (o.value_numeric ?? 0), 0);
        const incidentDays = obs.filter((o) => (o.value_numeric ?? 0) > 0).map((o) => o.observed_date);
        lines.push(
          `- ${label}: ${total} incidents over the tracked period${
            incidentDays.length ? `, on: ${incidentDays.join(", ")}` : ""
          }.`
        );
      } else {
        const recent = obs
          .filter((o) => o.value_numeric != null)
          .slice(-10)
          .map(
            (o) =>
              `${o.observed_date}: ${
                RELATIVE_5_LABELS.find((l) => l.value === o.value_numeric)?.label ?? o.value_numeric
              }`
          );
        lines.push(`- ${label}: recent readings — ${recent.join("; ") || "none"}`);
      }
      for (const o of obs.filter((o) => o.notes).slice(-5)) {
        lines.push(`  note (${o.observed_date}): ${o.notes}`);
      }
    }
  }
  lines.push("");

  const scheduleTimesByMedId = new Map<string, MedicationScheduleTime[]>();
  for (const st of data.medicationScheduleTimes) {
    const list = scheduleTimesByMedId.get(st.medication_id) ?? [];
    list.push(st);
    scheduleTimesByMedId.set(st.medication_id, list);
  }

  lines.push("MEDICATIONS (configured):");
  if (data.medications.length === 0) {
    lines.push("No medications configured.");
  } else {
    for (const m of data.medications) {
      const times = scheduleTimesByMedId.get(m.id) ?? [];
      const timesText =
        times
          .map((t) => {
            const linkedLabel = t.linked_schedule_id ? mealLabelById.get(t.linked_schedule_id) : null;
            return `${t.scheduled_time}${linkedLabel ? ` (with ${linkedLabel})` : ""}`;
          })
          .join(", ") || "no times set";
      const frequency = m.interval_days > 1 ? `every ${m.interval_days} days` : "daily";
      const dateRange = m.start_date
        ? `since ${m.start_date}${m.end_date ? ` through ${m.end_date}` : ""}`
        : "";
      lines.push(
        `- ${m.name}${m.dosage ? ` (${m.dosage})` : ""}, ${frequency}, times: ${timesText}${
          m.active ? "" : " — DISCONTINUED"
        }${dateRange ? `, ${dateRange}` : ""}${m.notes ? `. Notes: ${m.notes}` : ""}`
      );
    }
  }
  lines.push("");

  lines.push("MEDICATION ADHERENCE (last 30 days, per medication):");
  if (data.medicationLogs.length === 0) {
    lines.push("No medication logs recorded.");
  } else {
    const medNameById = new Map(data.medications.map((m) => [m.id, m.name]));
    const byMed = new Map<string, MedicationLogRow[]>();
    for (const log of data.medicationLogs) {
      const list = byMed.get(log.medication_id) ?? [];
      list.push(log);
      byMed.set(log.medication_id, list);
    }
    for (const [medId, logs] of byMed.entries()) {
      const name = medNameById.get(medId) ?? "Unknown medication";
      const given = logs.filter((l) => l.given).length;
      const missedDates = logs.filter((l) => !l.given).map((l) => l.observed_date);
      lines.push(
        `- ${name}: ${given}/${logs.length} doses given (${Math.round(
          (given / logs.length) * 100
        )}%)${missedDates.length > 0 ? `, missed on: ${missedDates.join(", ")}` : ""}`
      );
    }
  }
  lines.push("");

  lines.push("BLOODWORK / URINALYSIS RESULTS:");
  if (data.bloodworkResults.length === 0) {
    lines.push("No bloodwork uploaded.");
  } else {
    const byTest = new Map<string, BloodworkResultRow[]>();
    for (const r of data.bloodworkResults) {
      const list = byTest.get(r.test_name) ?? [];
      list.push(r);
      byTest.set(r.test_name, list);
    }
    for (const [testName, results] of byTest.entries()) {
      const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
      const parts = sorted.map(
        (r) =>
          `${r.date}: ${r.value}${r.unit ? ` ${r.unit}` : ""}${
            r.flag && r.flag !== "normal" ? ` [${r.flag}]` : ""
          }`
      );
      lines.push(
        `- ${testName}${sorted[0]?.reference_range ? ` (ref: ${sorted[0].reference_range})` : ""}: ${parts.join(
          "; "
        )}`
      );
    }
  }
  lines.push("");

  lines.push("RECENT CHANGES / VET VISITS (last 90 days):");
  if (data.changeLogEntries.length === 0) {
    lines.push("No recent changes logged.");
  } else {
    for (const c of data.changeLogEntries) {
      lines.push(`- ${c.event_date} [${c.category}]: ${c.description}`);
    }
  }

  return lines.join("\n");
}

export async function generateSynopsis(petId: string) {
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("name, species, breed, birth_date, medical_notes")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return;

  const { data: diagnosisRows } = await supabase
    .from("pet_diagnoses")
    .select("diagnosis")
    .eq("pet_id", petId);
  const diagnoses = (diagnosisRows ?? [])
    .map((d) => d.diagnosis.trim())
    .filter((d) => d.length > 0);

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { data: weightLogs },
    { data: feedingLogs },
    { data: feedingSchedules },
    { data: activeSymptoms },
    { data: medications },
    { data: medicationLogs },
    { data: bloodworkFiles },
    { data: changeLogEntries },
  ] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight, unit, logged_at, notes")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: true }),
    supabase
      .from("feeding_logs")
      .select("fed_at, percent_eaten, notes, schedule_id")
      .eq("pet_id", petId)
      .gte("fed_at", ninetyDaysAgo)
      .order("fed_at", { ascending: true }),
    supabase
      .from("feeding_schedules")
      .select("id, label, scheduled_time, active")
      .eq("pet_id", petId),
    supabase.from("pet_demeanor_symptoms").select("symptom_key").eq("pet_id", petId).eq("active", true),
    supabase
      .from("medications")
      .select("id, name, dosage, active, interval_days, start_date, end_date, notes")
      .eq("pet_id", petId),
    supabase
      .from("medication_logs")
      .select("medication_id, observed_date, given")
      .eq("pet_id", petId)
      .gte("observed_date", thirtyDaysAgo),
    supabase.from("bloodwork_files").select("id, taken_at, created_at").eq("pet_id", petId),
    supabase
      .from("change_log_entries")
      .select("event_date, category, description")
      .eq("pet_id", petId)
      .gte("event_date", ninetyDaysAgo)
      .order("event_date", { ascending: true }),
  ]);

  const scheduleIds = (feedingSchedules ?? []).map((s) => s.id);
  const medicationIds = (medications ?? []).map((m) => m.id);

  const [{ data: mealFoods }, { data: medicationScheduleTimes }] = await Promise.all([
    scheduleIds.length > 0
      ? supabase.from("meal_foods").select("schedule_id, title, url").in("schedule_id", scheduleIds)
      : Promise.resolve({ data: [] as MealFood[] }),
    medicationIds.length > 0
      ? supabase
          .from("medication_schedule_times")
          .select("id, medication_id, scheduled_time, linked_schedule_id")
          .in("medication_id", medicationIds)
      : Promise.resolve({ data: [] as MedicationScheduleTime[] }),
  ]);

  const activeSymptomKeys = (activeSymptoms ?? []).map((s) => s.symptom_key);
  const { data: demeanorObservations } =
    activeSymptomKeys.length > 0
      ? await supabase
          .from("demeanor_observations")
          .select("symptom_key, observed_date, value_numeric, notes")
          .eq("pet_id", petId)
          .in("symptom_key", activeSymptomKeys)
          .gte("observed_date", ninetyDaysAgo)
          .order("observed_date", { ascending: true })
      : { data: [] as DemeanorObservation[] };

  const fileDateById = new Map(
    (bloodworkFiles ?? []).map((f) => [f.id, f.taken_at ?? f.created_at.slice(0, 10)])
  );
  const bloodworkFileIds = (bloodworkFiles ?? []).map((f) => f.id);
  const { data: bloodworkResultsRaw } =
    bloodworkFileIds.length > 0
      ? await supabase
          .from("bloodwork_results")
          .select("bloodwork_file_id, test_name, value, unit, reference_range, flag")
          .in("bloodwork_file_id", bloodworkFileIds)
      : {
          data: [] as {
            bloodwork_file_id: string;
            test_name: string;
            value: string;
            unit: string | null;
            reference_range: string | null;
            flag: string | null;
          }[],
        };

  const bloodworkResults: BloodworkResultRow[] = (bloodworkResultsRaw ?? [])
    .map((r) => ({
      date: fileDateById.get(r.bloodwork_file_id) ?? "",
      test_name: r.test_name,
      value: r.value,
      unit: r.unit,
      reference_range: r.reference_range,
      flag: r.flag,
    }))
    .filter((r) => r.date);

  const summary = buildDataSummary({
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.birth_date ? formatAge(pet.birth_date, now) : "unknown",
    diagnoses,
    medicalNotes: pet.medical_notes,
    weightLogs: weightLogs ?? [],
    feedingLogs: feedingLogs ?? [],
    feedingSchedules: feedingSchedules ?? [],
    mealFoods: mealFoods ?? [],
    activeSymptomKeys,
    demeanorObservations: demeanorObservations ?? [],
    medications: medications ?? [],
    medicationScheduleTimes: medicationScheduleTimes ?? [],
    medicationLogs: medicationLogs ?? [],
    bloodworkResults,
    changeLogEntries: changeLogEntries ?? [],
  });

  const result = await generatePetSynopsis(summary);
  if (!result) {
    console.error("generateSynopsis: generatePetSynopsis returned null for pet", petId);
    return;
  }

  const { error: upsertError } = await supabase.from("pet_synopses").upsert(
    {
      pet_id: petId,
      current_state: result.currentState,
      recent_changes: result.recentChanges,
      trend: result.trend,
      prognosis: result.prognosis,
      suggestions: result.suggestions,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "pet_id" }
  );
  if (upsertError) {
    console.error("generateSynopsis: pet_synopses upsert failed:", upsertError);
  }

  revalidatePath(`/pets/${petId}/trends`);
}
