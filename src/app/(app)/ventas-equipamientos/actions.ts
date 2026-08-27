"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SalePaymentMethod } from "@/lib/types";

export type SaleInput = {
  cliente: string;
  comercio: string | null;
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

export async function createSale(input: SaleInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("equipamientos_sales")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/ventas-equipamientos");
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

  revalidatePath("/ventas-equipamientos");
  return { data };
}

export async function deleteSale(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("equipamientos_sales").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/ventas-equipamientos");
  return { data: true };
}
