"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateNotificationPreferences(
  petId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      pet_id: petId,
      feeding_enabled: formData.get("feeding_enabled") === "on",
      medication_enabled: formData.get("medication_enabled") === "on",
      weight_enabled: formData.get("weight_enabled") === "on",
      demeanor_enabled: formData.get("demeanor_enabled") === "on",
    },
    { onConflict: "user_id,pet_id" }
  );

  revalidatePath(`/pets/${petId}`);
}
