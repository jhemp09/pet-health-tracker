import { createHousehold, joinHousehold } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-10 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a household to start tracking a pet, or join one you&apos;ve
          been invited to.
        </p>
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3 rounded border border-gray-200 p-4">
        <h2 className="font-medium">Create a household</h2>
        <form action={createHousehold} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="e.g. The Hempsteads"
            required
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="display_name"
            placeholder="Your name (optional)"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            Create household
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded border border-gray-200 p-4">
        <h2 className="font-medium">Join with an invite code</h2>
        <form action={joinHousehold} className="flex flex-col gap-3">
          <input
            type="text"
            name="code"
            placeholder="Invite code"
            required
            className="rounded border border-gray-300 px-3 py-2 text-sm uppercase"
          />
          <input
            type="text"
            name="display_name"
            placeholder="Your name (optional)"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-black px-3 py-2 text-sm text-white"
          >
            Join household
          </button>
        </form>
      </section>
    </div>
  );
}
