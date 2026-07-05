// Fixed catalog of demeanor symptoms a pet can be tracked for. Each pet
// selects which of these are active (pet_demeanor_symptoms), and each
// active symptom gets its own daily observation (demeanor_observations),
// matching the "checklist that shows up every day" pattern used for
// feeding schedules.

export type SymptomScale =
  | { type: "count"; unit: string }
  | { type: "rating_1_10" }
  | { type: "enum"; options: string[] };

export type SymptomDef = {
  key: string;
  label: string;
  scale: SymptomScale;
};

export const SYMPTOM_CATALOG: SymptomDef[] = [
  {
    key: "vomiting_count",
    label: "Vomiting",
    scale: { type: "count", unit: "times" },
  },
  {
    key: "lethargy",
    label: "Lethargy",
    scale: { type: "rating_1_10" },
  },
  {
    key: "panting",
    label: "Panting",
    scale: { type: "rating_1_10" },
  },
  {
    key: "distancing",
    label: "Distancing / hiding",
    scale: { type: "rating_1_10" },
  },
  {
    key: "vocalizations",
    label: "Vocalizations",
    scale: {
      type: "enum",
      options: ["Normal", "More than normal", "Less than normal"],
    },
  },
];

export function getSymptomDef(key: string): SymptomDef | undefined {
  return SYMPTOM_CATALOG.find((s) => s.key === key);
}
