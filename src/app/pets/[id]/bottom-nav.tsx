"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function buildItems(petId: string, householdId: string) {
  return [
    {
      href: `/households/${householdId}`,
      label: "Household",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 11l8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: `/pets/${petId}/logging`,
      label: "Logging",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3v2h6V3M8 10h8M8 14h8M8 18h5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: `/pets/${petId}/medical`,
      label: "Medical",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: `/pets/${petId}/trends`,
      label: "Trends",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 19V5M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];
}

export function BottomNav({
  petId,
  householdId,
}: {
  petId: string;
  householdId: string;
}) {
  const pathname = usePathname();
  const items = buildItems(petId, householdId);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {items.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-xs"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={
                  isActive
                    ? { background: "var(--color-primary-light)", color: "var(--color-primary-dark)" }
                    : { color: "var(--color-muted)" }
                }
              >
                <span className="h-5 w-5">{item.icon}</span>
              </span>
              <span
                className="font-medium"
                style={{ color: isActive ? "var(--color-primary-dark)" : "var(--color-muted)" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
