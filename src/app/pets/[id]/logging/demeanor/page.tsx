import { createClient, requireUser } from "@/lib/supabase/server";
import { localDateStr } from "@/lib/dates";
import { getSymptomDef } from "@/lib/symptoms";
import { ReminderToggle } from "../../notifications/reminder-toggle";
import { DateNav } from "../../date-nav";
import { SymptomRow } from "./symptom-row";
import { SymptomSelector } from "./symptom-selector";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DemeanorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const { id: petId } = await params;
  const { date } = await searchParams;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("household_id, households(timezone)")
    .eq("id", petId)
    .maybeSingle();
  const timezone =
    (pet?.households as unknown as { timezone: string } | null)?.timezone ??
    "UTC";

  const todayDate = localDateStr(timezone, new Date());
  const selectedDate =
    date && DATE_RE.test(date) && date <= todayDate ? date : todayDate;

  const [{ data: activeSymptoms }, { data: observations }, { data: preference }] =
    await Promise.all([
      supabase
        .from("pet_demeanor_symptoms")
        .select("id, symptom_key")
        .eq("pet_id", petId)
        .eq("active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("demeanor_observations")
        .select("id, symptom_key, value_numeric, value_text, notes")
        .eq("pet_id", petId)
        .eq("observed_date", selectedDate),
      supabase
        .from("notification_preferences")
        .select("demeanor_enabled")
        .eq("pet_id", petId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const observationByKey = new Map(
    (observations ?? []).map((o) => [o.symptom_key, o])
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">
          {selectedDate === todayDate ? "Today's demeanor" : "Demeanor"}
        </h2>
        <DateNav
          basePath={`/pets/${petId}/logging/demeanor`}
          selectedDate={selectedDate}
          todayDate={todayDate}
        />
      </div>

      {activeSymptoms && activeSymptoms.length > 0 ? (
        <div className="flex flex-col gap-2">
          {activeSymptoms.map((s) => {
            const def = getSymptomDef(s.symptom_key);
            if (!def) return null;
            return (
              <SymptomRow
                key={s.id}
                petId={petId}
                dateStr={selectedDate}
                def={def}
                observation={observationByKey.get(s.symptom_key) ?? null}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No symptoms being tracked yet — add one below.
        </p>
      )}

      <SymptomSelector petId={petId} active={activeSymptoms ?? []} />

      <ReminderToggle
        petId={petId}
        field="demeanor_enabled"
        label="Remind me for daily demeanor check-ins"
        initialEnabled={preference?.demeanor_enabled ?? false}
      />
    </div>
  );
}
