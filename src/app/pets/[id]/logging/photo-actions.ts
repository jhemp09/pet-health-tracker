"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadPetPhoto } from "@/lib/pet-photo";

export async function updatePetPhoto(petId: string, formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return;

  const supabase = await createClient();
  const { data: pet } = await supabase
    .from("pets")
    .select("household_id")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return;

  const photoUrl = await uploadPetPhoto(supabase, pet.household_id, petId, file);
  if (!photoUrl) return;

  await supabase.from("pets").update({ photo_url: photoUrl }).eq("id", petId);

  revalidatePath(`/pets/${petId}/logging`, "layout");
  revalidatePath(`/households/${pet.household_id}`);
}

export async function removePetPhoto(petId: string) {
  const supabase = await createClient();
  const { data: pet } = await supabase
    .from("pets")
    .select("household_id")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return;

  await supabase.from("pets").update({ photo_url: null }).eq("id", petId);

  revalidatePath(`/pets/${petId}/logging`, "layout");
  revalidatePath(`/households/${pet.household_id}`);
}
