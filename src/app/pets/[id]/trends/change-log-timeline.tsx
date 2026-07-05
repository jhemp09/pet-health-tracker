"use client";

import { useState, useTransition } from "react";
import { addManualChangeLogEntry, deleteChangeLogEntry } from "./change-log-actions";

type Category = "medication" | "food" | "bloodwork" | "manual";
type Entry = {
  id: string;
  event_date: string;
  category: Category;
  description: string;
};

const CATEGORY_COLOR: Record<Category, string> = {
  medication: "var(--color-meds)",
  food: "var(--color-food)",
  bloodwork: "var(--color-demeanor)",
  manual: "var(--color-primary)",
};

const CATEGORY_LABEL: Record<Category, string> = {
  medication: "Medication",
  food: "Food",
  bloodwork: "Vet visit",
  manual: "Note",
};

export function ChangeLogTimeline({
  petId,
  entries,
}: {
  petId: string;
  entries: Entry[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addManualChangeLogEntry(petId, formData);
      setIsAdding(false);
    });
  }

  function handleDelete(entryId: string) {
    startTransition(() => deleteChangeLogEntry(petId, entryId));
  }

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Change log</h2>
        <button
          type="button"
          onClick={() => setIsAdding((a) => !a)}
          className="text-sm underline"
          style={{ color: "var(--color-primary)" }}
        >
          {isAdding ? "Cancel" : "+ Add event"}
        </button>
      </div>

      {isAdding && (
        <form
          action={handleAdd}
          className="mt-3 flex flex-col gap-2 rounded border border-gray-200 p-3 text-sm"
        >
          <label className="flex flex-col gap-1 text-xs">
            Date
            <input
              type="date"
              name="event_date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            What happened
            <input
              type="text"
              name="description"
              required
              placeholder="e.g. Vet increased dosage"
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-fit px-3 py-1.5 text-sm"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
          No events yet.
        </p>
      ) : (
        <ol
          className="mt-4 flex flex-col gap-4 border-l-2 pl-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span
                className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full"
                style={{ background: CATEGORY_COLOR[entry.category] }}
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: CATEGORY_COLOR[entry.category] }}
                  >
                    {CATEGORY_LABEL[entry.category]} · {entry.event_date}
                  </p>
                  <p className="text-sm">{entry.description}</p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(entry.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
