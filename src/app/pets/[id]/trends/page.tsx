import { createClient } from "@/lib/supabase/server";
import { ChartsSection } from "../charts/charts-section";
import { ChangeLogTimeline } from "./change-log-timeline";

export default async function TrendsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const [
    { data: feedingLogs },
    { data: weightLogs },
    { data: vomitingObservations },
    { data: changeLogEntries },
  ] = await Promise.all([
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
      .from("demeanor_observations")
      .select("observed_date, value_numeric")
      .eq("pet_id", petId)
      .eq("symptom_key", "vomiting_count")
      .order("observed_date", { ascending: false })
      .limit(60),
    supabase
      .from("change_log_entries")
      .select("id, event_date, category, description")
      .eq("pet_id", petId)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ChartsSection
        feedingLogs={feedingLogs ?? []}
        weightLogs={weightLogs ?? []}
        vomitingObservations={vomitingObservations ?? []}
      />
      <ChangeLogTimeline petId={petId} entries={changeLogEntries ?? []} />
    </div>
  );
}
