import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Uploads to the public 'pet-photos' bucket at a fixed per-pet path (so
// re-uploading overwrites the old file instead of accumulating orphans) and
// returns a cache-busted public URL, or null if the file isn't a usable
// image or the upload failed.
export async function uploadPetPhoto(
  supabase: SupabaseClient<Database>,
  householdId: string,
  petId: string,
  file: File
): Promise<string | null> {
  if (!file.type.startsWith("image/") || file.size === 0) return null;

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const storagePath = `${householdId}/${petId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(storagePath, file, { contentType: file.type, upsert: true });
  if (uploadError) return null;

  const { data } = supabase.storage.from("pet-photos").getPublicUrl(storagePath);
  return `${data.publicUrl}?v=${Date.now()}`;
}
