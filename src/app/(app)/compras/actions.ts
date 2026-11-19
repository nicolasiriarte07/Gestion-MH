"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/types";

export type PurchaseOrderItemInput = {
  product_id: string | null;
  product_description: string;
  quantity: number;
  amount: number;
};

export type PurchaseOrderInput = {
  business_unit_id: string | null;
  order_date: string;
  brand_id: string | null;
  traveler: string | null;
  payment_type: string | null;
  confirmed: boolean;
  notes: string | null;
  items: PurchaseOrderItemInput[];
};

export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const supabase = await createClient();
  const { items, ...orderFields } = input;

  const { data: order, error } = await supabase
    .from("purchase_orders")
    .insert(orderFields)
    .select("*")
    .single();

  if (error) return { error: error.message };

  const itemRows = items.map((item) => ({
    purchase_order_id: order.id,
    ...item,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(itemRows)
    .select("*");

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/compras");
  return {
    data: {
      order: order as PurchaseOrder,
      items: insertedItems as PurchaseOrderItem[],
    },
  };
}

export async function toggleOrderConfirmed(id: string, confirmed: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .update({ confirmed })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/compras");
  return { data: data as PurchaseOrder };
}

export async function deletePurchaseOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/compras");
  return { data: true };
}
