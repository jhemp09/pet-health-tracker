"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logChangeEvent } from "@/lib/change-log";

export async function uploadBloodwork(petId: string, formData: FormData) {
  const file = formData.get("file");
  const takenAt = String(formData.get("taken_at") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!(file instanceof File) || file.size === 0) return;

  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: pet } = await supabase
    .from("pets")
    .select("household_id")
    .eq("id", petId)
    .maybeSingle();
  if (!pet) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${pet.household_id}/${petId}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("bloodwork")
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) return;

  await supabase.from("bloodwork_files").insert({
    pet_id: petId,
    uploaded_by: user.id,
    storage_path: storagePath,
    file_name: file.name,
    file_type: isPdf ? "pdf" : "image",
    taken_at: takenAt,
    notes,
  });

  await logChangeEvent(
    supabase,
    petId,
    "bloodwork",
    `Vet visit / bloodwork: ${file.name}`,
    takenAt ?? undefined
  );

  revalidatePath(`/pets/${petId}/medical`);
}

export async function deleteBloodworkFile(
  petId: string,
  fileId: string,
  storagePath: string
) {
  const supabase = await createClient();
  await supabase.storage.from("bloodwork").remove([storagePath]);
  await supabase.from("bloodwork_files").delete().eq("id", fileId);
  revalidatePath(`/pets/${petId}/medical`);
}

export async function getBloodworkUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("bloodwork")
    .createSignedUrl(storagePath, 60 * 5);
  if (error) return null;
  return data.signedUrl;
}
