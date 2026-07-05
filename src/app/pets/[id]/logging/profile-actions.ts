"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePetProfile(
  petId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "dog");
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const birthDate = String(formData.get("birth_date") ?? "").trim() || null;

  if (!name) return { ok: false, error: "Name is required" };

  const supabase = await createClient();
  const { data: pet, error } = await supabase
    .from("pets")
    .update({
      name,
      species: species as "dog" | "cat" | "other",
      breed,
      birth_date: birthDate,
    })
    .eq("id", petId)
    .select("household_id")
    .single();

  if (error || !pet) return { ok: false, error: error?.message ?? "Could not save" };

  revalidatePath(`/pets/${petId}/logging`);
  revalidatePath(`/pets/${petId}/logging`, "layout");
  revalidatePath(`/households/${pet.household_id}`);

  return { ok: true };
}
