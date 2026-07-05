import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPushToUsers } from "@/lib/notifications/send";
import { isDue, localParts, timeStringToMinutes } from "@/lib/notifications/schedule";

export const dynamic = "force-dynamic";

const MED_TOLERANCE_MINUTES = 180;
const WEEKLY_WEIGH_IN_DAY = "Sun";
const WEEKLY_WEIGH_IN_TIME = "09:00";
const DAILY_DEMEANOR_TIME = "20:00";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: households }, { data: pets }] = await Promise.all([
    supabase.from("households").select("id, timezone"),
    supabase.from("pets").select("id, household_id, name"),
  ]);

  if (!households || !pets) {
    return NextResponse.json({ sent: 0 });
  }

  const timezoneByHousehold = new Map(
    households.map((h) => [h.id, h.timezone])
  );

  let sentCount = 0;

  for (const pet of pets) {
    const timezone = timezoneByHousehold.get(pet.household_id) ?? "UTC";
    const { weekday, dateStr, minutesSinceMidnight } = localParts(
      timezone,
      now
    );

    const [
      { data: schedules },
      { data: recentFeedingLogs },
      { data: medications },
      { data: recentMedLogs },
      { data: recentWeightLogs },
      { data: recentDemeanorLogs },
      { data: preferences },
    ] = await Promise.all([
      supabase
        .from("feeding_schedules")
        .select("id, label, scheduled_time")
        .eq("pet_id", pet.id)
        .eq("active", true),
      supabase
        .from("feeding_logs")
        .select("schedule_id, fed_at")
        .eq("pet_id", pet.id)
        .gte("fed_at", dayAgo),
      supabase
        .from("medications")
        .select("id, name, schedule_times")
        .eq("pet_id", pet.id)
        .eq("active", true),
      supabase
        .from("medication_logs")
        .select("medication_id, given_at")
        .eq("pet_id", pet.id)
        .gte("given_at", dayAgo),
      supabase
        .from("weight_logs")
        .select("logged_at")
        .eq("pet_id", pet.id)
        .gte("logged_at", dayAgo),
      supabase
        .from("demeanor_logs")
        .select("logged_at")
        .eq("pet_id", pet.id)
        .gte("logged_at", dayAgo),
      supabase
        .from("notification_preferences")
        .select(
          "user_id, feeding_enabled, medication_enabled, weight_enabled, demeanor_enabled"
        )
        .eq("pet_id", pet.id),
    ]);

    if (!preferences || preferences.length === 0) continue;

    // Feeding reminders
    const feedingRecipients = preferences
      .filter((p) => p.feeding_enabled)
      .map((p) => p.user_id);
    for (const schedule of schedules ?? []) {
      const scheduledMinutes = timeStringToMinutes(schedule.scheduled_time);
      if (!isDue(scheduledMinutes, minutesSinceMidnight)) continue;

      const alreadyLogged = (recentFeedingLogs ?? []).some(
        (log) =>
          log.schedule_id === schedule.id &&
          localParts(timezone, new Date(log.fed_at)).dateStr === dateStr
      );
      if (alreadyLogged) continue;

      await sendPushToUsers(supabase, feedingRecipients, {
        title: `${pet.name}'s ${schedule.label}`,
        body: `Time to feed ${pet.name} — log how much they ate.`,
        url: `/pets/${pet.id}`,
      });
      sentCount += feedingRecipients.length;
    }

    // Medication reminders
    const medRecipients = preferences
      .filter((p) => p.medication_enabled)
      .map((p) => p.user_id);
    for (const medication of medications ?? []) {
      for (const time of medication.schedule_times) {
        const scheduledMinutes = timeStringToMinutes(time);
        if (!isDue(scheduledMinutes, minutesSinceMidnight)) continue;

        const alreadyLogged = (recentMedLogs ?? []).some((log) => {
          if (log.medication_id !== medication.id) return false;
          const logParts = localParts(timezone, new Date(log.given_at));
          return (
            logParts.dateStr === dateStr &&
            Math.abs(logParts.minutesSinceMidnight - scheduledMinutes) <=
              MED_TOLERANCE_MINUTES
          );
        });
        if (alreadyLogged) continue;

        await sendPushToUsers(supabase, medRecipients, {
          title: `${pet.name}'s medication`,
          body: `Time for ${pet.name}'s ${medication.name} — mark it given.`,
          url: `/pets/${pet.id}`,
        });
        sentCount += medRecipients.length;
      }
    }

    // Weekly weigh-in reminder
    if (
      weekday === WEEKLY_WEIGH_IN_DAY &&
      isDue(timeStringToMinutes(WEEKLY_WEIGH_IN_TIME), minutesSinceMidnight)
    ) {
      const weightRecipients = preferences
        .filter((p) => p.weight_enabled)
        .map((p) => p.user_id);
      const loggedThisWeek = (recentWeightLogs ?? []).length > 0;
      if (!loggedThisWeek) {
        await sendPushToUsers(supabase, weightRecipients, {
          title: `Weigh in ${pet.name}`,
          body: `It's been a while since ${pet.name}'s last weight check.`,
          url: `/pets/${pet.id}`,
        });
        sentCount += weightRecipients.length;
      }
    }

    // Daily demeanor check-in reminder
    if (isDue(timeStringToMinutes(DAILY_DEMEANOR_TIME), minutesSinceMidnight)) {
      const demeanorRecipients = preferences
        .filter((p) => p.demeanor_enabled)
        .map((p) => p.user_id);
      const loggedToday = (recentDemeanorLogs ?? []).some(
        (log) => localParts(timezone, new Date(log.logged_at)).dateStr === dateStr
      );
      if (!loggedToday) {
        await sendPushToUsers(supabase, demeanorRecipients, {
          title: `How's ${pet.name} doing?`,
          body: `Log ${pet.name}'s energy, appetite, and any vomiting today.`,
          url: `/pets/${pet.id}`,
        });
        sentCount += demeanorRecipients.length;
      }
    }
  }

  return NextResponse.json({ sent: sentCount });
}
