"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logChangeEvent } from "@/lib/change-log";
import { parseBloodworkFile } from "@/lib/bloodwork-parser";
import { localNoonInstant } from "@/lib/dates";

function guessMimeType(fileName: string, fileType: "image" | "pdf") {
  if (fileType === "pdf") return "application/pdf";
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

// Downloads the file back from storage (works whether this runs right
// after upload or as a later retry), sends it to Claude to extract
// structured lab values, and records the result on bloodwork_files/
// bloodwork_results. Best-effort — a parse failure never blocks the
// upload itself, it just leaves the file without extracted data.
async function runBloodworkParse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fileId: string,
  storagePath: string,
  mimeType: string
) {
  const { data: blob, error: downloadError } = await supabase.storage
    .from("bloodwork")
    .download(storagePath);

  if (downloadError || !blob) {
    console.error("runBloodworkParse: storage download failed", fileId, downloadError);
    await supabase.from("bloodwork_files").update({ parse_status: "failed" }).eq("id", fileId);
    return;
  }

  const bytes = Buffer.from(await blob.arrayBuffer());
  const parsed = await parseBloodworkFile(bytes, mimeType);

  if (!parsed) {
    console.error("runBloodworkParse: parseBloodworkFile returned null for file", fileId, mimeType, bytes.length);
    await supabase.from("bloodwork_files").update({ parse_status: "failed" }).eq("id", fileId);
    return;
  }

  await supabase.from("bloodwork_results").delete().eq("bloodwork_file_id", fileId);
  if (parsed.results.length > 0) {
    await supabase
      .from("bloodwork_results")
      .insert(parsed.results.map((r) => ({ bloodwork_file_id: fileId, ...r })));
  }

  // A re-parse/retry should replace this file's own weight entry rather
  // than adding a duplicate each time.
  await supabase.from("weight_logs").delete().eq("bloodwork_file_id", fileId);
  if (parsed.weight) {
    const [{ data: fileRow }, { data: userData }] = await Promise.all([
      supabase
        .from("bloodwork_files")
        .select("pet_id, taken_at, created_at, pets(households(timezone))")
        .eq("id", fileId)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);
    const user = userData.user;
    if (fileRow && user) {
      const timezone =
        (
          fileRow.pets as unknown as { households: { timezone: string } | null } | null
        )?.households?.timezone ?? "UTC";
      const dateStr = fileRow.taken_at ?? fileRow.created_at.slice(0, 10);
      await supabase.from("weight_logs").insert({
        pet_id: fileRow.pet_id,
        logged_by: user.id,
        weight: parsed.weight.value,
        unit: parsed.weight.unit,
        logged_at: localNoonInstant(timezone, dateStr).toISOString(),
        notes: "From bloodwork upload",
        bloodwork_file_id: fileId,
      });
    }
  }

  await supabase
    .from("bloodwork_files")
    .update({
      parse_status: "done",
      parsed_summary: parsed.summary,
      parsed_at: new Date().toISOString(),
    })
    .eq("id", fileId);
}

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

  const { data: inserted } = await supabase
    .from("bloodwork_files")
    .insert({
      pet_id: petId,
      uploaded_by: user.id,
      storage_path: storagePath,
      file_name: file.name,
      file_type: isPdf ? "pdf" : "image",
      taken_at: takenAt,
      notes,
      mime_type: file.type,
    })
    .select("id")
    .single();

  await logChangeEvent(
    supabase,
    petId,
    "bloodwork",
    `Vet visit / bloodwork: ${file.name}`,
    takenAt ?? undefined
  );

  if (inserted) {
    await runBloodworkParse(supabase, inserted.id, storagePath, file.type);
  }

  revalidatePath(`/pets/${petId}/medical`);
}

export async function retryParseBloodwork(petId: string, fileId: string) {
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("bloodwork_files")
    .select("storage_path, mime_type, file_type, file_name")
    .eq("id", fileId)
    .maybeSingle();
  if (!file) return;

  const mimeType = file.mime_type ?? guessMimeType(file.file_name, file.file_type);
  await runBloodworkParse(supabase, fileId, file.storage_path, mimeType);
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

export async function addDiagnosis(petId: string) {
  const supabase = await createClient();
  await supabase.from("pet_diagnoses").insert({ pet_id: petId });
  revalidatePath(`/pets/${petId}/medical`);
}

export async function updateDiagnosis(petId: string, diagnosisId: string, diagnosis: string) {
  const supabase = await createClient();
  await supabase.from("pet_diagnoses").update({ diagnosis }).eq("id", diagnosisId);
  revalidatePath(`/pets/${petId}/medical`);
}

export async function removeDiagnosis(petId: string, diagnosisId: string) {
  const supabase = await createClient();
  await supabase.from("pet_diagnoses").delete().eq("id", diagnosisId);
  revalidatePath(`/pets/${petId}/medical`);
}

export async function updateMedicalNotes(petId: string, notes: string) {
  const supabase = await createClient();
  await supabase
    .from("pets")
    .update({ medical_notes: notes.trim() || null })
    .eq("id", petId);
  revalidatePath(`/pets/${petId}/medical`);
}
