"use client";

import { useState, useTransition } from "react";
import { setReminderPreference } from "./actions";

type ReminderField =
  | "feeding_enabled"
  | "medication_enabled"
  | "weight_enabled"
  | "demeanor_enabled";

export function ReminderToggle({
  petId,
  field,
  label,
  initialEnabled,
}: {
  petId: string;
  field: ReminderField;
  label: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="card flex items-center gap-2.5 px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        style={{ accentColor: "var(--color-primary)" }}
        className="h-4 w-4"
        onChange={(e) => {
          const next = e.target.checked;
          setEnabled(next);
          startTransition(() => setReminderPreference(petId, field, next));
        }}
      />
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
    </label>
  );
}
