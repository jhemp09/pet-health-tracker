import { requireUser } from "@/lib/supabase/server";
import { createPet } from "./actions";

export default async function NewPetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const createPetForHousehold = createPet.bind(null, id);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-semibold">Add a pet</h1>
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={createPetForHousehold} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            name="name"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Species
          <select
            name="species"
            defaultValue="dog"
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Breed (optional)
          <input
            type="text"
            name="breed"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Birth date (optional)
          <input
            type="date"
            name="birth_date"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-black px-3 py-2 text-white"
        >
          Add pet
        </button>
      </form>
    </div>
  );
}
