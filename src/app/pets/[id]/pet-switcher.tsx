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

  if (pets.length < 2) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPetId = e.target.value;
    if (newPetId === petId) return;
    const rest = pathname?.slice(`/pets/${petId}`.length) ?? "";
    const query = searchParams?.toString();
    router.push(`/pets/${newPetId}${rest}${query ? `?${query}` : ""}`);
  }

  return (
    <select
      value={petId}
      onChange={handleChange}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      aria-label="Switch pet"
    >
      {pets.map((pet) => (
        <option key={pet.id} value={pet.id}>
          {pet.name}
        </option>
      ))}
    </select>
  );
}
