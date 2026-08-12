"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProductInput = {
  sku: string;
  description: string;
  cost: number;
  iva_rate: number;
  price_cash: number;
  price_web: number;
  stock: number;
  is_web: boolean;
  business_unit_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
};

export async function createProduct(input: ProductInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { data };
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { data };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { data: true };
}

export async function createCategory(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { data };
}

export async function createSubcategory(categoryId: string, name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategories")
    .insert({ category_id: categoryId, name })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  return { data };
}
