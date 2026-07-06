"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSymptomDef } from "@/lib/symptoms";

export async function addSymptom(petId: string, symptomKey: string) {
  const supabase = await createClient();
  await supabase
    .from("pet_demeanor_symptoms")
    .insert({ pet_id: petId, symptom_key: symptomKey });
  revalidatePath(`/pets/${petId}/logging/demeanor`);
}

export async function removeSymptom(petId: string, symptomId: string) {
  const supabase = await createClient();
  await supabase.from("pet_demeanor_symptoms").delete().eq("id", symptomId);
  revalidatePath(`/pets/${petId}/logging/demeanor`);
}

// demeanor_observations has a unique (pet_id, symptom_key, observed_date)
// constraint, so saving is a plain upsert — no need to track a log id
// across renders the way feeding/medication logs do.
export async function saveObservation(
  petId: string,
  symptomKey: string,
  dateStr: string,
  formData: FormData
) {
  const def = getSymptomDef(symptomKey);
  if (!def) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const raw = formData.get("value");
  if (raw === null || raw === "") return;
  const valueNumeric = Number(raw);
  if (Number.isNaN(valueNumeric)) return;
  if (def.scale.type === "relative_5" && (valueNumeric < 1 || valueNumeric > 5)) {
    return;
  }
  if (def.scale.type === "count" && valueNumeric < 0) return;

  await supabase.from("demeanor_observations").upsert(
    {
      pet_id: petId,
      symptom_key: symptomKey,
      observed_date: dateStr,
      value_numeric: valueNumeric,
      value_text: null,
      notes,
      logged_by: user.id,
    },
    { onConflict: "pet_id,symptom_key,observed_date" }
  );

  revalidatePath(`/pets/${petId}/logging/demeanor`);
  revalidatePath(`/pets/${petId}/logging`);
}

export async function deleteObservation(petId: string, observationId: string) {
  const supabase = await createClient();
  await supabase.from("demeanor_observations").delete().eq("id", observationId);
  revalidatePath(`/pets/${petId}/logging/demeanor`);
}
