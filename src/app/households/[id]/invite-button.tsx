"use client";

import { useState, useTransition } from "react";
import { generateInvite } from "./actions";

export function InviteButton({ householdId }: { householdId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const newCode = await generateInvite(householdId);
              setCode(newCode);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          });
        }}
        className="btn-primary w-fit px-4 py-2 text-sm"
      >
        {isPending ? "Generating..." : "Generate invite code"}
      </button>
      {code && (
        <p className="text-sm">
          Share this code (expires in 7 days):{" "}
          <span className="rounded bg-white px-2 py-1 font-mono" style={{ border: "1px solid var(--color-accent)" }}>
            {code}
          </span>
        </p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
