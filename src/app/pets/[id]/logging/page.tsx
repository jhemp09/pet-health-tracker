import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatAge, formatTimeLabel, isDueOnInterval, localDateStr } from "@/lib/dates";
import { getSymptomDef } from "@/lib/symptoms";
import { PetProfileCard } from "./pet-profile-card";
import { CATEGORY_BG, CATEGORY_COLOR, CATEGORY_ICON, type Category } from "./category-icons";
import { QuickLog, type PendingDose, type PendingMeal, type PendingSymptom } from "./quick-log";

const ITEMS: { slug: Category; label: string }[] = [
  { slug: "food", label: "Food" },
  { slug: "medications", label: "Medications" },
  { slug: "demeanor", label: "Demeanor" },
  { slug: "weight", label: "Weight" },
];

export default async function LoggingHubPage({
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
  const todayDate = localDateStr(timezone, now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoDateStr = localDateStr(timezone, sevenDaysAgo);

  const dayMs = 24 * 60 * 60 * 1000;
  const todayBase = new Date(`${todayDate}T00:00:00.000Z`).getTime();
  const todayRangeStart = new Date(todayBase - dayMs).toISOString();
  const todayRangeEnd = new Date(todayBase + 2 * dayMs).toISOString();

  const [
    { data: mealSchedules },
    { data: todaysFeedingLogsRaw },
    { data: medications },
    { data: todaysMedLogs },
    { data: activeSymptoms },
    { data: todaysDemeanorObs },
  ] = await Promise.all([
    supabase
      .from("feeding_schedules")
      .select("id, label")
      .eq("pet_id", petId)
      .eq("active", true),
    supabase
      .from("feeding_logs")
      .select("schedule_id, fed_at")
      .eq("pet_id", petId)
      .gte("fed_at", todayRangeStart)
      .lt("fed_at", todayRangeEnd),
    supabase
      .from("medications")
      .select("id, name, dosage, interval_days, start_date")
      .eq("pet_id", petId)
      .eq("active", true),
    supabase
      .from("medication_logs")
      .select("schedule_time_id")
      .eq("pet_id", petId)
      .eq("observed_date", todayDate),
    supabase
      .from("pet_demeanor_symptoms")
      .select("symptom_key")
      .eq("pet_id", petId)
      .eq("active", true),
    supabase
      .from("demeanor_observations")
      .select("symptom_key")
      .eq("pet_id", petId)
      .eq("observed_date", todayDate),
  ]);

  const medicationIds = (medications ?? []).map((m) => m.id);
  const { data: scheduleTimes } =
    medicationIds.length > 0
      ? await supabase
          .from("medication_schedule_times")
          .select("id, medication_id, scheduled_time")
          .in("medication_id", medicationIds)
      : { data: [] as { id: string; medication_id: string; scheduled_time: string }[] };

  const loggedScheduleIds = new Set(
    (todaysFeedingLogsRaw ?? [])
      .filter((l) => localDateStr(timezone, new Date(l.fed_at)) === todayDate)
      .map((l) => l.schedule_id)
  );
  const pendingMeals: PendingMeal[] = (mealSchedules ?? [])
    .filter((s) => !loggedScheduleIds.has(s.id))
    .map((s) => ({ key: `meal-${s.id}`, scheduleId: s.id, label: s.label }));

  const dueMedicationIds = new Set(
    (medications ?? [])
      .filter((m) => isDueOnInterval(m.start_date, todayDate, m.interval_days))
      .map((m) => m.id)
  );
  const loggedScheduleTimeIds = new Set(
    (todaysMedLogs ?? []).map((l) => l.schedule_time_id).filter((id): id is string => Boolean(id))
  );
  const pendingDoses: PendingDose[] = (scheduleTimes ?? [])
    .filter((t) => dueMedicationIds.has(t.medication_id) && !loggedScheduleTimeIds.has(t.id))
    .map((t) => {
      const medication = medications?.find((m) => m.id === t.medication_id);
      return {
        key: `dose-${t.id}`,
        medicationId: t.medication_id,
        scheduleTimeId: t.id,
        label: `${medication?.name ?? "Medication"}${medication?.dosage ? ` (${medication.dosage})` : ""} · ${formatTimeLabel(t.scheduled_time)}`,
      };
    });

  const loggedSymptomKeys = new Set((todaysDemeanorObs ?? []).map((o) => o.symptom_key));
  const pendingSymptoms: PendingSymptom[] = (activeSymptoms ?? [])
    .flatMap((s) => {
      if (loggedSymptomKeys.has(s.symptom_key)) return [];
      const def = getSymptomDef(s.symptom_key);
      return def ? [{ key: `symptom-${s.symptom_key}`, symptomKey: s.symptom_key, def }] : [];
    });

  const [
    { data: weightLogs },
    { data: feedingLogs },
    { data: medicationLogs },
    { data: demeanorObservations },
  ] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight, unit, logged_at")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: false })
      .limit(2),
    supabase
      .from("feeding_logs")
      .select("percent_eaten, fed_at")
      .eq("pet_id", petId)
      .gte("fed_at", fourteenDaysAgo.toISOString()),
    supabase
      .from("medication_logs")
      .select("given, observed_date")
      .eq("pet_id", petId)
      .gte("observed_date", sevenDaysAgoDateStr),
    supabase
      .from("demeanor_observations")
      .select("observed_date")
      .eq("pet_id", petId)
      .gte("observed_date", sevenDaysAgoDateStr),
  ]);

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
    (demeanorObservations ?? []).map((o) => o.observed_date)
  ).size;

  return (
    <div className="flex flex-col gap-4">
      <QuickLog
        petId={petId}
        dateStr={todayDate}
        meals={pendingMeals}
        doses={pendingDoses}
        symptoms={pendingSymptoms}
      />

      <PetProfileCard
        petId={petId}
        name={pet?.name ?? ""}
        species={pet?.species ?? "dog"}
        breed={pet?.breed ?? null}
        birthDate={pet?.birth_date ?? null}
        age={pet?.birth_date ? formatAge(pet.birth_date, now) : null}
        stats={{ latestWeight, foodIntake, medAdherence, demeanorDaysLogged }}
      />

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.slug}
            href={`/pets/${petId}/logging/${item.slug}`}
            className="card flex flex-col items-center gap-2 p-4 transition-transform hover:-translate-y-0.5"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: CATEGORY_BG[item.slug], color: CATEGORY_COLOR[item.slug] }}
            >
              <span className="h-6 w-6">{CATEGORY_ICON[item.slug]}</span>
            </span>
            <span className="font-heading font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
