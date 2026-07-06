"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LedgerKind, SupplierDocType } from "@/lib/types";

export type SupplierInput = {
  trade_name: string;
  legal_name: string | null;
  cuit: string | null;
  vat_condition: string | null;
  gross_income: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  category: string | null;
  price_list: string | null;
  delivery_time: string | null;
  min_order: string | null;
  usual_discount: number | null;
  payment_cash: boolean;
  payment_7d: boolean;
  payment_15d: boolean;
  payment_30d: boolean;
  payment_60d: boolean;
  payment_transfer: boolean;
  payment_check: boolean;
  payment_card: boolean;
  payment_notes: string | null;
  is_active: boolean;
  internal_notes: string | null;
};

async function logHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  supplierId: string,
  eventType: string,
  description: string
) {
  await supabase
    .from("supplier_history")
    .insert({ supplier_id: supplierId, event_type: eventType, description });
}

export async function createSupplier(input: SupplierInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logHistory(supabase, data.id, "creado", "Proveedor creado.");

  revalidatePath("/proveedores");
  return { data };
}

export async function updateSupplier(id: string, patch: Partial<SupplierInput>) {
  const supabase = await createClient();

  let statusChangeNote: string | null = null;
  if (typeof patch.is_active === "boolean") {
    statusChangeNote = patch.is_active
      ? "Proveedor marcado como activo."
      : "Proveedor marcado como inactivo.";
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  if (statusChangeNote) {
    await logHistory(supabase, id, "cambio_estado", statusChangeNote);
  } else {
    await logHistory(supabase, id, "actualizacion_datos", "Datos del proveedor actualizados.");
  }

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}`);
  return { data };
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  return { data: true };
}

export async function setSupplierBrands(supplierId: string, brandIds: string[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("supplier_brands")
    .delete()
    .eq("supplier_id", supplierId);
  if (deleteError) return { error: deleteError.message };

  if (brandIds.length > 0) {
    const { error: insertError } = await supabase
      .from("supplier_brands")
      .insert(brandIds.map((brand_id) => ({ supplier_id: supplierId, brand_id })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath("/proveedores");
  return { data: true };
}

export async function addSupplierProduct(input: {
  supplier_id: string;
  product_id: string;
  supplier_cost: number | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_products")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/proveedores/${input.supplier_id}`);
  return { data };
}

export async function updateSupplierProduct(
  id: string,
  supplierId: string,
  patch: { supplier_cost?: number | null; last_purchase_date?: string | null }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_products")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/proveedores/${supplierId}`);
  return { data };
}

export async function removeSupplierProduct(id: string, supplierId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("supplier_products").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/proveedores/${supplierId}`);
  return { data: true };
}

export type LedgerEntryInput = {
  supplier_id: string;
  entry_date: string;
  kind: LedgerKind;
  concept: string;
  debit: number;
  credit: number;
  status: string | null;
  payment_method: string | null;
  receipt_number: string | null;
  notes: string | null;
};

const LEDGER_EVENT_LABEL: Record<LedgerKind, { event: string; label: string }> = {
  compra: { event: "compra", label: "Compra registrada" },
  pago: { event: "pago", label: "Pago registrado" },
  ajuste: { event: "ajuste", label: "Ajuste de cuenta corriente" },
  nota_credito: { event: "nota_credito", label: "Nota de crédito registrada" },
};

export async function addLedgerEntry(input: LedgerEntryInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_ledger_entries")
    .insert(input)
    .select("*")
    .single();

  if (error) return { error: error.message };

  const { event, label } = LEDGER_EVENT_LABEL[input.kind];
  await logHistory(supabase, input.supplier_id, event, `${label}: ${input.concept}.`);

  revalidatePath(`/proveedores/${input.supplier_id}`);
  revalidatePath("/proveedores");
  return { data };
}

export async function updateLedgerEntry(
  id: string,
  supplierId: string,
  patch: Partial<LedgerEntryInput>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_ledger_entries")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath("/proveedores");
  return { data };
}

export async function deleteLedgerEntry(id: string, supplierId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplier_ledger_entries")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/proveedores/${supplierId}`);
  revalidatePath("/proveedores");
  return { data: true };
}

const DOCUMENTS_BUCKET = "supplier-documents";

export async function uploadSupplierDocument(
  supplierId: string,
  docType: SupplierDocType | null,
  formData: FormData
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleccioná un archivo primero." };
  }

  const supabase = await createClient();
  const storagePath = `${supplierId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data, error } = await supabase
    .from("supplier_documents")
    .insert({
      supplier_id: supplierId,
      doc_type: docType,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  await logHistory(supabase, supplierId, "documento", `Documento subido: ${file.name}.`);

  revalidatePath(`/proveedores/${supplierId}`);
  return { data };
}

export async function deleteSupplierDocument(id: string, supplierId: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);

  const { error } = await supabase.from("supplier_documents").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/proveedores/${supplierId}`);
  return { data: true };
}

export async function getSupplierDocumentUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 5);

  if (error) return { error: error.message };
  return { data: data.signedUrl };
}
