import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { InviteButton } from "./invite-button";

const RING_COLORS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-demeanor)",
  "var(--color-meds)",
];

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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/" className="text-sm underline" style={{ color: "var(--color-muted)" }}>
          All households
        </Link>
        <h1 className="font-heading mt-1 text-3xl font-semibold">
          {household.name}
        </h1>
      </div>

      <section className="card p-5">
        <h2 className="font-heading mb-4 text-lg font-semibold" style={{ color: "var(--color-primary-dark)" }}>
          Pets
        </h2>
        {pets && pets.length > 0 ? (
          <ul className="flex flex-wrap gap-6">
            {pets.map((pet, i) => (
              <li key={pet.id}>
                <Link
                  href={`/pets/${pet.id}`}
                  className="flex w-28 flex-col items-center gap-2 text-center transition-transform hover:-translate-y-0.5"
                >
                  {pet.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pet.photo_url}
                      alt=""
                      className="h-28 w-28 rounded-full object-cover ring-4 ring-offset-2"
                      style={{ ["--tw-ring-color" as string]: RING_COLORS[i % RING_COLORS.length] }}
                    />
                  ) : (
                    <div
                      className="flex h-28 w-28 items-center justify-center rounded-full text-2xl font-semibold text-white ring-4 ring-offset-2"
                      style={{
                        background: RING_COLORS[i % RING_COLORS.length],
                        ["--tw-ring-color" as string]: RING_COLORS[i % RING_COLORS.length],
                      }}
                    >
                      {pet.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium">{pet.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            No pets yet.
          </p>
        )}
        <Link
          href={`/households/${id}/pets/new`}
          className="btn-outline mt-4 inline-block px-4 py-2 text-sm"
        >
          + Add a pet
        </Link>
      </section>

      <section className="card p-5">
        <h2 className="font-heading mb-4 text-lg font-semibold" style={{ color: "var(--color-primary-dark)" }}>
          Members
        </h2>
        <ul className="flex flex-col gap-2">
          {members?.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: "var(--color-primary-light)" }}
            >
              <span className="font-medium">{m.display_name ?? "Member"}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
                style={{ background: "var(--color-primary)" }}
              >
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="card flex flex-col gap-3 p-5"
        style={{ background: "var(--color-accent-light)", borderColor: "var(--color-accent)" }}
      >
        <h2 className="font-heading text-lg font-semibold" style={{ color: "var(--color-accent)" }}>
          Invite someone
        </h2>
        <InviteButton householdId={id} />
      </section>
    </div>
  );
}
