import { notFound } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { formatAge } from "@/lib/dates";
import { BackLink } from "./back-link";
import { BottomNav } from "./bottom-nav";
import { PetHeaderPhoto } from "./pet-header-photo";

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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 pb-20 pt-6">
      <div className="mb-4">
        <BackLink petId={id} householdId={pet.household_id} />
        <div className="mt-2 flex items-center gap-3">
          <PetHeaderPhoto
            petId={id}
            photoUrl={pet.photo_url}
            petName={pet.name}
          />
          <div>
            <h1 className="text-xl font-semibold">{pet.name}</h1>
            <p className="text-sm text-gray-600">
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
