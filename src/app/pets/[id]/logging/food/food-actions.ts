"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchLinkPreview } from "@/lib/link-preview";

export async function addMealFood(
  petId: string,
  scheduleId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const rawUrl = String(formData.get("url") ?? "").trim();
  if (!rawUrl) return { ok: false, error: "Enter a link" };

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Enter a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Enter a valid URL" };
  }

  const { title, imageUrl } = await fetchLinkPreview(parsed.toString());

  const supabase = await createClient();
  const { error } = await supabase.from("meal_foods").insert({
    schedule_id: scheduleId,
    url: parsed.toString(),
    title: title ?? parsed.hostname,
    image_url: imageUrl,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/logging/food`);
  return { ok: true };
}

// Manual override for a food's display name/image, used when the
// auto-scrape in addMealFood comes back empty (many retailers, e.g.
// Chewy's Kasada bot-detection, block server-side scraping entirely).
export async function updateMealFood(
  petId: string,
  foodId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "Enter a valid image URL" };
      }
    } catch {
      return { ok: false, error: "Enter a valid image URL" };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_foods")
    .update({
      title: title || null,
      image_url: imageUrl || null,
    })
    .eq("id", foodId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/logging/food`);
  return { ok: true };
}

export async function removeMealFood(petId: string, foodId: string) {
  const supabase = await createClient();
  await supabase.from("meal_foods").delete().eq("id", foodId);
  revalidatePath(`/pets/${petId}/logging/food`);
}
