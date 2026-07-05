"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    slug: "logging",
    label: "Logging",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3v2h6V3M8 10h8M8 14h8M8 18h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "medical",
    label: "Medical",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "trends",
    label: "Trends",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 19V5M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function BottomNav({ petId }: { petId: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {ITEMS.map((item) => {
          const href = `/pets/${petId}/${item.slug}`;
          const isActive = pathname?.startsWith(href);
          return (
            <Link
              key={item.slug}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? "text-black" : "text-gray-400"
              }`}
            >
              <span className="h-6 w-6">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
