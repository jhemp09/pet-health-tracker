import Link from "next/link";
import { updateNotificationPreferences } from "./actions";

type Preferences = {
  feeding_enabled: boolean;
  medication_enabled: boolean;
  weight_enabled: boolean;
  demeanor_enabled: boolean;
} | null;

export function NotificationsSection({
  petId,
  preferences,
}: {
  petId: string;
  preferences: Preferences;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">Reminders for you</h2>
      <p className="text-sm text-gray-600">
        Turn on push notifications for this pet, and make sure you&apos;ve
        enabled push on this device under{" "}
        <Link href="/settings" className="underline">
          Settings
        </Link>
        .
      </p>
      <form
        action={(formData) => updateNotificationPreferences(petId, formData)}
        className="flex flex-col gap-2 text-sm"
      >
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="feeding_enabled"
            defaultChecked={preferences?.feeding_enabled ?? false}
          />
          Feeding reminders
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="medication_enabled"
            defaultChecked={preferences?.medication_enabled ?? false}
          />
          Medication reminders
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="weight_enabled"
            defaultChecked={preferences?.weight_enabled ?? false}
          />
          Weekly weigh-in reminder
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="demeanor_enabled"
            defaultChecked={preferences?.demeanor_enabled ?? false}
          />
          Daily demeanor check-in reminder
        </label>
        <button
          type="submit"
          className="mt-1 w-fit rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          Save
        </button>
      </form>
    </section>
  );
}
