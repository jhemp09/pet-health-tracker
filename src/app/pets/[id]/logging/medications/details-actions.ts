"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateMedicationDetails(
  petId: string,
  medicationId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const dosage = String(formData.get("dosage") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const productUrl = String(formData.get("product_url") ?? "").trim();

  if (productUrl) {
    try {
      const parsed = new URL(productUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "Enter a valid product link" };
      }
    } catch {
      return { ok: false, error: "Enter a valid product link" };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("medications")
    .update({
      dosage: dosage || null,
      notes: notes || null,
      product_url: productUrl || null,
    })
    .eq("id", medicationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/logging/medications`);
  return { ok: true };
}
