"use client";

import { useState } from "react";

type Tab = "behavioral" | "medical" | "synopsis";

const TABS: { key: Tab; label: string }[] = [
  { key: "behavioral", label: "Behavioral" },
  { key: "medical", label: "Medical" },
  { key: "synopsis", label: "Synopsis" },
];

export function TrendsTabs({
  behavioral,
  medical,
  synopsis,
}: {
  behavioral: React.ReactNode;
  medical: React.ReactNode;
  synopsis: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("behavioral");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              tab === t.key ? "bg-black text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === "behavioral" ? "" : "hidden"}>{behavioral}</div>
      <div className={tab === "medical" ? "" : "hidden"}>{medical}</div>
      <div className={tab === "synopsis" ? "" : "hidden"}>{synopsis}</div>
    </div>
  );
}
