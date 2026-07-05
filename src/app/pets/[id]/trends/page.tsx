import { createClient } from "@/lib/supabase/server";
import { ChartsSection } from "../charts/charts-section";

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const [{ data: feedingLogs }, { data: weightLogs }, { data: demeanorLogs }] =
    await Promise.all([
      supabase
        .from("feeding_logs")
        .select("id, fed_at, percent_eaten, notes, schedule_id")
        .eq("pet_id", petId)
        .order("fed_at", { ascending: false })
        .limit(60),
      supabase
        .from("weight_logs")
        .select("id, weight, unit, logged_at, notes")
        .eq("pet_id", petId)
        .order("logged_at", { ascending: false })
        .limit(60),
      supabase
        .from("demeanor_logs")
        .select(
          "id, logged_at, energy_level, vomiting, vomiting_count, distancing, notes"
        )
        .eq("pet_id", petId)
        .order("logged_at", { ascending: false })
        .limit(60),
    ]);

  return (
    <ChartsSection
      feedingLogs={feedingLogs ?? []}
      weightLogs={weightLogs ?? []}
      demeanorLogs={demeanorLogs ?? []}
    />
  );
}
