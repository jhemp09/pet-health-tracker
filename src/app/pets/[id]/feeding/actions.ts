"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { localNoonInstant } from "@/lib/dates";

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

  revalidatePath(`/pets/${petId}/feeding`);
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
  await supabase
    .from("feeding_schedules")
    .update({ label, scheduled_time: scheduledTime })
    .eq("id", scheduleId);

  revalidatePath(`/pets/${petId}/feeding`);
}

export async function removeFeedingSchedule(petId: string, scheduleId: string) {
  const supabase = await createClient();
  await supabase.from("feeding_schedules").delete().eq("id", scheduleId);
  revalidatePath(`/pets/${petId}/feeding`);
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

  revalidatePath(`/pets/${petId}/feeding`);
}

export async function deleteFeedingLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("feeding_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}/feeding`);
}
