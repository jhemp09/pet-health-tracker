import { createClient } from "@/lib/supabase/server";
import { formatAge, localDateStr } from "@/lib/dates";
import { PetProfileCard } from "../logging/pet-profile-card";
import { ChartsSection } from "../charts/charts-section";
import { ChangeLogTimeline } from "./change-log-timeline";

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("name, species, breed, birth_date, households(timezone)")
    .eq("id", petId)
    .maybeSingle();

  const timezone =
    (pet?.households as unknown as { timezone: string } | null)?.timezone ??
    "UTC";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoDateStr = localDateStr(timezone, sevenDaysAgo);

  const [
    { data: feedingLogs },
    { data: feedingSchedules },
    { data: weightLogs },
    { data: changeLogEntries },
    { data: medicationLogs },
    { data: activeSymptoms },
  ] = await Promise.all([
    supabase
      .from("feeding_logs")
      .select("id, fed_at, percent_eaten, notes, schedule_id")
      .eq("pet_id", petId)
      .order("fed_at", { ascending: false })
      .limit(200),
    supabase.from("feeding_schedules").select("id, label").eq("pet_id", petId),
    supabase
      .from("weight_logs")
      .select("id, weight, unit, logged_at, notes")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: false })
      .limit(60),
    supabase
      .from("change_log_entries")
      .select("id, event_date, category, description")
      .eq("pet_id", petId)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("medication_logs")
      .select("given, observed_date")
      .eq("pet_id", petId)
      .gte("observed_date", sevenDaysAgoDateStr),
    supabase
      .from("pet_demeanor_symptoms")
      .select("symptom_key")
      .eq("pet_id", petId)
      .eq("active", true),
  ]);

  const activeSymptomKeys = (activeSymptoms ?? []).map((s) => s.symptom_key);
  const { data: demeanorObservations } =
    activeSymptomKeys.length > 0
      ? await supabase
          .from("demeanor_observations")
          .select("symptom_key, observed_date, value_numeric")
          .eq("pet_id", petId)
          .in("symptom_key", activeSymptomKeys)
      : { data: [] as { symptom_key: string; observed_date: string; value_numeric: number | null }[] };

  const observationsBySymptom: Record<
    string,
    { observed_date: string; value_numeric: number | null }[]
  > = {};
  for (const o of demeanorObservations ?? []) {
    const list = observationsBySymptom[o.symptom_key] ?? [];
    list.push({ observed_date: o.observed_date, value_numeric: o.value_numeric });
    observationsBySymptom[o.symptom_key] = list;
  }

  const mealLabels = Object.fromEntries(
    (feedingSchedules ?? []).map((s) => [s.id, s.label])
  );

  const latestWeight = weightLogs?.[0]
    ? {
        value: weightLogs[0].weight,
        unit: weightLogs[0].unit,
        changeText: (() => {
          const previous = weightLogs[1];
          if (!previous || previous.unit !== weightLogs[0].unit) return "";
          const diff =
            Math.round((weightLogs[0].weight - previous.weight) * 10) / 10;
          if (diff === 0) return "no change";
          return diff > 0 ? `up ${diff}` : `down ${Math.abs(diff)}`;
        })(),
      }
    : null;

  const sevenAgoMs = sevenDaysAgo.getTime();
  const recentFeeding = (feedingLogs ?? []).filter(
    (l) => new Date(l.fed_at).getTime() >= sevenAgoMs
  );
  const priorFeeding = (feedingLogs ?? []).filter(
    (l) => new Date(l.fed_at).getTime() < sevenAgoMs
  );
  const average = (entries: { percent_eaten: number }[]) =>
    entries.length
      ? Math.round(
          entries.reduce((sum, l) => sum + l.percent_eaten, 0) /
            entries.length
        )
      : null;
  const recentAvg = average(recentFeeding);
  const priorAvg = average(priorFeeding);
  const foodIntake =
    recentAvg === null
      ? null
      : {
          avg: recentAvg,
          trendText:
            priorAvg === null
              ? ""
              : Math.abs(recentAvg - priorAvg) < 3
                ? "steady"
                : recentAvg > priorAvg
                  ? `up from ${priorAvg}%`
                  : `down from ${priorAvg}%`,
        };

  const medTotal = medicationLogs?.length ?? 0;
  const medAdherence =
    medTotal > 0
      ? {
          pct: Math.round(
            (medicationLogs!.filter((l) => l.given).length / medTotal) * 100
          ),
        }
      : null;

  const demeanorDaysLogged = new Set(
    (demeanorObservations ?? [])
      .filter((o) => o.observed_date >= sevenDaysAgoDateStr)
      .map((o) => o.observed_date)
  ).size;

  return (
    <div className="flex flex-col gap-6">
      <PetProfileCard
        petId={petId}
        name={pet?.name ?? ""}
        species={pet?.species ?? "dog"}
        breed={pet?.breed ?? null}
        birthDate={pet?.birth_date ?? null}
        age={pet?.birth_date ? formatAge(pet.birth_date, now) : null}
        stats={{ latestWeight, foodIntake, medAdherence, demeanorDaysLogged }}
      />

      <ChartsSection
        feedingLogs={feedingLogs ?? []}
        mealLabels={mealLabels}
        weightLogs={weightLogs ?? []}
        activeSymptomKeys={activeSymptomKeys}
        observationsBySymptom={observationsBySymptom}
      />
      <ChangeLogTimeline petId={petId} entries={changeLogEntries ?? []} />
    </div>
  );
}
