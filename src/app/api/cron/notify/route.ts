import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPushToUsers } from "@/lib/notifications/send";
import { daysSince, localDateStr } from "@/lib/notifications/schedule";
import { isDueOnInterval } from "@/lib/dates";
import { getSymptomDef } from "@/lib/symptoms";

export const dynamic = "force-dynamic";

const WEIGH_IN_REMINDER_DAYS = 7;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000 * 8).toISOString();

  const [{ data: households }, { data: pets }] = await Promise.all([
    supabase.from("households").select("id, timezone"),
    supabase.from("pets").select("id, household_id, name"),
  ]);

  if (!households || !pets) {
    return NextResponse.json({ sent: 0 });
  }

  const timezoneByHousehold = new Map(households.map((h) => [h.id, h.timezone]));

  // user_id -> lines to include in that user's digest
  const digestByUser = new Map<string, string[]>();
  // user_id -> which pet(s) contributed lines, so a single-pet digest can
  // deep link straight to that pet's Quick Log instead of the household list.
  const petIdsByUser = new Map<string, Set<string>>();

  function addLine(userId: string, line: string, petId: string) {
    const lines = digestByUser.get(userId) ?? [];
    lines.push(line);
    digestByUser.set(userId, lines);

    const petIds = petIdsByUser.get(userId) ?? new Set<string>();
    petIds.add(petId);
    petIdsByUser.set(userId, petIds);
  }

  for (const pet of pets) {
    const timezone = timezoneByHousehold.get(pet.household_id) ?? "UTC";
    const today = localDateStr(timezone, now);

    const [
      { data: schedules },
      { data: todaysFeedingLogs },
      { data: medications },
      { data: todaysMedLogs },
      { data: lastWeightLog },
      { data: activeSymptoms },
      { data: todaysDemeanorObs },
      { data: preferences },
    ] = await Promise.all([
      supabase
        .from("feeding_schedules")
        .select("id, label")
        .eq("pet_id", pet.id)
        .eq("active", true),
      supabase
        .from("feeding_logs")
        .select("schedule_id, fed_at")
        .eq("pet_id", pet.id)
        .gte("fed_at", weekAgo),
      supabase
        .from("medications")
        .select("id, name, interval_days, start_date")
        .eq("pet_id", pet.id)
        .eq("active", true),
      supabase
        .from("medication_logs")
        .select("schedule_time_id, observed_date, given")
        .eq("pet_id", pet.id)
        .eq("observed_date", today),
      supabase
        .from("weight_logs")
        .select("logged_at")
        .eq("pet_id", pet.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("pet_demeanor_symptoms")
        .select("symptom_key")
        .eq("pet_id", pet.id)
        .eq("active", true),
      supabase
        .from("demeanor_observations")
        .select("symptom_key")
        .eq("pet_id", pet.id)
        .eq("observed_date", today),
      supabase
        .from("notification_preferences")
        .select(
          "user_id, feeding_enabled, medication_enabled, weight_enabled, demeanor_enabled"
        )
        .eq("pet_id", pet.id),
    ]);

    if (!preferences || preferences.length === 0) continue;

    const loggedTodayBySchedule = new Set(
      (todaysFeedingLogs ?? [])
        .filter((log) => localDateStr(timezone, new Date(log.fed_at)) === today)
        .map((log) => log.schedule_id)
    );
    const unloggedMeals = (schedules ?? []).filter(
      (s) => !loggedTodayBySchedule.has(s.id)
    );

    // Needs `medications` to resolve first to know which ids to filter by,
    // so this can't join the Promise.all above.
    const medicationIds = (medications ?? []).map((m) => m.id);
    const { data: allScheduleTimes } =
      medicationIds.length > 0
        ? await supabase
            .from("medication_schedule_times")
            .select("id, medication_id")
            .in("medication_id", medicationIds)
        : { data: [] as { id: string; medication_id: string }[] };

    const loggedScheduleTimeIds = new Set(
      (todaysMedLogs ?? [])
        .filter((log) => log.given && log.schedule_time_id)
        .map((log) => log.schedule_time_id)
    );
    const dueMedicationIds = new Set(
      (medications ?? [])
        .filter((m) => isDueOnInterval(m.start_date, today, m.interval_days))
        .map((m) => m.id)
    );
    const pendingMedNames = new Set(
      (allScheduleTimes ?? [])
        .filter(
          (st) =>
            dueMedicationIds.has(st.medication_id) &&
            !loggedScheduleTimeIds.has(st.id)
        )
        .map((st) => medications?.find((m) => m.id === st.medication_id)?.name)
        .filter((name): name is string => Boolean(name))
    );

    const weightOverdue =
      !lastWeightLog ||
      daysSince(timezone, lastWeightLog.logged_at, now) >= WEIGH_IN_REMINDER_DAYS;

    const loggedSymptomKeys = new Set(
      (todaysDemeanorObs ?? []).map((o) => o.symptom_key)
    );
    const missingSymptoms = (activeSymptoms ?? [])
      .filter((s) => !loggedSymptomKeys.has(s.symptom_key))
      .map((s) => getSymptomDef(s.symptom_key)?.label ?? s.symptom_key);

    for (const pref of preferences) {
      if (pref.feeding_enabled && unloggedMeals.length > 0) {
        addLine(
          pref.user_id,
          `${pet.name}: ${unloggedMeals.length} meal${unloggedMeals.length > 1 ? "s" : ""} not logged today (${unloggedMeals.map((s) => s.label).join(", ")})`,
          pet.id
        );
      }
      if (pref.medication_enabled && pendingMedNames.size > 0) {
        addLine(
          pref.user_id,
          `${pet.name}: medication due (${[...pendingMedNames].join(", ")})`,
          pet.id
        );
      }
      if (pref.weight_enabled && weightOverdue) {
        addLine(pref.user_id, `${pet.name}: hasn't been weighed in over a week`, pet.id);
      }
      if (pref.demeanor_enabled && missingSymptoms.length > 0) {
        addLine(
          pref.user_id,
          `${pet.name}: demeanor check-in incomplete (${missingSymptoms.join(", ")})`,
          pet.id
        );
      }
    }
  }

  let sentCount = 0;
  for (const [userId, lines] of digestByUser) {
    if (lines.length === 0) continue;
    const petIds = [...(petIdsByUser.get(userId) ?? [])];
    const url = petIds.length === 1 ? `/pets/${petIds[0]}/logging` : "/";
    await sendPushToUsers(supabase, [userId], {
      title: "Pet Health reminders",
      body: lines.join(" · "),
      url,
    });
    sentCount += 1;
  }

  return NextResponse.json({ sent: sentCount });
}
