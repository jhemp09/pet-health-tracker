"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatAge } from "@/lib/dates";
import { RELATIVE_5_LABELS, SYMPTOM_CATALOG } from "@/lib/symptoms";
import { generatePetSynopsis } from "@/lib/pet-synopsis";

type WeightLog = { weight: number; unit: string; logged_at: string; notes: string | null };
type FeedingLog = { fed_at: string; percent_eaten: number; notes: string | null };
type DemeanorObservation = {
  symptom_key: string;
  observed_date: string;
  value_numeric: number | null;
  notes: string | null;
};
type MedicationLog = { given: boolean };
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
  weightLogs: WeightLog[];
  feedingLogs: FeedingLog[];
  activeSymptomKeys: string[];
  demeanorObservations: DemeanorObservation[];
  medicationLogs: MedicationLog[];
  bloodworkResults: BloodworkResultRow[];
  changeLogEntries: ChangeLogEntry[];
}): string {
  const lines: string[] = [];

  lines.push(
    `Pet: ${data.name}, ${data.species}${data.breed ? `, ${data.breed}` : ""}, age ${data.age}.`,
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

  lines.push("MEDICATION ADHERENCE (last 30 days):");
  if (data.medicationLogs.length === 0) {
    lines.push("No medication logs recorded.");
  } else {
    const given = data.medicationLogs.filter((m) => m.given).length;
    lines.push(
      `- ${given}/${data.medicationLogs.length} doses given (${Math.round(
        (given / data.medicationLogs.length) * 100
      )}%).`
    );
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
    .select("name, species, breed, birth_date")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return;

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
    { data: activeSymptoms },
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
      .select("fed_at, percent_eaten, notes")
      .eq("pet_id", petId)
      .gte("fed_at", ninetyDaysAgo)
      .order("fed_at", { ascending: true }),
    supabase.from("pet_demeanor_symptoms").select("symptom_key").eq("pet_id", petId).eq("active", true),
    supabase
      .from("medication_logs")
      .select("given")
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
    weightLogs: weightLogs ?? [],
    feedingLogs: feedingLogs ?? [],
    activeSymptomKeys,
    demeanorObservations: demeanorObservations ?? [],
    medicationLogs: medicationLogs ?? [],
    bloodworkResults,
    changeLogEntries: changeLogEntries ?? [],
  });

  const result = await generatePetSynopsis(summary);
  if (!result) return;

  await supabase.from("pet_synopses").upsert(
    {
      pet_id: petId,
      current_state: result.currentState,
      trend: result.trend,
      prognosis: result.prognosis,
      suggestions: result.suggestions,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "pet_id" }
  );

  revalidatePath(`/pets/${petId}/trends`);
}
