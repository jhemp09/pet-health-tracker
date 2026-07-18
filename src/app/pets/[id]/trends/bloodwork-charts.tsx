"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

export type SampleType = "blood" | "urine";
export type BloodworkChartPoint = { date: string; value: number; flag: string | null };
export type BloodworkChart = {
  testName: string;
  unit: string | null;
  referenceRange: string | null;
  sampleType: SampleType;
  data: BloodworkChartPoint[];
};
export type OtherBloodworkTest = {
  testName: string;
  unit: string | null;
  referenceRange: string | null;
  sampleType: SampleType;
  points: { date: string; value: string; flag: string | null }[];
};

// Reference ranges come out of the LLM extraction as free text, e.g.
// "10-20", "10.5 - 20.5 mg/dL", "<5", ">40". Pull out numeric bounds where
// possible so the chart can shade normal/low/high bands.
function parseReferenceRange(raw: string | null): { min: number | null; max: number | null } | null {
  if (!raw) return null;
  const rangeMatch = raw.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const ltMatch = raw.match(/^\s*[<≤]\s*(-?\d+(?:\.\d+)?)/);
  if (ltMatch) return { min: null, max: Number(ltMatch[1]) };
  const gtMatch = raw.match(/^\s*[>≥]\s*(-?\d+(?:\.\d+)?)/);
  if (gtMatch) return { min: Number(gtMatch[1]), max: null };
  return null;
}

function FlagDot(props: { cx?: number; cy?: number; payload?: BloodworkChartPoint }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const color =
    payload.flag === "low" ? "#d97706" : payload.flag === "high" || payload.flag === "abnormal" ? "#dc2626" : "#1f2937";
  return <circle cx={cx} cy={cy} r={3} fill={color} stroke="white" strokeWidth={1} />;
}

const FLAG_COLOR: Record<string, string> = {
  low: "#d97706",
  high: "#dc2626",
  abnormal: "#dc2626",
  normal: "#78716c",
};

// Same edge-bleeding fix as the behavioral charts: cap tooltip width and
// keep it from escaping the viewport on mobile.
const TOOLTIP_WRAPPER_STYLE = { maxWidth: "70vw", zIndex: 20 };

function LabTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: { payload: BloodworkChartPoint }[];
  unit: string | null;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="max-w-[70vw] break-words rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="font-medium">
        {data.date} — {data.value}
        {unit ? ` ${unit}` : ""}
      </p>
      {data.flag && data.flag !== "normal" && (
        <p style={{ color: FLAG_COLOR[data.flag] ?? "#78716c" }}>{data.flag}</p>
      )}
    </div>
  );
}

function OtherResultsTable({ tests }: { tests: OtherBloodworkTest[] }) {
  const allDates = Array.from(
    new Set(tests.flatMap((t) => t.points.map((p) => p.date)))
  ).sort();

  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-medium text-gray-700">Other tracked values</h3>
      {/* overflow-x-auto here (not on an ancestor) both creates the scroll
          container and, per the flex automatic-minimum-size rule, keeps this
          table from forcing the flex-column section around it wider than
          the viewport. */}
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full min-w-max border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 w-24 max-w-24 border-r border-gray-200 bg-gray-50 px-2 py-1.5 text-left font-medium text-gray-700">
                Test
              </th>
              {allDates.map((date) => (
                <th
                  key={date}
                  className="w-14 max-w-14 break-words px-2 py-1.5 text-right font-medium text-gray-700"
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => {
              const byDate = new Map(t.points.map((p) => [p.date, p]));
              return (
                <tr key={t.testName} className="border-b border-gray-100 last:border-0">
                  <td className="sticky left-0 z-10 w-24 max-w-24 break-words border-r border-gray-200 bg-white px-2 py-1.5 text-gray-700">
                    {t.testName}
                    {t.unit ? ` (${t.unit})` : ""}
                    {t.referenceRange && (
                      <span className="block text-[10px] text-gray-400">
                        ref: {t.referenceRange}
                      </span>
                    )}
                  </td>
                  {allDates.map((date) => {
                    const p = byDate.get(date);
                    const isAbnormal = p?.flag && p.flag !== "normal";
                    return (
                      <td
                        key={date}
                        className="w-14 max-w-14 break-words px-2 py-1.5 text-right"
                        style={
                          isAbnormal
                            ? { color: FLAG_COLOR[p!.flag as string], fontWeight: 600 }
                            : undefined
                        }
                      >
                        {p ? p.value : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartsForType({
  title,
  charts,
  hasOtherData,
}: {
  title: string;
  charts: BloodworkChart[];
  hasOtherData: boolean;
}) {
  if (charts.length === 0 && !hasOtherData) return null;

  return (
    <div className="flex flex-col gap-6 border-t border-gray-100 pt-6 first:border-0 first:pt-0">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      {charts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No {title.toLowerCase()} test has had an abnormal result across 2+ bloodwork uploads
          yet, so there&apos;s nothing to trend. Latest values are below.
        </p>
      ) : (
        charts.map((chart) => {
          const refRange = parseReferenceRange(chart.referenceRange);
          const values = chart.data.map((d) => d.value);
          const dataMin = Math.min(...values);
          const dataMax = Math.max(...values);
          const boundedMin = refRange?.min != null ? Math.min(dataMin, refRange.min) : dataMin;
          const boundedMax = refRange?.max != null ? Math.max(dataMax, refRange.max) : dataMax;
          const span = boundedMax - boundedMin || Math.abs(boundedMax) || 1;
          const padding = span * 0.15;
          const domainMin = boundedMin - padding;
          const domainMax = boundedMax + padding;

          return (
            <div key={chart.testName}>
              <h3 className="mb-1 text-sm font-medium text-gray-700">
                {chart.testName}
                {chart.unit ? ` (${chart.unit})` : ""}
              </h3>
              {refRange && (
                <p className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: "#16a34a" }} />
                    Normal
                    {refRange.min != null && refRange.max != null
                      ? ` (${refRange.min}–${refRange.max})`
                      : ""}
                  </span>
                  {refRange.min != null && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: "#d97706" }} />
                      Low
                    </span>
                  )}
                  {refRange.max != null && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: "#dc2626" }} />
                      High
                    </span>
                  )}
                </p>
              )}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[domainMin, domainMax]} tick={{ fontSize: 11 }} />
                  {refRange?.min != null && refRange?.max != null && (
                    <ReferenceArea
                      y1={refRange.min}
                      y2={refRange.max}
                      fill="#16a34a"
                      fillOpacity={0.12}
                      strokeOpacity={0}
                    />
                  )}
                  {refRange?.min != null && (
                    <ReferenceArea
                      y1={domainMin}
                      y2={refRange.min}
                      fill="#d97706"
                      fillOpacity={0.08}
                      strokeOpacity={0}
                    />
                  )}
                  {refRange?.max != null && (
                    <ReferenceArea
                      y1={refRange.max}
                      y2={domainMax}
                      fill="#dc2626"
                      fillOpacity={0.08}
                      strokeOpacity={0}
                    />
                  )}
                  <Tooltip
                    content={<LabTooltip unit={chart.unit} />}
                    wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                    allowEscapeViewBox={{ x: false, y: false }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#1f2937" dot={<FlagDot />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })
      )}
    </div>
  );
}

function TableForType({ title, tests }: { title: string; tests: OtherBloodworkTest[] }) {
  if (tests.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 pt-6 first:border-0 first:pt-0">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <OtherResultsTable tests={tests} />
    </div>
  );
}

export function BloodworkCharts({
  charts,
  otherResults,
}: {
  charts: BloodworkChart[];
  otherResults: OtherBloodworkTest[];
}) {
  if (charts.length === 0 && otherResults.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No bloodwork results yet — upload a file on the Medical tab to get started.
      </p>
    );
  }

  const bloodCharts = charts.filter((c) => c.sampleType === "blood");
  const urineCharts = charts.filter((c) => c.sampleType === "urine");
  const bloodOther = otherResults.filter((t) => t.sampleType === "blood");
  const urineOther = otherResults.filter((t) => t.sampleType === "urine");

  return (
    <section className="flex flex-col gap-8">
      <h2 className="font-medium">Trends</h2>

      <ChartsForType title="Blood" charts={bloodCharts} hasOtherData={bloodOther.length > 0} />
      <ChartsForType title="Urine" charts={urineCharts} hasOtherData={urineOther.length > 0} />

      <TableForType title="Blood" tests={bloodOther} />
      <TableForType title="Urine" tests={urineOther} />
    </section>
  );
}
