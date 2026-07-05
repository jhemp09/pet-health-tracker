import { createClient } from "@/lib/supabase/server";
import { MedicationsSection } from "./medications-section";

export default async function MedicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const [{ data: medications }, { data: medicationLogs }] = await Promise.all([
    supabase
      .from("medications")
      .select("id, name, dosage, schedule_times")
      .eq("pet_id", petId)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("medication_logs")
      .select("id, medication_id, given, given_at")
      .eq("pet_id", petId)
      .order("given_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <MedicationsSection
      petId={petId}
      medications={medications ?? []}
      logs={medicationLogs ?? []}
    />
  );
}
