"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchLinkPreview } from "@/lib/link-preview";
import { logChangeEvent } from "@/lib/change-log";

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

  const manualTitle = String(formData.get("title") ?? "").trim();
  const manualAmount = String(formData.get("amount") ?? "").trim();
  const manualImageUrl = String(formData.get("image_url") ?? "").trim();

  const { title: scrapedTitle, imageUrl: scrapedImageUrl } =
    await fetchLinkPreview(parsed.toString());
  const finalTitle = manualTitle || scrapedTitle || parsed.hostname;

  const supabase = await createClient();
  const { error } = await supabase.from("meal_foods").insert({
    schedule_id: scheduleId,
    url: parsed.toString(),
    title: finalTitle,
    amount: manualAmount || null,
    image_url: manualImageUrl || scrapedImageUrl,
  });
  if (error) return { ok: false, error: error.message };

  const { data: schedule } = await supabase
    .from("feeding_schedules")
    .select("label")
    .eq("id", scheduleId)
    .maybeSingle();
  await logChangeEvent(
    supabase,
    petId,
    "food",
    `Added food "${finalTitle}" to "${schedule?.label ?? "meal"}"${manualAmount ? ` (${manualAmount})` : ""}`
  );

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
  const amount = String(formData.get("amount") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const rawUrl = String(formData.get("url") ?? "").trim();

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

  let url: string | undefined;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "Enter a valid URL" };
      }
      url = parsed.toString();
    } catch {
      return { ok: false, error: "Enter a valid URL" };
    }
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("meal_foods")
    .select("title, amount, schedule_id, feeding_schedules(label)")
    .eq("id", foodId)
    .maybeSingle();

  const { error } = await supabase
    .from("meal_foods")
    .update({
      title: title || null,
      amount: amount || null,
      image_url: imageUrl || null,
      ...(url ? { url } : {}),
    })
    .eq("id", foodId);
  if (error) return { ok: false, error: error.message };

  if (existing) {
    const mealLabel =
      (existing.feeding_schedules as unknown as { label: string } | null)
        ?.label ?? "meal";
    if (existing.title !== title) {
      await logChangeEvent(
        supabase,
        petId,
        "food",
        `Renamed food "${existing.title ?? "food"}" to "${title}" in "${mealLabel}"`
      );
    }
    if (existing.amount !== amount) {
      await logChangeEvent(
        supabase,
        petId,
        "food",
        `Changed amount for "${title || existing.title || "food"}" in "${mealLabel}" from "${existing.amount ?? "none"}" to "${amount || "none"}"`
      );
    }
  }

  revalidatePath(`/pets/${petId}/logging/food`);
  return { ok: true };
}

export async function removeMealFood(petId: string, foodId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("meal_foods")
    .select("title, feeding_schedules(label)")
    .eq("id", foodId)
    .maybeSingle();

  await supabase.from("meal_foods").delete().eq("id", foodId);

  if (existing) {
    const mealLabel =
      (existing.feeding_schedules as unknown as { label: string } | null)
        ?.label ?? "meal";
    await logChangeEvent(
      supabase,
      petId,
      "food",
      `Removed food "${existing.title ?? "food"}" from "${mealLabel}"`
    );
  }

  revalidatePath(`/pets/${petId}/logging/food`);
}
