import Link from "next/link";

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

  return (
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
  );
}
