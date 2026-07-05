import { createClient, requireUser } from "@/lib/supabase/server";
import { localDateStr } from "@/lib/dates";
import { ReminderToggle } from "../../notifications/reminder-toggle";
import { DateNav } from "../../date-nav";
import { MealRow } from "./meal-row";
import { ExtraFeedingForm } from "./extra-feeding-form";
import { ScheduleEditor } from "./schedule-editor";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function FeedingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const { id: petId } = await params;
  const { date } = await searchParams;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("household_id, households(timezone)")
    .eq("id", petId)
    .maybeSingle();
  const timezone =
    (pet?.households as unknown as { timezone: string } | null)?.timezone ??
    "UTC";

  const todayDate = localDateStr(timezone, new Date());
  const selectedDate = date && DATE_RE.test(date) && date <= todayDate ? date : todayDate;

  const dayMs = 24 * 60 * 60 * 1000;
  const base = new Date(`${selectedDate}T00:00:00.000Z`).getTime();
  const rangeStart = new Date(base - dayMs).toISOString();
  const rangeEnd = new Date(base + 2 * dayMs).toISOString();

  const [{ data: schedules }, { data: logsInRange }, { data: preference }] =
    await Promise.all([
      supabase
        .from("feeding_schedules")
        .select("id, label, scheduled_time")
        .eq("pet_id", petId)
        .eq("active", true)
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("feeding_logs")
        .select("id, schedule_id, fed_at, percent_eaten, notes")
        .eq("pet_id", petId)
        .gte("fed_at", rangeStart)
        .lt("fed_at", rangeEnd)
        .order("fed_at", { ascending: false }),
      supabase
        .from("notification_preferences")
        .select("feeding_enabled")
        .eq("pet_id", petId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const todaysLogs = (logsInRange ?? []).filter(
    (log) => localDateStr(timezone, new Date(log.fed_at)) === selectedDate
  );

  const scheduleIds = new Set((schedules ?? []).map((s) => s.id));
  const logByScheduleId = new Map<string, (typeof todaysLogs)[number]>();
  const extraLogs: typeof todaysLogs = [];
  for (const log of todaysLogs) {
    if (log.schedule_id && scheduleIds.has(log.schedule_id)) {
      if (!logByScheduleId.has(log.schedule_id)) {
        logByScheduleId.set(log.schedule_id, log);
      }
    } else {
      extraLogs.push(log);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">
          {selectedDate === todayDate ? "Today's meals" : "Meals"}
        </h2>
        <DateNav
          basePath={`/pets/${petId}/logging/food`}
          selectedDate={selectedDate}
          todayDate={todayDate}
        />
      </div>

      {schedules && schedules.length > 0 ? (
        <div className="flex flex-col gap-2">
          {schedules.map((s) => (
            <MealRow
              key={s.id}
              petId={petId}
              dateStr={selectedDate}
              scheduleId={s.id}
              label={s.label}
              timeLabel={s.scheduled_time.slice(0, 5)}
              log={logByScheduleId.get(s.id) ?? null}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No meals configured yet — add one below.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {extraLogs.map((log) => (
          <MealRow
            key={log.id}
            petId={petId}
            dateStr={selectedDate}
            scheduleId={null}
            label="Extra feeding"
            log={log}
          />
        ))}
        <ExtraFeedingForm petId={petId} dateStr={selectedDate} />
      </div>

      <ScheduleEditor petId={petId} schedules={schedules ?? []} />

      <ReminderToggle
        petId={petId}
        field="feeding_enabled"
        label="Remind me about meals"
        initialEnabled={preference?.feeding_enabled ?? false}
      />
    </div>
  );
}
