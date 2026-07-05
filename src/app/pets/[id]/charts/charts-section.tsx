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

type FeedingLog = { fed_at: string; percent_eaten: number };
type WeightLog = { logged_at: string; weight: number; unit: string };
type DemeanorLog = {
  logged_at: string;
  vomiting: boolean;
  vomiting_count: number;
};

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export function ChartsSection({
  feedingLogs,
  weightLogs,
  demeanorLogs,
}: {
  feedingLogs: FeedingLog[];
  weightLogs: WeightLog[];
  demeanorLogs: DemeanorLog[];
}) {
  const feedingData = useMemo(
    () =>
      [...feedingLogs]
        .sort((a, b) => a.fed_at.localeCompare(b.fed_at))
        .map((l) => ({
          date: dayKey(l.fed_at),
          percent: l.percent_eaten,
        })),
    [feedingLogs]
  );

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
    for (const l of demeanorLogs) {
      if (!l.vomiting) continue;
      const key = dayKey(l.logged_at);
      byDay.set(key, (byDay.get(key) ?? 0) + (l.vomiting_count || 1));
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [demeanorLogs]);

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
              <Tooltip />
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
