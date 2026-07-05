import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { InviteButton } from "./invite-button";

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: household } = await supabase
    .from("households")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!household) {
    notFound();
  }

  const [{ data: members }, { data: pets }] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, role, display_name")
      .eq("household_id", id),
    supabase
      .from("pets")
      .select("id, name, species, breed, photo_url")
      .eq("household_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/" className="text-sm text-gray-500 underline">
          All households
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{household.name}</h1>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Pets</h2>
        {pets && pets.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link
                  href={`/pets/${pet.id}`}
                  className="flex items-center gap-3 rounded border border-gray-200 px-4 py-3 hover:bg-gray-50"
                >
                  {pet.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pet.photo_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                  )}
                  <div>
                    <span className="font-medium">{pet.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No pets yet.</p>
        )}
        <Link
          href={`/households/${id}/pets/new`}
          className="mt-3 inline-block text-sm underline"
        >
          Add a pet
        </Link>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Members</h2>
        <ul className="flex flex-col gap-1 text-sm text-gray-700">
          {members?.map((m) => (
            <li key={m.user_id}>
              {m.display_name ?? "Member"} — {m.role}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Invite someone</h2>
        <InviteButton householdId={id} />
      </section>
    </div>
  );
}
