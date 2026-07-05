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

type FeedingLog = {
  fed_at: string;
  percent_eaten: number;
  schedule_id: string | null;
};
type WeightLog = { logged_at: string; weight: number; unit: string };
type VomitingObservation = { observed_date: string; value_numeric: number | null };
type FeedingDayPoint = {
  date: string;
  percent: number;
  meals: { label: string; percent: number }[];
};

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
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
    <div className="rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="mb-1 font-medium">
        {data.date} — {data.percent}% avg
      </p>
      <ul className="flex flex-col gap-0.5 text-gray-600">
        {data.meals.map((m, i) => (
          <li key={i}>
            {m.label}: {m.percent}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartsSection({
  feedingLogs,
  mealLabels,
  weightLogs,
  vomitingObservations,
}: {
  feedingLogs: FeedingLog[];
  mealLabels: Record<string, string>;
  weightLogs: WeightLog[];
  vomitingObservations: VomitingObservation[];
}) {
  const feedingData = useMemo(() => {
    const byDay = new Map<
      string,
      { total: number; count: number; meals: { label: string; percent: number }[] }
    >();
    for (const log of [...feedingLogs].sort((a, b) => a.fed_at.localeCompare(b.fed_at))) {
      const date = dayKey(log.fed_at);
      const entry = byDay.get(date) ?? { total: 0, count: 0, meals: [] };
      entry.total += log.percent_eaten;
      entry.count += 1;
      entry.meals.push({
        label: (log.schedule_id && mealLabels[log.schedule_id]) || "Extra feeding",
        percent: log.percent_eaten,
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
        })),
    [weightLogs]
  );

  const vomitingData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const o of vomitingObservations) {
      if (!o.value_numeric) continue;
      byDay.set(
        o.observed_date,
        (byDay.get(o.observed_date) ?? 0) + o.value_numeric
      );
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [vomitingObservations]);

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
              <Tooltip content={<FoodTooltip />} />
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
              <Tooltip />
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

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Vomiting incidents per day
        </h3>
        {vomitingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vomitingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">
            No vomiting incidents logged.
          </p>
        )}
      </div>
    </section>
  );
}
