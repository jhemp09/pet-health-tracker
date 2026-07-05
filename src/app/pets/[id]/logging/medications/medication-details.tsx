"use client";

import { useState, useTransition } from "react";
import { updateMedicationDetails } from "./details-actions";

type Details = {
  dosage: string | null;
  notes: string | null;
  product_url: string | null;
};

export function MedicationDetails({
  petId,
  medicationId,
  details,
}: {
  petId: string;
  medicationId: string;
  details: Details;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMedicationDetails(petId, medicationId, formData);
      if (!result.ok) setError(result.error ?? "Could not save");
      else setIsEditing(false);
    });
  }

  const hasDetails = details.dosage || details.notes || details.product_url;

  if (isEditing) {
    return (
      <form
        action={handleSave}
        className="flex flex-col gap-2 rounded border border-gray-200 p-2 text-xs"
      >
        <input
          type="text"
          name="dosage"
          defaultValue={details.dosage ?? ""}
          placeholder="Dosage (e.g. 5mg)"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <input
          type="text"
          name="notes"
          defaultValue={details.notes ?? ""}
          placeholder="How to give it (e.g. crush into food)"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <input
          type="url"
          name="product_url"
          defaultValue={details.product_url ?? ""}
          placeholder="Product link (optional)"
          className="rounded border border-gray-300 px-2 py-1"
        />
        {error && <p className="text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary flex-1 px-2 py-1"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setError(null);
            }}
            className="btn-outline flex-1 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-xs">
      {hasDetails ? (
        <>
          {details.dosage && (
            <span
              className="rounded-full px-2 py-1 font-medium"
              style={{ background: "var(--color-meds-light)", color: "var(--color-meds)" }}
            >
              {details.dosage}
            </span>
          )}
          {details.notes && (
            <span style={{ color: "var(--color-muted)" }}>{details.notes}</span>
          )}
          {details.product_url && (
            <a
              href={details.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--color-meds)" }}
            >
              Product link
            </a>
          )}
        </>
      ) : (
        <span style={{ color: "var(--color-muted)" }}>No details yet</span>
      )}
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="ml-auto underline"
        style={{ color: "var(--color-meds)" }}
      >
        {hasDetails ? "edit" : "+ Add details"}
      </button>
    </div>
  );
}
