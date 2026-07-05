import { createClient } from "@/lib/supabase/server";
import { BloodworkSection } from "./bloodwork-section";

export default async function BloodworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: bloodworkFiles } = await supabase
    .from("bloodwork_files")
    .select("id, file_name, file_type, storage_path, taken_at, notes")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });

  return <BloodworkSection petId={petId} files={bloodworkFiles ?? []} />;
}
