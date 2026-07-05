"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath(`/pets/${petId}`);
}

export async function removeFeedingSchedule(petId: string, scheduleId: string) {
  const supabase = await createClient();
  await supabase.from("feeding_schedules").delete().eq("id", scheduleId);
  revalidatePath(`/pets/${petId}`);
}

export async function logFeeding(petId: string, formData: FormData) {
  const scheduleId = String(formData.get("schedule_id") ?? "") || null;
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

  await supabase.from("feeding_logs").insert({
    pet_id: petId,
    schedule_id: scheduleId,
    logged_by: user.id,
    percent_eaten: percentEaten,
    notes,
  });

  revalidatePath(`/pets/${petId}`);
}

export async function deleteFeedingLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("feeding_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}`);
}
