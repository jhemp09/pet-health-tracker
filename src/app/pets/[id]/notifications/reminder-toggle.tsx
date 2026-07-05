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
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setEnabled(next);
          startTransition(() => setReminderPreference(petId, field, next));
        }}
      />
      {label}
    </label>
  );
}
