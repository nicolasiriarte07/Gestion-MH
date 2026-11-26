"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContactStage, SalePaymentMethod } from "@/lib/types";

export type SaleInput = {
  cliente: string;
  comercio: string | null;
  contact_id: string | null;
  mes: string | null;
  fecha: string | null;
  producto: string;
  categoria: string | null;
  monto: number;
  metodo_pago: SalePaymentMethod | null;
  entrega_inicial: number;
  cuota_semanal: number | null;
  semanas_pagadas: number;
  comentario: string | null;
  cobrado: boolean;
  entregado: boolean;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const CLIENT_READY_STAGES: ContactStage[] = ["lead", "contactado", "cotizado"];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Si la venta queda vinculada a un contacto que todavía era lead/
// contactado/cotizado, esa venta lo convierte en cliente y esa fecha
// pasa a ser su último contacto. No toca contactos ya "cliente" o
// "perdido".
async function maybeUpgradeContactToClient(
  supabase: SupabaseServerClient,
  contactId: string | null,
  saleDate: string | null
) {
  if (!contactId) return;
  const { data: contact } = await supabase
    .from("equipamientos_contacts")
    .select("etapa")
    .eq("id", contactId)
    .single();

  if (!contact || !CLIENT_READY_STAGES.includes(contact.etapa)) return;

  await supabase
    .from("equipamientos_contacts")
    .update({ etapa: "cliente", last_contact_date: saleDate ?? todayISO() })
    .eq("id", contactId);
}

export async function createSale(input: SaleInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipamientos_sales")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await maybeUpgradeContactToClient(supabase, input.contact_id, input.fecha);

  revalidatePath("/ventas-equipamientos");
  revalidatePath("/crm-equipamientos");
  return { data };
}

export async function updateSale(id: string, patch: Partial<SaleInput>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipamientos_sales")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  if (patch.contact_id) {
    await maybeUpgradeContactToClient(supabase, patch.contact_id, patch.fecha ?? data.fecha);
  }

  revalidatePath("/ventas-equipamientos");
  revalidatePath("/crm-equipamientos");
  return { data };
}

export async function deleteSale(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("equipamientos_sales").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/ventas-equipamientos");
  return { data: true };
}

// Usada desde /ventas-equipamientos/vincular para confirmar, venta por
// venta, el contacto propuesto por el matching automático (o el que el
// usuario haya elegido a mano en su lugar).
export async function linkSaleToContact(saleId: string, contactId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipamientos_sales")
    .update({ contact_id: contactId })
    .eq("id", saleId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await maybeUpgradeContactToClient(supabase, contactId, data.fecha);

  revalidatePath("/ventas-equipamientos");
  revalidatePath("/crm-equipamientos");
  return { data };
}
