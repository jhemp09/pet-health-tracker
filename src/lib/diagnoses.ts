// Common standing diagnoses an owner can attach to a pet, used to populate
// the diagnosis dropdowns on the Medical page. Not exhaustive — the free
// text "additional medical info" field covers anything not on the list.

export const CAT_DIAGNOSES: string[] = [
  "Chronic kidney disease (CKD)",
  "Hyperthyroidism",
  "Diabetes mellitus",
  "Hypertrophic cardiomyopathy (HCM)",
  "Feline lower urinary tract disease (FLUTD)",
  "Inflammatory bowel disease (IBD)",
  "Feline asthma",
  "Pancreatitis",
  "Osteoarthritis",
  "Dental / periodontal disease",
  "Feline immunodeficiency virus (FIV)",
  "Feline leukemia virus (FeLV)",
  "Liver disease (hepatic lipidosis / cholangitis)",
  "Anemia",
  "Cancer / neoplasia",
  "Food or environmental allergies",
  "Obesity",
];

export const DOG_DIAGNOSES: string[] = [
  "Osteoarthritis",
  "Hip or elbow dysplasia",
  "Diabetes mellitus",
  "Hypothyroidism",
  "Cushing's disease (hyperadrenocorticism)",
  "Addison's disease (hypoadrenocorticism)",
  "Chronic kidney disease (CKD)",
  "Congestive heart failure / heart disease",
  "Epilepsy / seizure disorder",
  "Inflammatory bowel disease (IBD)",
  "Pancreatitis",
  "Intervertebral disc disease (IVDD)",
  "Luxating patella",
  "Dental / periodontal disease",
  "Liver disease",
  "Cancer / neoplasia",
  "Food or environmental allergies",
  "Obesity",
];

export function diagnosisCatalogFor(species: string): string[] {
  if (species === "cat") return CAT_DIAGNOSES;
  if (species === "dog") return DOG_DIAGNOSES;
  // No species-specific list for "other" — offer both rather than nothing.
  return Array.from(new Set([...CAT_DIAGNOSES, ...DOG_DIAGNOSES])).sort();
}
