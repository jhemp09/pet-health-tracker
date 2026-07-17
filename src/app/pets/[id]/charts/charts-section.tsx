"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RELATIVE_5_LABELS, SYMPTOM_CATALOG } from "@/lib/symptoms";

type FeedingLog = {
  fed_at: string;
  percent_eaten: number;
  schedule_id: string | null;
  notes: string | null;
};
type WeightLog = {
  logged_at: string;
  weight: number;
  unit: string;
  notes: string | null;
};
type SymptomObservation = {
  observed_date: string;
  value_numeric: number | null;
  notes: string | null;
};
type FeedingDayPoint = {
  date: string;
  percent: number;
  meals: { label: string; percent: number; notes: string | null }[];
};
type DemeanorChart =
  | {
      key: string;
      label: string;
      type: "count";
      data: { date: string; count: number; notes: string | null }[];
    }
  | {
      key: string;
      label: string;
      type: "relative_5";
      data: { date: string; value: number; notes: string | null }[];
    };

const RELATIVE_5_SHORT: Record<number, string> = {
  1: "Much less",
  2: "Less",
  3: "Normal",
  4: "More",
  5: "Much more",
};

// Recharts sizes its tooltip wrapper to the content's natural width, which
// can push it past the right edge of the screen on mobile since the chart
// spans nearly the full viewport. Capping width + wrapping text keeps it
// on-screen regardless of where on the chart it's triggered.
const TOOLTIP_WRAPPER_STYLE = { maxWidth: "70vw", zIndex: 20 };

function relativeLabel(value: number) {
  return RELATIVE_5_LABELS.find((l) => l.value === value)?.label ?? String(value);
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

// Fills every day from the first logged entry through today (or the last
// entry, if later) with 0, so gaps between incidents read as "none that
// day" instead of skipping straight from one incident to the next.
function fillCountByDay(observations: SymptomObservation[]) {
  const byDay = new Map<string, { count: number; notes: string | null }>();
  for (const o of observations) {
    if (o.value_numeric == null) continue;
    const existing = byDay.get(o.observed_date);
    byDay.set(o.observed_date, {
      count: (existing?.count ?? 0) + o.value_numeric,
      notes: o.notes ?? existing?.notes ?? null,
    });
  }
  if (byDay.size === 0) return [];

  const loggedDates = Array.from(byDay.keys()).sort();
  const todayStr = new Date().toISOString().slice(0, 10);
  const startStr = loggedDates[0];
  const endStr =
    loggedDates[loggedDates.length - 1] > todayStr
      ? loggedDates[loggedDates.length - 1]
      : todayStr;

  const result: { date: string; count: number; notes: string | null }[] = [];
  const cursor = new Date(`${startStr}T00:00:00.000Z`);
  const end = new Date(`${endStr}T00:00:00.000Z`);
  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const entry = byDay.get(dateStr);
    result.push({ date: dateStr, count: entry?.count ?? 0, notes: entry?.notes ?? null });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function relativeDataFor(observations: SymptomObservation[]) {
  return observations
    .filter((o) => o.value_numeric != null)
    .map((o) => ({
      date: o.observed_date,
      value: o.value_numeric as number,
      notes: o.notes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function FoodTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FeedingDayPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="max-w-[70vw] break-words rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="mb-1 font-medium">
        {data.date} — {data.percent}% avg
      </p>
      <ul className="flex flex-col gap-0.5 text-gray-600">
        {data.meals.map((m, i) => (
          <li key={i}>
            {m.label}: {m.percent}%{m.notes ? ` — ${m.notes}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeightTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { date: string; weight: number; unit: string; notes: string | null } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="max-w-[70vw] break-words rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="font-medium">
        {data.date} — {data.weight} {data.unit}
      </p>
      {data.notes && <p className="text-gray-600">{data.notes}</p>}
    </div>
  );
}

function CountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { date: string; count: number; notes: string | null } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="max-w-[70vw] break-words rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="font-medium">
        {data.date} — {data.count}
      </p>
      {data.notes && <p className="text-gray-600">{data.notes}</p>}
    </div>
  );
}

function RelativeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { date: string; value: number; notes: string | null } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="max-w-[70vw] break-words rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="font-medium">{data.date}</p>
      <p className="text-gray-600">{relativeLabel(data.value)}</p>
      {data.notes && <p className="text-gray-600">{data.notes}</p>}
    </div>
  );
}

export function ChartsSection({
  feedingLogs,
  mealLabels,
  weightLogs,
  activeSymptomKeys,
  observationsBySymptom,
}: {
  feedingLogs: FeedingLog[];
  mealLabels: Record<string, string>;
  weightLogs: WeightLog[];
  activeSymptomKeys: string[];
  observationsBySymptom: Record<string, SymptomObservation[]>;
}) {
  const feedingData = useMemo(() => {
    const byDay = new Map<
      string,
      {
        total: number;
        count: number;
        meals: { label: string; percent: number; notes: string | null }[];
      }
    >();
    for (const log of [...feedingLogs].sort((a, b) => a.fed_at.localeCompare(b.fed_at))) {
      const date = dayKey(log.fed_at);
      const entry = byDay.get(date) ?? { total: 0, count: 0, meals: [] };
      entry.total += log.percent_eaten;
      entry.count += 1;
      entry.meals.push({
        label: (log.schedule_id && mealLabels[log.schedule_id]) || "Extra feeding",
        percent: log.percent_eaten,
        notes: log.notes,
      });
      byDay.set(date, entry);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count, meals }]) => ({
        date,
        percent: Math.round(total / count),
        meals,
      }));
  }, [feedingLogs, mealLabels]);

  const weightData = useMemo(
    () =>
      [...weightLogs]
        .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
        .map((l) => ({
          date: dayKey(l.logged_at),
          weight: l.weight,
          unit: l.unit,
          notes: l.notes,
        })),
    [weightLogs]
  );

  const demeanorCharts = useMemo(() => {
    const activeKeySet = new Set(activeSymptomKeys);
    return SYMPTOM_CATALOG.filter((def) => activeKeySet.has(def.key)).flatMap(
      (def): DemeanorChart[] => {
        const observations = observationsBySymptom[def.key] ?? [];
        if (def.scale.type === "count") {
          return [
            {
              key: def.key,
              label: def.label,
              type: "count",
              data: fillCountByDay(observations),
            },
          ];
        }
        return [
          {
            key: def.key,
            label: def.label,
            type: "relative_5",
            data: relativeDataFor(observations),
          },
        ];
      }
    );
  }, [activeSymptomKeys, observationsBySymptom]);

  return (
    <section className="flex flex-col gap-8">
      <h2 className="font-medium">Trends</h2>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          % of food eaten
        </h3>
        {feedingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={feedingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                content={<FoodTooltip />}
                wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                allowEscapeViewBox={{ x: false, y: false }}
              />
              <Line
                type="monotone"
                dataKey="percent"
                stroke="#000"
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">Not enough data yet.</p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Weight ({weightData.at(-1)?.unit ?? "lb"})
        </h3>
        {weightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                content={<WeightTooltip />}
                wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                allowEscapeViewBox={{ x: false, y: false }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2563eb"
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">Not enough data yet.</p>
        )}
      </div>

      {demeanorCharts.map((chart) => (
        <div key={chart.key}>
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            {chart.type === "count" ? `${chart.label} incidents per day` : chart.label}
          </h3>
          {chart.data.length > 0 ? (
            chart.type === "count" ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={<CountTooltip />}
                    wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                    allowEscapeViewBox={{ x: false, y: false }}
                  />
                  <Bar dataKey="count" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(v) => RELATIVE_5_SHORT[v] ?? String(v)}
                    tick={{ fontSize: 9 }}
                    width={70}
                  />
                  <Tooltip
                    content={<RelativeTooltip />}
                    wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                    allowEscapeViewBox={{ x: false, y: false }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          ) : (
            <p className="text-sm text-gray-500">Not enough data yet.</p>
          )}
        </div>
      ))}
    </section>
  );
}
