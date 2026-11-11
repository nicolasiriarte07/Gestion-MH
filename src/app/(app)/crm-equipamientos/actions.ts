"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ContactCategory,
  CrmInstallment,
  CrmInstallmentSale,
  InstallmentFrequency,
} from "@/lib/types";

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Suma "count" intervalos (día/semana/mes) a una fecha ISO sin pasar por
// el parseo UTC de `new Date(string)` (que corre el día en zonas con
// offset negativo). Un mes se suma con setMonth, que ya maneja el
// desborde de fin de mes razonablemente (ej. 31 ene + 1 mes -> 3 mar).
function addInterval(
  dateISO: string,
  frequency: InstallmentFrequency,
  count: number
): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (frequency === "diaria") date.setDate(date.getDate() + count);
  else if (frequency === "semanal") date.setDate(date.getDate() + count * 7);
  else date.setMonth(date.getMonth() + count);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export type InstallmentSaleInput = {
  client_name: string;
  product: string;
  sale_date: string;
  down_payment: number;
  installment_frequency: InstallmentFrequency;
  installment_amount: number;
  notes: string | null;
  installments_count: number;
  first_due_date: string;
};

export async function createInstallmentSale(input: InstallmentSaleInput) {
  const supabase = await createClient();
  const { installments_count, first_due_date, ...saleFields } = input;

  const { data: sale, error } = await supabase
    .from("crm_installment_sales")
    .insert(saleFields)
    .select("*")
    .single();

  if (error) return { error: error.message };

  const installmentRows = Array.from({ length: installments_count }, (_, i) => ({
    sale_id: sale.id,
    installment_number: i + 1,
    due_date: addInterval(first_due_date, input.installment_frequency, i),
    amount: input.installment_amount,
    paid: false,
  }));

  const { data: installments, error: installmentsError } = await supabase
    .from("crm_installments")
    .insert(installmentRows)
    .select("*");

  if (installmentsError) return { error: installmentsError.message };

  revalidatePath("/crm-equipamientos");
  return {
    data: {
      sale: sale as CrmInstallmentSale,
      installments: installments as CrmInstallment[],
    },
  };
}

export async function toggleInstallmentPaid(id: string, paid: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_installments")
    .update({ paid, paid_date: paid ? todayISO() : null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/crm-equipamientos");
  return { data: data as CrmInstallment };
}

export async function deleteInstallmentSale(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_installment_sales").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/crm-equipamientos");
  return { data: true };
}
