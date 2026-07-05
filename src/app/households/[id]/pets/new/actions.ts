"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPet(householdId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const species = String(formData.get("species") ?? "dog");
  const breed = String(formData.get("breed") ?? "").trim() || null;
  const birthDate = String(formData.get("birth_date") ?? "") || null;

  if (!name) {
    redirect(
      `/households/${householdId}/pets/new?error=${encodeURIComponent("Name is required")}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .insert({
      household_id: householdId,
      name,
      species: species as "dog" | "cat" | "other",
      breed,
      birth_date: birthDate,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/households/${householdId}/pets/new?error=${encodeURIComponent(error?.message ?? "Could not create pet")}`
    );
  }

  redirect(`/pets/${data.id}`);
}
