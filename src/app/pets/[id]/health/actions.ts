"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logWeight(petId: string, formData: FormData) {
  const weight = Number(formData.get("weight"));
  const unit = String(formData.get("unit") ?? "lb");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (Number.isNaN(weight) || weight <= 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("weight_logs").insert({
    pet_id: petId,
    logged_by: user.id,
    weight,
    unit: unit as "lb" | "kg",
    notes,
  });

  revalidatePath(`/pets/${petId}`);
}

export async function deleteWeightLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("weight_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}`);
}

export async function logDemeanor(petId: string, formData: FormData) {
  const energyLevel = Number(formData.get("energy_level")) || null;
  const vomiting = formData.get("vomiting") === "on";
  const vomitingCount = vomiting
    ? Number(formData.get("vomiting_count")) || 1
    : 0;
  const distancing = formData.get("distancing") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("demeanor_logs").insert({
    pet_id: petId,
    logged_by: user.id,
    energy_level: energyLevel,
    vomiting,
    vomiting_count: vomitingCount,
    distancing,
    notes,
  });

  revalidatePath(`/pets/${petId}`);
}

export async function deleteDemeanorLog(petId: string, logId: string) {
  const supabase = await createClient();
  await supabase.from("demeanor_logs").delete().eq("id", logId);
  revalidatePath(`/pets/${petId}`);
}
