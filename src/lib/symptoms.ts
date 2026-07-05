// Fixed catalog of demeanor symptoms a pet can be tracked for. Each pet
// selects which of these are active (pet_demeanor_symptoms), and each
// active symptom gets its own daily observation (demeanor_observations),
// matching the "checklist that shows up every day" pattern used for
// feeding schedules.

export type SymptomScale = { type: "count"; unit: string } | { type: "relative_5" };

export type SymptomDef = {
  key: string;
  label: string;
  scale: SymptomScale;
};

// A 5-point scale relative to the pet's normal baseline. Stored as
// value_numeric 1-5 for charting, but the UI only ever shows these labels
// (never the raw number) since "3" on its own is meaningless to a user.
export const RELATIVE_5_LABELS: { value: number; label: string }[] = [
  { value: 1, label: "Much less than normal" },
  { value: 2, label: "Less than normal" },
  { value: 3, label: "Normal" },
  { value: 4, label: "More than normal" },
  { value: 5, label: "Much more than normal" },
];

export const SYMPTOM_CATALOG: SymptomDef[] = [
  {
    key: "vomiting_count",
    label: "Vomiting",
    scale: { type: "count", unit: "times" },
  },
  {
    key: "urination_count",
    label: "Urination",
    scale: { type: "count", unit: "times" },
  },
  {
    key: "defecation_count",
    label: "Defecation",
    scale: { type: "count", unit: "times" },
  },
  {
    key: "lethargy",
    label: "Lethargy",
    scale: { type: "relative_5" },
  },
  {
    key: "panting",
    label: "Panting",
    scale: { type: "relative_5" },
  },
  {
    key: "distancing",
    label: "Distancing/Hiding",
    scale: { type: "relative_5" },
  },
  {
    key: "vocalizations",
    label: "Vocalizations",
    scale: { type: "relative_5" },
  },
  {
    key: "drinking",
    label: "Drinking",
    scale: { type: "relative_5" },
  },
  {
    key: "willingness_to_walk",
    label: "Willingness to Walk",
    scale: { type: "relative_5" },
  },
  {
    key: "limping",
    label: "Limping",
    scale: { type: "relative_5" },
  },
  {
    key: "respiratory",
    label: "Sneezing/Coughing/Congestion",
    scale: { type: "relative_5" },
  },
];

export function getSymptomDef(key: string): SymptomDef | undefined {
  return SYMPTOM_CATALOG.find((s) => s.key === key);
}
