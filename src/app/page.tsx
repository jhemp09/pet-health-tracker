import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, households(name)")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding");
  }

  if (memberships.length === 1) {
    redirect(`/households/${memberships[0].household_id}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Your households</h1>
      <ul className="flex flex-col gap-2">
        {memberships.map((m) => (
          <li key={m.household_id}>
            <Link
              href={`/households/${m.household_id}`}
              className="block rounded border border-gray-200 px-4 py-3 hover:bg-gray-50"
            >
              {(m.households as unknown as { name: string } | null)?.name ??
                "Household"}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/onboarding" className="text-sm underline">
        Create or join another household
      </Link>
    </div>
  );
}
