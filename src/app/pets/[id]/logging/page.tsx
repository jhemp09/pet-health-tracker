import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatAge, localDateStr } from "@/lib/dates";
import { PetProfileCard } from "./pet-profile-card";

const ITEMS = [
  {
    slug: "food",
    label: "Food",
    color: "var(--color-food)",
    bg: "var(--color-food-light)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path
          d="M6 3v7a3 3 0 0 0 3 3v8M6 3v6M9 3v6M6 9h3M15 3c-1.5 2-2 4-2 6a2 2 0 0 0 4 0V3M15 12v9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    slug: "medications",
    label: "Medications",
    color: "var(--color-meds)",
    bg: "var(--color-meds-light)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect
          x="4"
          y="8"
          width="16"
          height="10"
          rx="5"
          transform="rotate(-45 12 13)"
        />
        <path d="M9 16l6-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "demeanor",
    label: "Demeanor",
    color: "var(--color-demeanor)",
    bg: "var(--color-demeanor-light)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="13" r="7" />
        <path d="M9 12v.01M15 12v.01M9.5 16c.8.7 1.7 1 2.5 1s1.7-.3 2.5-1" strokeLinecap="round" />
        <path d="M8 6.5C7 5 6 4.5 5 5M16 6.5c1-1.5 2-2 3-1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    slug: "weight",
    label: "Weight",
    color: "var(--color-weight)",
    bg: "var(--color-weight-light)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="13" r="8" />
        <path d="M9 13a3 3 0 0 1 6 0" strokeLinecap="round" />
        <path d="M12 5v1.5M12 3.5h0" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function LoggingHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: petId } = await params;
  const supabase = await createClient();

  const { data: pet } = await supabase
    .from("pets")
    .select("name, species, breed, birth_date, households(timezone)")
    .eq("id", petId)
    .maybeSingle();

  const timezone =
    (pet?.households as unknown as { timezone: string } | null)?.timezone ??
    "UTC";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoDateStr = localDateStr(timezone, sevenDaysAgo);

  const [
    { data: weightLogs },
    { data: feedingLogs },
    { data: medicationLogs },
    { data: demeanorObservations },
  ] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight, unit, logged_at")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: false })
      .limit(2),
    supabase
      .from("feeding_logs")
      .select("percent_eaten, fed_at")
      .eq("pet_id", petId)
      .gte("fed_at", fourteenDaysAgo.toISOString()),
    supabase
      .from("medication_logs")
      .select("given, observed_date")
      .eq("pet_id", petId)
      .gte("observed_date", sevenDaysAgoDateStr),
    supabase
      .from("demeanor_observations")
      .select("observed_date")
      .eq("pet_id", petId)
      .gte("observed_date", sevenDaysAgoDateStr),
  ]);

  const latestWeight = weightLogs?.[0]
    ? {
        value: weightLogs[0].weight,
        unit: weightLogs[0].unit,
        changeText: (() => {
          const previous = weightLogs[1];
          if (!previous || previous.unit !== weightLogs[0].unit) return "";
          const diff =
            Math.round((weightLogs[0].weight - previous.weight) * 10) / 10;
          if (diff === 0) return "no change";
          return diff > 0 ? `up ${diff}` : `down ${Math.abs(diff)}`;
        })(),
      }
    : null;

  const sevenAgoMs = sevenDaysAgo.getTime();
  const recentFeeding = (feedingLogs ?? []).filter(
    (l) => new Date(l.fed_at).getTime() >= sevenAgoMs
  );
  const priorFeeding = (feedingLogs ?? []).filter(
    (l) => new Date(l.fed_at).getTime() < sevenAgoMs
  );
  const average = (entries: { percent_eaten: number }[]) =>
    entries.length
      ? Math.round(
          entries.reduce((sum, l) => sum + l.percent_eaten, 0) /
            entries.length
        )
      : null;
  const recentAvg = average(recentFeeding);
  const priorAvg = average(priorFeeding);
  const foodIntake =
    recentAvg === null
      ? null
      : {
          avg: recentAvg,
          trendText:
            priorAvg === null
              ? ""
              : Math.abs(recentAvg - priorAvg) < 3
                ? "steady"
                : recentAvg > priorAvg
                  ? `up from ${priorAvg}%`
                  : `down from ${priorAvg}%`,
        };

  const medTotal = medicationLogs?.length ?? 0;
  const medAdherence =
    medTotal > 0
      ? {
          pct: Math.round(
            (medicationLogs!.filter((l) => l.given).length / medTotal) * 100
          ),
        }
      : null;

  const demeanorDaysLogged = new Set(
    (demeanorObservations ?? []).map((o) => o.observed_date)
  ).size;

  return (
    <div className="flex flex-col gap-4">
      <PetProfileCard
        petId={petId}
        name={pet?.name ?? ""}
        species={pet?.species ?? "dog"}
        breed={pet?.breed ?? null}
        birthDate={pet?.birth_date ?? null}
        age={pet?.birth_date ? formatAge(pet.birth_date, now) : null}
        stats={{ latestWeight, foodIntake, medAdherence, demeanorDaysLogged }}
      />

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.slug}
            href={`/pets/${petId}/logging/${item.slug}`}
            className="card flex flex-col items-center gap-2 p-4 transition-transform hover:-translate-y-0.5"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: item.bg, color: item.color }}
            >
              <span className="h-6 w-6">{item.icon}</span>
            </span>
            <span className="font-heading font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
