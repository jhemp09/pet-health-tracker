"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logChangeEvent } from "@/lib/change-log";

export async function addManualChangeLogEntry(petId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  if (!description || !eventDate) return;

  const supabase = await createClient();
  await logChangeEvent(supabase, petId, "manual", description, eventDate);

  revalidatePath(`/pets/${petId}/trends`);
}

export async function deleteChangeLogEntry(petId: string, entryId: string) {
  const supabase = await createClient();
  await supabase.from("change_log_entries").delete().eq("id", entryId);
  revalidatePath(`/pets/${petId}/trends`);
}
