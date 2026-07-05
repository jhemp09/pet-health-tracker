import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { PushSubscribeButton } from "./push-subscribe-button";

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-16">
      <Link href="/" className="text-sm text-gray-500 underline">
        Back
      </Link>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Push notifications</h2>
        <p className="text-sm text-gray-600">
          Enable push on this device, then go to each pet&apos;s page to
          choose which reminders you want.
        </p>
        <PushSubscribeButton />
      </section>
    </div>
  );
}
