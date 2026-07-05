"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { localDateStr } from "@/lib/dates";

const BASE_PATH_SUFFIX = "/logging/medications";

async function getPetTimezone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  petId: string
) {
  const { data: pet } = await supabase
    .from("pets")
    .select("households(timezone)")
    .eq("id", petId)
    .maybeSingle();
  return (
    (pet?.households as unknown as { timezone: string } | null)?.timezone ??
    "UTC"
  );
}

export async function addMedication(petId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const dosage = String(formData.get("dosage") ?? "").trim() || null;
  const scheduledTime = String(formData.get("scheduled_time") ?? "");
  const intervalDays = Math.max(1, Number(formData.get("interval_days")) || 1);

  if (!name || !scheduledTime) return;

  const supabase = await createClient();
  const timezone = await getPetTimezone(supabase, petId);
  const startDate = localDateStr(timezone, new Date());

  const { data: medication } = await supabase
    .from("medications")
    .insert({ pet_id: petId, name, dosage, interval_days: intervalDays, start_date: startDate })
    .select("id")
    .single();

  if (medication) {
    await supabase
      .from("medication_schedule_times")
      .insert({ medication_id: medication.id, scheduled_time: scheduledTime });
  }

  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

export async function updateMedication(
  petId: string,
  medicationId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const dosage = String(formData.get("dosage") ?? "").trim() || null;
  const intervalDays = Math.max(1, Number(formData.get("interval_days")) || 1);
  if (!name) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("medications")
    .select("interval_days")
    .eq("id", medicationId)
    .maybeSingle();

  // Changing the interval restarts the count from today, so "every 3 days"
  // means "every 3 days starting now" rather than reusing a stale anchor.
  const intervalChanged = existing && existing.interval_days !== intervalDays;
  const startDate = intervalChanged
    ? localDateStr(await getPetTimezone(supabase, petId), new Date())
    : undefined;

  await supabase
    .from("medications")
    .update({
      name,
      dosage,
      interval_days: intervalDays,
      ...(startDate ? { start_date: startDate } : {}),
    })
    .eq("id", medicationId);

  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

export async function removeMedication(petId: string, medicationId: string) {
  const supabase = await createClient();
  await supabase.from("medications").delete().eq("id", medicationId);
  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

export async function addScheduleTime(
  petId: string,
  medicationId: string,
  formData: FormData
) {
  const scheduledTime = String(formData.get("scheduled_time") ?? "");
  if (!scheduledTime) return;

  const supabase = await createClient();
  await supabase
    .from("medication_schedule_times")
    .insert({ medication_id: medicationId, scheduled_time: scheduledTime });

  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

export async function updateScheduleTime(
  petId: string,
  scheduleTimeId: string,
  formData: FormData
) {
  const scheduledTime = String(formData.get("scheduled_time") ?? "");
  if (!scheduledTime) return;

  const supabase = await createClient();
  await supabase
    .from("medication_schedule_times")
    .update({ scheduled_time: scheduledTime })
    .eq("id", scheduleTimeId);

  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

export async function removeScheduleTime(
  petId: string,
  scheduleTimeId: string
) {
  const supabase = await createClient();
  await supabase
    .from("medication_schedule_times")
    .delete()
    .eq("id", scheduleTimeId);
  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

// Saves (creates or updates) a single dose entry for a specific
// household-local calendar day, mirroring saveFeedingForDate.
export async function saveMedicationForDate(
  petId: string,
  medicationId: string,
  scheduleTimeId: string | null,
  dateStr: string,
  logId: string | null,
  formData: FormData
) {
  const given = formData.get("given") === "true";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (logId) {
    await supabase
      .from("medication_logs")
      .update({ given, notes })
      .eq("id", logId);
  } else {
    await supabase.from("medication_logs").insert({
      pet_id: petId,
      medication_id: medicationId,
      schedule_time_id: scheduleTimeId,
      observed_date: dateStr,
      given,
      notes,
      logged_by: user.id,
    });
  }

  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}

export async function deleteMedicationLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("medication_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}${BASE_PATH_SUFFIX}`);
}
