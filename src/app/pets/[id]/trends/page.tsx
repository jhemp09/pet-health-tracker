import { createClient } from "@/lib/supabase/server";
import { formatAge, localDateStr } from "@/lib/dates";
import { PetProfileCard } from "../logging/pet-profile-card";
import { ChartsSection } from "../charts/charts-section";
import { ChangeLogTimeline } from "./change-log-timeline";
import { TrendsTabs } from "./trends-tabs";
import {
  BloodworkCharts,
  type BloodworkChart,
  type OtherBloodworkTest,
} from "./bloodwork-charts";
import { SynopsisSection } from "./synopsis-section";

// The synopsis generation calls out to Claude with a fair amount of
// gathered data, which can take longer than the platform's default
// serverless timeout.
export const maxDuration = 60;

// Different bloodwork reports format the same test name inconsistently
// ("BUN:Creatinine Ratio" vs "BUN: Creatinine Ratio", "Bilirubin (Urine)" vs
// "Urine Bilirubin"), which would otherwise split one test's history into
// separate rows. Stripping punctuation and sorting words makes the grouping
// key insensitive to spacing and word order.
function labTestKey(name: string) {
  const key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
  // The unqualified "Other" catch-all field in these reports is actually
  // part of the urinalysis panel, same as "Other (Urine)" — merge them.
  if (key === "other") return "other urine";
  return key;
}

// Most urine-panel tests get labeled "X (Urine)" by the extraction, which
// labTestKey turns into a key containing the word "urine". A handful of
// standard urinalysis parameters (dipstick/sediment readings) don't carry
// any "urine" wording of their own, so they're listed explicitly here.
const URINE_ONLY_NAMES = [
  "Blood / Hemoglobin",
  "Color",
  "Clarity",
  "Specific Gravity",
  "pH",
  "Ketones",
  "Bacteria",
  "Casts",
  "Crystals",
  "Epithelial Cells",
  "Mucus",
  "Urobilinogen",
  "Collection",
  "Collection Method",
];
const URINE_ONLY_KEYS = new Set(URINE_ONLY_NAMES.map(labTestKey));

function sampleTypeFor(key: string): "blood" | "urine" {
  if (key.split(" ").includes("urine") || URINE_ONLY_KEYS.has(key)) return "urine";
  return "blood";
}

export default async function TrendsPage({
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
  const sevenDaysAgoDateStr = localDateStr(timezone, sevenDaysAgo);

  const [
    { data: feedingLogs },
    { data: feedingSchedules },
    { data: weightLogs },
    { data: changeLogEntries },
    { data: medicationLogs },
    { data: activeSymptoms },
  ] = await Promise.all([
    supabase
      .from("feeding_logs")
      .select("id, fed_at, percent_eaten, notes, schedule_id")
      .eq("pet_id", petId)
      .order("fed_at", { ascending: false })
      .limit(200),
    supabase.from("feeding_schedules").select("id, label").eq("pet_id", petId),
    supabase
      .from("weight_logs")
      .select("id, weight, unit, logged_at, notes")
      .eq("pet_id", petId)
      .order("logged_at", { ascending: false })
      .limit(60),
    supabase
      .from("change_log_entries")
      .select("id, event_date, category, description")
      .eq("pet_id", petId)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("medication_logs")
      .select("given, observed_date")
      .eq("pet_id", petId)
      .gte("observed_date", sevenDaysAgoDateStr),
    supabase
      .from("pet_demeanor_symptoms")
      .select("symptom_key")
      .eq("pet_id", petId)
      .eq("active", true),
  ]);

  const activeSymptomKeys = (activeSymptoms ?? []).map((s) => s.symptom_key);
  const { data: demeanorObservations } =
    activeSymptomKeys.length > 0
      ? await supabase
          .from("demeanor_observations")
          .select("symptom_key, observed_date, value_numeric, notes")
          .eq("pet_id", petId)
          .in("symptom_key", activeSymptomKeys)
      : {
          data: [] as {
            symptom_key: string;
            observed_date: string;
            value_numeric: number | null;
            notes: string | null;
          }[],
        };

  const observationsBySymptom: Record<
    string,
    { observed_date: string; value_numeric: number | null; notes: string | null }[]
  > = {};
  for (const o of demeanorObservations ?? []) {
    const list = observationsBySymptom[o.symptom_key] ?? [];
    list.push({ observed_date: o.observed_date, value_numeric: o.value_numeric, notes: o.notes });
    observationsBySymptom[o.symptom_key] = list;
  }

  const { data: bloodworkFiles } = await supabase
    .from("bloodwork_files")
    .select("id, taken_at, created_at")
    .eq("pet_id", petId);

  const fileDateById = new Map(
    (bloodworkFiles ?? []).map((f) => [f.id, f.taken_at ?? f.created_at.slice(0, 10)])
  );
  const bloodworkFileIds = (bloodworkFiles ?? []).map((f) => f.id);

  const { data: bloodworkResults } =
    bloodworkFileIds.length > 0
      ? await supabase
          .from("bloodwork_results")
          .select("bloodwork_file_id, test_name, value, unit, reference_range, flag")
          .in("bloodwork_file_id", bloodworkFileIds)
      : {
          data: [] as {
            bloodwork_file_id: string;
            test_name: string;
            value: string;
            unit: string | null;
            reference_range: string | null;
            flag: string | null;
          }[],
        };

  type LabPoint = {
    date: string;
    rawValue: string;
    numericValue: number | null;
    unit: string | null;
    referenceRange: string | null;
    flag: string | null;
  };
  const labGroups = new Map<
    string,
    { displayName: string; unit: string | null; points: LabPoint[] }
  >();
  for (const r of bloodworkResults ?? []) {
    const date = fileDateById.get(r.bloodwork_file_id);
    if (!date) continue;
    const testName = r.test_name.trim();
    const key = labTestKey(testName);
    const numMatch = r.value.match(/-?\d+(\.\d+)?/);
    const group = labGroups.get(key) ?? {
      displayName: testName,
      unit: r.unit,
      points: [],
    };
    // Prefer whichever formatting includes a parenthetical qualifier (e.g.
    // "Bilirubin (Urine)" over "Urine Bilirubin") since that's the
    // convention most of these reports use.
    if (!group.displayName.includes("(") && testName.includes("(")) {
      group.displayName = testName;
    }
    group.unit = group.unit ?? r.unit;
    group.points.push({
      date,
      rawValue: r.value,
      numericValue: numMatch ? Number(numMatch[0]) : null,
      unit: r.unit,
      referenceRange: r.reference_range,
      flag: r.flag,
    });
    labGroups.set(key, group);
  }
  for (const group of labGroups.values()) {
    group.points.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Charting every distinct lab test would be overwhelming, so only trend
  // tests that have (a) enough numeric data points to show a real trend and
  // (b) been flagged abnormal at least once — the rest still surface as a
  // compact "latest value" list so nothing's hidden.
  const bloodworkCharts: BloodworkChart[] = [];
  const otherBloodworkResults: OtherBloodworkTest[] = [];
  for (const [key, group] of labGroups.entries()) {
    const numericPoints = group.points.filter((p) => p.numericValue != null);
    const hasAbnormal = group.points.some((p) => p.flag && p.flag !== "normal");
    const latestWithRange = [...group.points].reverse().find((p) => p.referenceRange);
    const sampleType = sampleTypeFor(key);
    if (numericPoints.length >= 2 && hasAbnormal) {
      bloodworkCharts.push({
        testName: group.displayName,
        unit: group.unit,
        referenceRange: latestWithRange?.referenceRange ?? null,
        sampleType,
        data: numericPoints.map((p) => ({
          date: p.date,
          value: p.numericValue as number,
          flag: p.flag,
        })),
      });
    } else {
      otherBloodworkResults.push({
        testName: group.displayName,
        unit: group.unit,
        referenceRange: latestWithRange?.referenceRange ?? null,
        sampleType,
        points: group.points.map((p) => ({
          date: p.date,
          value: p.rawValue,
          flag: p.flag,
        })),
      });
    }
  }
  bloodworkCharts.sort((a, b) => a.testName.localeCompare(b.testName));
  otherBloodworkResults.sort((a, b) => a.testName.localeCompare(b.testName));

  const { data: synopsisRow } = await supabase
    .from("pet_synopses")
    .select("current_state, recent_changes, trend, prognosis, suggestions, generated_at")
    .eq("pet_id", petId)
    .maybeSingle();
  const synopsis = synopsisRow
    ? {
        currentState: synopsisRow.current_state,
        recentChanges: synopsisRow.recent_changes,
        trend: synopsisRow.trend,
        prognosis: synopsisRow.prognosis,
        suggestions: synopsisRow.suggestions,
        generatedAt: synopsisRow.generated_at,
      }
    : null;

  const mealLabels = Object.fromEntries(
    (feedingSchedules ?? []).map((s) => [s.id, s.label])
  );

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
    (demeanorObservations ?? [])
      .filter((o) => o.observed_date >= sevenDaysAgoDateStr)
      .map((o) => o.observed_date)
  ).size;

  return (
    <div className="flex flex-col gap-6">
      <PetProfileCard
        petId={petId}
        name={pet?.name ?? ""}
        species={pet?.species ?? "dog"}
        breed={pet?.breed ?? null}
        birthDate={pet?.birth_date ?? null}
        age={pet?.birth_date ? formatAge(pet.birth_date, now) : null}
        stats={{ latestWeight, foodIntake, medAdherence, demeanorDaysLogged }}
      />

      <TrendsTabs
        behavioral={
          <ChartsSection
            feedingLogs={feedingLogs ?? []}
            mealLabels={mealLabels}
            weightLogs={weightLogs ?? []}
            activeSymptomKeys={activeSymptomKeys}
            observationsBySymptom={observationsBySymptom}
          />
        }
        medical={
          <BloodworkCharts charts={bloodworkCharts} otherResults={otherBloodworkResults} />
        }
        synopsis={<SynopsisSection petId={petId} synopsis={synopsis} />}
      />
      <ChangeLogTimeline petId={petId} entries={changeLogEntries ?? []} />
    </div>
  );
}
