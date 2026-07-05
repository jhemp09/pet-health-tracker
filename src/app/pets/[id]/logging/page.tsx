import Link from "next/link";

const ITEMS = [
  {
    slug: "food",
    label: "Food",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path
          d="M6 3v7a3 3 0 0 0 3 3v8M6 3v6M9 3v6M6 9h3M15 3c-1.5 2-2 4-2 6a2 2 0 0 0 4 0V3M15 12v9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    slug: "medications",
    label: "Medications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect
          x="4"
          y="8"
          width="16"
          height="10"
          rx="5"
          transform="rotate(-45 12 13)"
        />
        <path d="M9 16l6-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "demeanor",
    label: "Demeanor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="13" r="7" />
        <path d="M9 12v.01M15 12v.01M9.5 16c.8.7 1.7 1 2.5 1s1.7-.3 2.5-1" strokeLinecap="round" />
        <path d="M8 6.5C7 5 6 4.5 5 5M16 6.5c1-1.5 2-2 3-1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "weight",
    label: "Weight",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="13" r="8" />
        <path d="M9 13a3 3 0 0 1 6 0" strokeLinecap="round" />
        <path d="M12 5v1.5M12 3.5h0" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function LoggingHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.slug}
            href={`/pets/${petId}/logging/${item.slug}`}
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <span className="h-7 w-7 text-gray-700">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
