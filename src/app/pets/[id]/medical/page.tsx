import { createClient } from "@/lib/supabase/server";
import { BloodworkSection } from "./bloodwork-section";

// The upload action calls out to Claude to parse the file, which can take
// longer than the platform's default serverless timeout.
export const maxDuration = 60;

export default async function BloodworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: bloodworkFiles } = await supabase
    .from("bloodwork_files")
    .select(
      "id, file_name, file_type, storage_path, taken_at, notes, parse_status, parsed_summary"
    )
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });

  type BloodworkResultRow = {
    id: string;
    bloodwork_file_id: string;
    test_name: string;
    value: string;
    unit: string | null;
    reference_range: string | null;
    flag: "low" | "high" | "normal" | "abnormal" | null;
  };

  const fileIds = (bloodworkFiles ?? []).map((f) => f.id);
  const { data: results } =
    fileIds.length > 0
      ? await supabase
          .from("bloodwork_results")
          .select("id, bloodwork_file_id, test_name, value, unit, reference_range, flag")
          .in("bloodwork_file_id", fileIds)
      : { data: [] as BloodworkResultRow[] };

  const resultsByFile = new Map<string, BloodworkResultRow[]>();
  for (const r of results ?? []) {
    const list = resultsByFile.get(r.bloodwork_file_id) ?? [];
    list.push(r);
    resultsByFile.set(r.bloodwork_file_id, list);
  }

  const files = (bloodworkFiles ?? []).map((f) => ({
    ...f,
    results: resultsByFile.get(f.id) ?? [],
  }));

  return <BloodworkSection petId={petId} files={files} />;
}
