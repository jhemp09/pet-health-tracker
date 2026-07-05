import { notFound } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { BackLink } from "./back-link";
import { BottomNav } from "./bottom-nav";

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
        <div className="mt-1 flex items-center gap-2">
          {pet.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.photo_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : null}
          <h1 className="text-xl font-semibold">{pet.name}</h1>
        </div>
        <p className="text-sm text-gray-600">
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ""}
          {pet.birth_date ? ` · born ${pet.birth_date}` : ""}
        </p>
      </div>

      {children}

      <BottomNav petId={id} householdId={pet.household_id} />
    </div>
  );
}
