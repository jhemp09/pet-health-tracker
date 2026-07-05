import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPushToUsers } from "@/lib/notifications/send";
import { daysSince, localDateStr } from "@/lib/notifications/schedule";

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

  function addLine(userId: string, line: string) {
    const lines = digestByUser.get(userId) ?? [];
    lines.push(line);
    digestByUser.set(userId, lines);
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
      { data: todaysDemeanorLogs },
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
        .select("id, name, schedule_times")
        .eq("pet_id", pet.id)
        .eq("active", true),
      supabase
        .from("medication_logs")
        .select("medication_id, given_at")
        .eq("pet_id", pet.id)
        .gte("given_at", weekAgo),
      supabase
        .from("weight_logs")
        .select("logged_at")
        .eq("pet_id", pet.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("demeanor_logs")
        .select("logged_at")
        .eq("pet_id", pet.id)
        .gte("logged_at", weekAgo),
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

    const dosesLoggedTodayByMed = new Map<string, number>();
    for (const log of todaysMedLogs ?? []) {
      if (localDateStr(timezone, new Date(log.given_at)) !== today) continue;
      dosesLoggedTodayByMed.set(
        log.medication_id,
        (dosesLoggedTodayByMed.get(log.medication_id) ?? 0) + 1
      );
    }
    const pendingMeds = (medications ?? []).filter(
      (m) => (dosesLoggedTodayByMed.get(m.id) ?? 0) < Math.max(m.schedule_times.length, 1)
    );

    const weightOverdue =
      !lastWeightLog ||
      daysSince(timezone, lastWeightLog.logged_at, now) >= WEIGH_IN_REMINDER_DAYS;

    const demeanorLoggedToday = (todaysDemeanorLogs ?? []).some(
      (log) => localDateStr(timezone, new Date(log.logged_at)) === today
    );

    for (const pref of preferences) {
      if (pref.feeding_enabled && unloggedMeals.length > 0) {
        addLine(
          pref.user_id,
          `${pet.name}: ${unloggedMeals.length} meal${unloggedMeals.length > 1 ? "s" : ""} not logged today (${unloggedMeals.map((s) => s.label).join(", ")})`
        );
      }
      if (pref.medication_enabled && pendingMeds.length > 0) {
        addLine(
          pref.user_id,
          `${pet.name}: medication due (${pendingMeds.map((m) => m.name).join(", ")})`
        );
      }
      if (pref.weight_enabled && weightOverdue) {
        addLine(pref.user_id, `${pet.name}: hasn't been weighed in over a week`);
      }
      if (pref.demeanor_enabled && !demeanorLoggedToday) {
        addLine(pref.user_id, `${pet.name}: no demeanor check-in today`);
      }
    }
  }

  let sentCount = 0;
  for (const [userId, lines] of digestByUser) {
    if (lines.length === 0) continue;
    await sendPushToUsers(supabase, [userId], {
      title: "Pet Health reminders",
      body: lines.join(" · "),
      url: "/",
    });
    sentCount += 1;
  }

  return NextResponse.json({ sent: sentCount });
}
