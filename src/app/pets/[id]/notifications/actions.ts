"use server";

import { createClient } from "@/lib/supabase/server";

type ReminderField =
  | "feeding_enabled"
  | "medication_enabled"
  | "weight_enabled"
  | "demeanor_enabled";

// Updates a single reminder flag without disturbing the other three — an
// upsert payload only sets the columns present in it, so omitted flags keep
// their existing value (or fall back to the table's `default false` on a
// brand-new row).
export async function setReminderPreference(
  petId: string,
  field: ReminderField,
  enabled: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const payload: {
    user_id: string;
    pet_id: string;
    feeding_enabled?: boolean;
    medication_enabled?: boolean;
    weight_enabled?: boolean;
    demeanor_enabled?: boolean;
  } = { user_id: user.id, pet_id: petId };
  payload[field] = enabled;

  await supabase
    .from("notification_preferences")
    .upsert(payload, { onConflict: "user_id,pet_id" });
}
