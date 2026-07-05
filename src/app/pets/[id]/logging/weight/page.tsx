import { createClient, requireUser } from "@/lib/supabase/server";
import { ReminderToggle } from "../../notifications/reminder-toggle";
import { logWeight } from "./actions";
import { WeightEntryRow } from "./weight-entry-row";

export default async function WeightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: petId } = await params;
  const supabase = await createClient();

  const [{ data: weightLogs }, { data: preference }] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("id, weight, unit, logged_at, notes")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: false })
      .limit(100),
    supabase
      .from("notification_preferences")
      .select("weight_enabled")
      .eq("pet_id", petId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-medium">Weight</h2>

      <form
        action={logWeight.bind(null, petId)}
        className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-3"
      >
        <label className="flex flex-col gap-1 text-xs">
          Weight
          <input
            type="number"
            name="weight"
            step={0.1}
            min={0}
            required
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Unit
          <select
            name="unit"
            defaultValue="lb"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Notes
          <input
            type="text"
            name="notes"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          Log weight
        </button>
      </form>

      {weightLogs && weightLogs.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {weightLogs.map((log) => (
            <WeightEntryRow key={log.id} petId={petId} log={log} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No weight logged yet.</p>
      )}

      <ReminderToggle
        petId={petId}
        field="weight_enabled"
        label="Remind me for weekly weigh-ins"
        initialEnabled={preference?.weight_enabled ?? false}
      />
    </div>
  );
}
