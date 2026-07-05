"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function generateInvite(householdId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_household_invite", {
    hid: householdId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/households/${householdId}`);
  return data;
}
