import { createClient, requireUser } from "@/lib/supabase/server";
import { formatTimeLabel, isDueOnInterval, localDateStr } from "@/lib/dates";
import { ReminderToggle } from "../../notifications/reminder-toggle";
import { DateNav } from "../../date-nav";
import { DoseRow } from "./dose-row";
import { ExtraDoseForm } from "./extra-dose-form";
import { ScheduleEditor } from "./schedule-editor";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function MedicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; med?: string }>;
}) {
  const user = await requireUser();
  const { id: petId } = await params;
  const { date, med: highlightMedId } = await searchParams;
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
  const selectedDate =
    date && DATE_RE.test(date) && date <= todayDate ? date : todayDate;

  const [{ data: medications }, { data: preference }, { data: feedingSchedules }] =
    await Promise.all([
      supabase
        .from("medications")
        .select("id, name, dosage, interval_days, start_date, notes, product_url")
        .eq("pet_id", petId)
        .eq("active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("notification_preferences")
        .select("medication_enabled")
        .eq("pet_id", petId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("feeding_schedules")
        .select("id, label")
        .eq("pet_id", petId)
        .eq("active", true)
        .order("scheduled_time", { ascending: true }),
    ]);

  const medicationIds = (medications ?? []).map((m) => m.id);

  const [{ data: scheduleTimes }, { data: logsForDate }] = await Promise.all([
    medicationIds.length > 0
      ? supabase
          .from("medication_schedule_times")
          .select("id, medication_id, scheduled_time, linked_schedule_id")
          .in("medication_id", medicationIds)
          .order("scheduled_time", { ascending: true })
      : Promise.resolve({
          data: [] as {
            id: string;
            medication_id: string;
            scheduled_time: string;
            linked_schedule_id: string | null;
          }[],
        }),
    supabase
      .from("medication_logs")
      .select("id, medication_id, schedule_time_id, given, notes")
      .eq("pet_id", petId)
      .eq("observed_date", selectedDate),
  ]);

  const scheduleTimeIds = new Set((scheduleTimes ?? []).map((t) => t.id));
  type LogRow = NonNullable<typeof logsForDate>[number];
  const logBySlot = new Map<string, LogRow>();
  const extraLogs: LogRow[] = [];
  for (const log of logsForDate ?? []) {
    if (log.schedule_time_id && scheduleTimeIds.has(log.schedule_time_id)) {
      logBySlot.set(log.schedule_time_id, log);
    } else {
      extraLogs.push(log);
    }
  }

  const medicationById = new Map((medications ?? []).map((m) => [m.id, m]));

  const dueScheduleTimes = (scheduleTimes ?? []).filter((t) => {
    const medication = medicationById.get(t.medication_id);
    if (!medication) return false;
    return isDueOnInterval(medication.start_date, selectedDate, medication.interval_days);
  });
  if (highlightMedId) {
    dueScheduleTimes.sort((a, b) => {
      const aMatch = a.medication_id === highlightMedId ? 0 : 1;
      const bMatch = b.medication_id === highlightMedId ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">
          {selectedDate === todayDate ? "Today's doses" : "Doses"}
        </h2>
        <DateNav
          basePath={`/pets/${petId}/logging/medications`}
          selectedDate={selectedDate}
          todayDate={todayDate}
        />
      </div>

      {dueScheduleTimes.length > 0 ? (
        <div className="flex flex-col gap-2">
          {(() => {
            const shownDetailsFor = new Set<string>();
            return dueScheduleTimes.map((t) => {
              const medication = medicationById.get(t.medication_id);
              if (!medication) return null;
              const log = logBySlot.get(t.id) ?? null;
              const intervalHint =
                medication.interval_days > 1
                  ? ` · every ${medication.interval_days} days`
                  : "";
              const isFirstForMedication = !shownDetailsFor.has(medication.id);
              shownDetailsFor.add(medication.id);
              return (
                <DoseRow
                  key={`${t.id}-${selectedDate}`}
                  petId={petId}
                  dateStr={selectedDate}
                  medicationId={medication.id}
                  scheduleTimeId={t.id}
                  label={`${medication.name}${medication.dosage ? ` (${medication.dosage})` : ""}`}
                  timeLabel={`${formatTimeLabel(t.scheduled_time)}${intervalHint}`}
                  log={log}
                  details={
                    isFirstForMedication
                      ? {
                          dosage: medication.dosage,
                          notes: medication.notes,
                          product_url: medication.product_url,
                        }
                      : null
                  }
                  linkedMealHref={
                    t.linked_schedule_id
                      ? `/pets/${petId}/logging/food?meal=${t.linked_schedule_id}`
                      : null
                  }
                />
              );
            });
          })()}
        </div>
      ) : medications && medications.length > 0 ? (
        <p className="text-sm text-gray-500">No doses due on this day.</p>
      ) : (
        <p className="text-sm text-gray-500">
          No medications configured yet — add one below.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {extraLogs.map((log) => {
          const medication = medicationById.get(log.medication_id);
          return (
            <DoseRow
              key={log.id}
              petId={petId}
              dateStr={selectedDate}
              medicationId={log.medication_id}
              scheduleTimeId={null}
              label={medication?.name ?? "Medication"}
              log={log}
            />
          );
        })}
        <ExtraDoseForm
          petId={petId}
          dateStr={selectedDate}
          medications={medications ?? []}
        />
      </div>

      <ScheduleEditor
        petId={petId}
        todayDate={todayDate}
        medications={(medications ?? []).map((m) => ({
          ...m,
          times: (scheduleTimes ?? []).filter((t) => t.medication_id === m.id),
        }))}
        feedingSchedules={feedingSchedules ?? []}
      />

      <ReminderToggle
        petId={petId}
        field="medication_enabled"
        label="Remind me about medications"
        initialEnabled={preference?.medication_enabled ?? false}
      />
    </div>
  );
}
