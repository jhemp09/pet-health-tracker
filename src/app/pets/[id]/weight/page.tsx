import { createClient } from "@/lib/supabase/server";
import { WeightSection } from "../health/weight-section";

export default async function WeightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("id, weight, unit, logged_at, notes")
    .eq("pet_id", petId)
    .order("logged_at", { ascending: false })
    .limit(60);

  return <WeightSection petId={petId} logs={weightLogs ?? []} />;
}
