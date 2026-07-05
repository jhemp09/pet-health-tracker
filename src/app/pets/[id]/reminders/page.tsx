import { createClient, requireUser } from "@/lib/supabase/server";
import { NotificationsSection } from "../notifications/notifications-section";

export default async function RemindersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: notificationPreferences } = await supabase
    .from("notification_preferences")
    .select(
      "feeding_enabled, medication_enabled, weight_enabled, demeanor_enabled"
    )
    .eq("pet_id", petId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <NotificationsSection
      petId={petId}
      preferences={notificationPreferences ?? null}
    />
  );
}
