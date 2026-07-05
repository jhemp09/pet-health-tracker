"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addMedication(petId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const dosage = String(formData.get("dosage") ?? "").trim() || null;
  const timesRaw = String(formData.get("schedule_times") ?? "");
  const scheduleTimes = timesRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!name) return;

  const supabase = await createClient();
  await supabase.from("medications").insert({
    pet_id: petId,
    name,
    dosage,
    schedule_times: scheduleTimes,
  });

  revalidatePath(`/pets/${petId}`);
}

export async function removeMedication(petId: string, medicationId: string) {
  const supabase = await createClient();
  await supabase.from("medications").delete().eq("id", medicationId);
  revalidatePath(`/pets/${petId}`);
}

export async function logMedicationDose(
  petId: string,
  medicationId: string,
  given: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("medication_logs").insert({
    medication_id: medicationId,
    pet_id: petId,
    logged_by: user.id,
    given,
  });

  revalidatePath(`/pets/${petId}`);
}

export async function deleteMedicationLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("medication_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}`);
}
