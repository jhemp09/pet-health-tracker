import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PhotoUpload } from "./photo-upload";

const ITEMS = [
  { slug: "food", label: "Food", hint: "Meals & % eaten" },
  { slug: "medications", label: "Medications", hint: "Doses given" },
  { slug: "demeanor", label: "Demeanor", hint: "Symptoms & energy" },
  { slug: "weight", label: "Weight", hint: "Track over time" },
];

export default async function LoggingHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("photo_url")
    .eq("id", petId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-4">
      <PhotoUpload petId={petId} photoUrl={pet?.photo_url ?? null} />

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.slug}
            href={`/pets/${petId}/logging/${item.slug}`}
            className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-xs text-gray-500">{item.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
