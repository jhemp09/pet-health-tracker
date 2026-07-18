"use client";

import { useState } from "react";

export function TrendsTabs({
  behavioral,
  medical,
}: {
  behavioral: React.ReactNode;
  medical: React.ReactNode;
}) {
  const [tab, setTab] = useState<"behavioral" | "medical">("behavioral");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("behavioral")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            tab === "behavioral" ? "bg-black text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Behavioral
        </button>
        <button
          type="button"
          onClick={() => setTab("medical")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            tab === "medical" ? "bg-black text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          Medical
        </button>
      </div>

      <div className={tab === "behavioral" ? "" : "hidden"}>{behavioral}</div>
      <div className={tab === "medical" ? "" : "hidden"}>{medical}</div>
    </div>
  );
}
