"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BackLink({
  petId,
  householdId,
}: {
  petId: string;
  householdId: string;
}) {
  const pathname = usePathname();
  const isLoggingSubPage =
    pathname?.startsWith(`/pets/${petId}/logging/`) ?? false;

  if (isLoggingSubPage) {
    return (
      <Link
        href={`/pets/${petId}/logging`}
        className="text-sm text-gray-500 underline"
      >
        Back to Logging
      </Link>
    );
  }

  return (
    <Link
      href={`/households/${householdId}`}
      className="text-sm text-gray-500 underline"
    >
      Back to household
    </Link>
  );
}
