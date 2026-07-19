"use client";

import { useTransition } from "react";
import { generateSynopsis } from "./actions";

export type Synopsis = {
  currentState: string;
  recentChanges: string;
  trend: string;
  prognosis: string;
  suggestions: string[];
  generatedAt: string;
};

export function SynopsisSection({
  petId,
  synopsis,
}: {
  petId: string;
  synopsis: Synopsis | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Synopsis</h2>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => generateSynopsis(petId))}
          className="shrink-0 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {isPending ? "Generating…" : synopsis ? "Regenerate" : "Generate synopsis"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        AI-generated from her tracked data. Not a substitute for veterinary advice — always
        follow up with your vet on anything concerning.
      </p>

      {!synopsis ? (
        <p className="text-sm text-gray-500">
          {isPending
            ? "Reviewing her tracked data…"
            : "No synopsis yet — tap Generate synopsis above."}
        </p>
      ) : (
        <div className="flex flex-col gap-4 text-sm text-gray-700">
          <p className="text-xs text-gray-400">
            Generated {new Date(synopsis.generatedAt).toLocaleString()}
          </p>
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">Current state</h3>
            <p>{synopsis.currentState}</p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">Recent changes</h3>
            <p>{synopsis.recentChanges}</p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">Trend</h3>
            <p>{synopsis.trend}</p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">Prognosis</h3>
            <p>{synopsis.prognosis}</p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">Things to try</h3>
            <ul className="list-disc pl-5">
              {synopsis.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
