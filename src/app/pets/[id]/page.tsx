import { redirect } from "next/navigation";

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/pets/${id}/logging`);
}
