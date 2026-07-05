import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header
      className="flex items-center justify-between px-6 py-3 text-white"
      style={{ background: "var(--color-primary)" }}
    >
      <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
        🐾 Pet Health
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-sm text-white/90 hover:text-white">
          Settings
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-white/90 hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
