"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "feeding", label: "Feeding" },
  { slug: "medications", label: "Medications" },
  { slug: "weight", label: "Weight" },
  { slug: "demeanor", label: "Demeanor" },
  { slug: "bloodwork", label: "Bloodwork" },
  { slug: "trends", label: "Trends" },
  { slug: "reminders", label: "Reminders" },
];

export function TabNav({ petId }: { petId: string }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-6 flex gap-1 overflow-x-auto border-b border-gray-200 px-6">
      {TABS.map((tab) => {
        const href = `/pets/${petId}/${tab.slug}`;
        const isActive = pathname?.startsWith(href);
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
              isActive
                ? "border-black font-medium text-black"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
