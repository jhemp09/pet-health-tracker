import { notFound } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { formatAge } from "@/lib/dates";
import { BackLink } from "./back-link";
import { BottomNav } from "./bottom-nav";
import { PetHeaderPhoto } from "./pet-header-photo";
import { PetSwitcher } from "./pet-switcher";

export default async function PetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species, breed, birth_date, household_id, photo_url")
    .eq("id", id)
    .maybeSingle();

  if (!pet) {
    notFound();
  }

  const { data: householdPets } = await supabase
    .from("pets")
    .select("id, name")
    .eq("household_id", pet.household_id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col overflow-x-hidden px-6 pb-20 pt-6">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BackLink petId={id} householdId={pet.household_id} />
          <PetSwitcher petId={id} pets={householdPets ?? []} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <PetHeaderPhoto
            petId={id}
            photoUrl={pet.photo_url}
            petName={pet.name}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">{pet.name}</h1>
            <p className="truncate text-sm text-gray-600">
              {pet.breed ? `${pet.breed} · ` : ""}
              {pet.birth_date ? formatAge(pet.birth_date, new Date()) : ""}
            </p>
          </div>
        </div>
      </div>

      {children}

      <BottomNav petId={id} householdId={pet.household_id} />
    </div>
  );
}
