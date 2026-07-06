import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTimeLabel, isDueOnInterval, localDateStr } from "@/lib/dates";
import { getSymptomDef } from "@/lib/symptoms";
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
    .select("households(timezone)")
    .eq("id", petId)
    .maybeSingle();

  const timezone =
    (pet?.households as unknown as { timezone: string } | null)?.timezone ??
    "UTC";
  const now = new Date();
  const todayDate = localDateStr(timezone, now);

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

  return (
    <div className="flex flex-col gap-4">
      <QuickLog
        petId={petId}
        dateStr={todayDate}
        meals={pendingMeals}
        doses={pendingDoses}
        symptoms={pendingSymptoms}
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
