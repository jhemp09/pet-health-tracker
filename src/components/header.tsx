import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
      <Link href="/" className="font-semibold">
        Pet Health
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className="text-sm text-gray-600 underline">
          Sign out
        </button>
      </form>
    </header>
  );
}
