import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Uploads to the public 'pet-photos' bucket at a fixed per-pet path (so
// re-uploading overwrites the old file instead of accumulating orphans) and
// returns a cache-busted public URL. Returns an error message instead of
// silently failing so callers can surface what actually went wrong.
export async function uploadPetPhoto(
  supabase: SupabaseClient<Database>,
  householdId: string,
  petId: string,
  file: File | Blob,
  fileName = "photo.jpg"
): Promise<{ url: string | null; error: string | null }> {
  const type = file instanceof File ? file.type : "image/jpeg";
  if (!type.startsWith("image/") || file.size === 0) {
    return { url: null, error: "File must be an image" };
  }

  const nameForExt = file instanceof File ? file.name : fileName;
  const ext =
    nameForExt.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const storagePath = `${householdId}/${petId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(storagePath, file, { contentType: type, upsert: true });
  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("pet-photos").getPublicUrl(storagePath);
  return { url: `${data.publicUrl}?v=${Date.now()}`, error: null };
}
