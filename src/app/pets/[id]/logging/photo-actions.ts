"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadPetPhoto } from "@/lib/pet-photo";

export async function updatePetPhoto(
  petId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected" };
  }

  const supabase = await createClient();
  const { data: pet } = await supabase
    .from("pets")
    .select("household_id")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return { ok: false, error: "Pet not found" };

  const { url: photoUrl, error: uploadErrorMessage } = await uploadPetPhoto(
    supabase,
    pet.household_id,
    petId,
    file
  );
  if (!photoUrl) {
    return { ok: false, error: uploadErrorMessage ?? "Upload failed" };
  }

  const { error: updateError } = await supabase
    .from("pets")
    .update({ photo_url: photoUrl })
    .eq("id", petId);
  if (updateError) return { ok: false, error: updateError.message };

  // The photo widget lives on the logging page itself (needs a "page"
  // revalidation), while the small header icon comes from the shared
  // pets/[id] layout (needs a "layout" revalidation) — both are required.
  revalidatePath(`/pets/${petId}/logging`);
  revalidatePath(`/pets/${petId}/logging`, "layout");
  revalidatePath(`/households/${pet.household_id}`);

  return { ok: true };
}

export async function removePetPhoto(
  petId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: pet } = await supabase
    .from("pets")
    .select("household_id")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return { ok: false, error: "Pet not found" };

  const { error: updateError } = await supabase
    .from("pets")
    .update({ photo_url: null })
    .eq("id", petId);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/pets/${petId}/logging`);
  revalidatePath(`/pets/${petId}/logging`, "layout");
  revalidatePath(`/households/${pet.household_id}`);

  return { ok: true };
}
