"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHousehold(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";

  if (!name) {
    redirect(`/onboarding?error=${encodeURIComponent("Household name is required")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_household", {
    household_name: name,
    member_display_name: displayName,
    household_timezone: timezone,
  });

  if (error || !data) {
    redirect(`/onboarding?error=${encodeURIComponent(error?.message ?? "Could not create household")}`);
  }

  redirect(`/households/${data}`);
}

export async function joinHousehold(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim() || null;

  if (!code) {
    redirect(`/onboarding?error=${encodeURIComponent("Invite code is required")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_household_with_code", {
    invite_code: code,
    member_display_name: displayName,
  });

  if (error || !data) {
    redirect(`/onboarding?error=${encodeURIComponent(error?.message ?? "Could not join household")}`);
  }

  redirect(`/households/${data}`);
}
