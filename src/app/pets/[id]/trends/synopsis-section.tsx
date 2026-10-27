"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateSynopsis(petId);
        if (!result.ok) setError(result.error ?? "Couldn't generate a synopsis.");
      } catch {
        setError("The request timed out or failed. Please try again.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Synopsis</h2>
        <button
          type="button"
          disabled={isPending}
          onClick={handleGenerate}
          className="shrink-0 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            {isPending && (
              <span
                aria-hidden
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            )}
            {isPending ? "Generating…" : synopsis ? "Regenerate" : "Generate synopsis"}
          </span>
        </button>
      </div>

      <p className="text-xs text-gray-500">
        AI-generated from their tracked data. Not a substitute for veterinary advice — always
        follow up with your vet on anything concerning.
      </p>

      {isPending && (
        <p role="status" className="text-xs text-gray-600">
          Reviewing all tracked data — this can take up to a minute.
        </p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!synopsis ? (
        <p className="text-sm text-gray-500">
          {isPending
            ? "Reviewing tracked data…"
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
