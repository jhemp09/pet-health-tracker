import { createClient } from "@/lib/supabase/server";
import { DemeanorSection } from "../health/demeanor-section";

export default async function DemeanorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: demeanorLogs } = await supabase
    .from("demeanor_logs")
    .select(
      "id, logged_at, energy_level, vomiting, vomiting_count, distancing, notes"
    )
    .eq("pet_id", petId)
    .order("logged_at", { ascending: false })
    .limit(60);

  return <DemeanorSection petId={petId} logs={demeanorLogs ?? []} />;
}
