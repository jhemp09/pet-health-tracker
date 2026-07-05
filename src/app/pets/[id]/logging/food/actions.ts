"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { localNoonInstant } from "@/lib/dates";
import { logChangeEvent } from "@/lib/change-log";

export async function addFeedingSchedule(petId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const scheduledTime = String(formData.get("scheduled_time") ?? "");

  if (!label || !scheduledTime) return;

  const supabase = await createClient();
  await supabase.from("feeding_schedules").insert({
    pet_id: petId,
    label,
    scheduled_time: scheduledTime,
  });

  await logChangeEvent(
    supabase,
    petId,
    "food",
    `Added meal "${label}" at ${scheduledTime}`
  );

  revalidatePath(`/pets/${petId}/logging/food`);
}

export async function updateFeedingSchedule(
  petId: string,
  scheduleId: string,
  formData: FormData
) {
  const label = String(formData.get("label") ?? "").trim();
  const scheduledTime = String(formData.get("scheduled_time") ?? "");

  if (!label || !scheduledTime) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("feeding_schedules")
    .select("label, scheduled_time")
    .eq("id", scheduleId)
    .maybeSingle();

  await supabase
    .from("feeding_schedules")
    .update({ label, scheduled_time: scheduledTime })
    .eq("id", scheduleId);

  if (existing) {
    if (existing.label !== label) {
      await logChangeEvent(
        supabase,
        petId,
        "food",
        `Renamed meal "${existing.label}" to "${label}"`
      );
    }
    if (existing.scheduled_time.slice(0, 5) !== scheduledTime) {
      await logChangeEvent(
        supabase,
        petId,
        "food",
        `Changed "${label}" time from ${existing.scheduled_time.slice(0, 5)} to ${scheduledTime}`
      );
    }
  }

  revalidatePath(`/pets/${petId}/logging/food`);
}

export async function removeFeedingSchedule(petId: string, scheduleId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("feeding_schedules")
    .select("label")
    .eq("id", scheduleId)
    .maybeSingle();

  await supabase.from("feeding_schedules").delete().eq("id", scheduleId);

  if (existing) {
    await logChangeEvent(
      supabase,
      petId,
      "food",
      `Deleted meal "${existing.label}"`
    );
  }

  revalidatePath(`/pets/${petId}/logging/food`);
}

// Saves (creates or updates) a single feeding entry for a specific
// household-local calendar day. Passing an existing `logId` updates that
// row; otherwise a new log is inserted, timestamped at local noon on
// `dateStr` so it reliably groups under that day regardless of timezone.
export async function saveFeedingForDate(
  petId: string,
  scheduleId: string | null,
  dateStr: string,
  logId: string | null,
  formData: FormData
) {
  const percentEaten = Number(formData.get("percent_eaten"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (Number.isNaN(percentEaten) || percentEaten < 0 || percentEaten > 100) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (logId) {
    await supabase
      .from("feeding_logs")
      .update({ percent_eaten: percentEaten, notes })
      .eq("id", logId);
  } else {
    const { data: pet } = await supabase
      .from("pets")
      .select("households(timezone)")
      .eq("id", petId)
      .maybeSingle();
    const timezone =
      (pet?.households as unknown as { timezone: string } | null)?.timezone ??
      "UTC";

    await supabase.from("feeding_logs").insert({
      pet_id: petId,
      schedule_id: scheduleId,
      logged_by: user.id,
      percent_eaten: percentEaten,
      notes,
      fed_at: localNoonInstant(timezone, dateStr).toISOString(),
    });
  }

  revalidatePath(`/pets/${petId}/logging/food`);
}

export async function deleteFeedingLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("feeding_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}/logging/food`);
}
