import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { TabNav } from "./tab-nav";

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
    .select("id, name, species, breed, birth_date, household_id")
    .eq("id", id)
    .maybeSingle();

  if (!pet) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link
          href={`/households/${pet.household_id}`}
          className="text-sm text-gray-500 underline"
        >
          Back to household
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{pet.name}</h1>
        <p className="text-sm text-gray-600">
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ""}
          {pet.birth_date ? ` · born ${pet.birth_date}` : ""}
        </p>
      </div>

      <TabNav petId={id} />

      {children}
    </div>
  );
}
