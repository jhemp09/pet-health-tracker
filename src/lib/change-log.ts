import type { createClient } from "@/lib/supabase/server";
import { localDateStr } from "@/lib/dates";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Records an entry in a pet's change log (shown as a timeline on the
// Trends page). `eventDate` defaults to "today" in the pet's household
// timezone, but callers pass an explicit date for things like bloodwork
// taken on a specific past day.
export async function logChangeEvent(
  supabase: SupabaseClient,
  petId: string,
  category: "medication" | "food" | "bloodwork" | "manual",
  description: string,
  eventDate?: string
) {
  let dateStr = eventDate;
  if (!dateStr) {
    const { data: pet } = await supabase
      .from("pets")
      .select("households(timezone)")
      .eq("id", petId)
      .maybeSingle();
    const timezone =
      (pet?.households as unknown as { timezone: string } | null)?.timezone ??
      "UTC";
    dateStr = localDateStr(timezone, new Date());
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("change_log_entries").insert({
    pet_id: petId,
    event_date: dateStr,
    category,
    description,
    created_by: user?.id ?? null,
  });
}
