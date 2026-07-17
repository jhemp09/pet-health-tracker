"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function PetSwitcher({
  petId,
  pets,
}: {
  petId: string;
  pets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const otherPets = pets.filter((pet) => pet.id !== petId);
  if (otherPets.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPetId = e.target.value;
    if (!newPetId) return;
    const rest = pathname?.slice(`/pets/${petId}`.length) ?? "";
    const query = searchParams?.toString();
    router.push(`/pets/${newPetId}${rest}${query ? `?${query}` : ""}`);
  }

  return (
    <select
      value=""
      onChange={handleChange}
      className="max-w-[45vw] shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      aria-label="Switch pet"
    >
      <option value="" disabled>
        Switch pet
      </option>
      {otherPets.map((pet) => (
        <option key={pet.id} value={pet.id}>
          {pet.name}
        </option>
      ))}
    </select>
  );
}
