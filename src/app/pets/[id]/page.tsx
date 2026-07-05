import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedingSection } from "./feeding/feeding-section";
import { MedicationsSection } from "./medications/medications-section";
import { WeightSection } from "./health/weight-section";
import { DemeanorSection } from "./health/demeanor-section";
import { BloodworkSection } from "./bloodwork/bloodwork-section";
import { ChartsSection } from "./charts/charts-section";
import { NotificationsSection } from "./notifications/notifications-section";

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species, breed, birth_date, household_id")
    .eq("id", id)
    .maybeSingle();

  if (!pet || !user) {
    notFound();
  }

  const [
    { data: feedingSchedules },
    { data: feedingLogs },
    { data: medications },
    { data: medicationLogs },
    { data: weightLogs },
    { data: demeanorLogs },
    { data: bloodworkFiles },
    { data: notificationPreferences },
  ] = await Promise.all([
    supabase
      .from("feeding_schedules")
      .select("id, label, scheduled_time")
      .eq("pet_id", id)
      .eq("active", true)
      .order("scheduled_time", { ascending: true }),
    supabase
      .from("feeding_logs")
      .select("id, fed_at, percent_eaten, notes, schedule_id")
      .eq("pet_id", id)
      .order("fed_at", { ascending: false })
      .limit(30),
    supabase
      .from("medications")
      .select("id, name, dosage, schedule_times")
      .eq("pet_id", id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("medication_logs")
      .select("id, medication_id, given, given_at")
      .eq("pet_id", id)
      .order("given_at", { ascending: false })
      .limit(30),
    supabase
      .from("weight_logs")
      .select("id, weight, unit, logged_at, notes")
      .eq("pet_id", id)
      .order("logged_at", { ascending: false })
      .limit(60),
    supabase
      .from("demeanor_logs")
      .select("id, logged_at, energy_level, vomiting, vomiting_count, distancing, notes")
      .eq("pet_id", id)
      .order("logged_at", { ascending: false })
      .limit(60),
    supabase
      .from("bloodwork_files")
      .select("id, file_name, file_type, storage_path, taken_at, notes")
      .eq("pet_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notification_preferences")
      .select(
        "feeding_enabled, medication_enabled, weight_enabled, demeanor_enabled"
      )
      .eq("pet_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-6 py-10">
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

      <ChartsSection
        feedingLogs={feedingLogs ?? []}
        weightLogs={weightLogs ?? []}
        demeanorLogs={demeanorLogs ?? []}
      />

      <FeedingSection
        petId={id}
        schedules={feedingSchedules ?? []}
        logs={feedingLogs ?? []}
      />

      <MedicationsSection
        petId={id}
        medications={medications ?? []}
        logs={medicationLogs ?? []}
      />

      <WeightSection petId={id} logs={weightLogs ?? []} />

      <DemeanorSection petId={id} logs={demeanorLogs ?? []} />

      <BloodworkSection petId={id} files={bloodworkFiles ?? []} />

      <NotificationsSection
        petId={id}
        preferences={notificationPreferences ?? null}
      />
    </div>
  );
}
