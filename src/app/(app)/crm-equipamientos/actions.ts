"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContactCategory } from "@/lib/types";

export type ContactInput = {
  name: string;
  business_name: string | null;
  city: string | null;
  phone: string | null;
  category: ContactCategory;
  last_contact_date: string | null;
};

export async function createContact(input: ContactInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipamientos_contacts")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/crm-equipamientos");
  return { data };
}

export async function updateContact(id: string, patch: Partial<ContactInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipamientos_contacts")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/crm-equipamientos");
  return { data };
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("equipamientos_contacts").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/crm-equipamientos");
  return { data: true };
}
