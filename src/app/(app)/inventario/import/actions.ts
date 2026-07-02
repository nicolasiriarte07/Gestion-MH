"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveBusinessUnitId } from "@/lib/business-unit";
import { normalizeHeader, cellText, cellNumber } from "@/lib/excel";

export type ImportResult = {
  ok: boolean;
  message?: string;
  totalRows?: number;
  created?: number;
  updated?: number;
  skipped?: { row: number; sku: string; reason: string }[];
};

const COLUMN_MAP: Record<string, string> = {
  codigo: "sku",
  descripcion: "description",
  // "Descricpión" es un typo real que aparece en algunas planillas del
  // negocio; lo mapeamos igual que la ortografía correcta.
  descricpion: "description",
  stock: "stock",
  costo: "cost",
  "p venta": "sale_price",
  "unidad de negocio": "business_unit",
  "categoria madre": "category",
  subcategoria: "subcategory",
  "en web": "is_web",
};

const TRUTHY_WEB_VALUES = new Set([
  "si",
  "s",
  "1",
  "true",
  "x",
  "yes",
  "y",
]);

export async function importMasterExcel(
  _prevState: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file");
  const defaultBusinessUnitId = formData.get("defaultBusinessUnit");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Seleccioná un archivo .xlsx primero." };
  }
  if (typeof defaultBusinessUnitId !== "string" || !defaultBusinessUnitId) {
    return { ok: false, message: "Elegí la unidad de negocio por defecto." };
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return {
      ok: false,
      message: "No se pudo leer el archivo. ¿Es un .xlsx válido?",
    };
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { ok: false, message: "El archivo no tiene hojas." };
  }

  const headerRow = worksheet.getRow(1);
  const columnByIndex = new Map<number, string>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const normalized = normalizeHeader(cellText(cell));
    const field = COLUMN_MAP[normalized];
    if (field) columnByIndex.set(colNumber, field);
  });

  const fields = new Set(columnByIndex.values());
  if (!fields.has("sku") || !fields.has("description")) {
    return {
      ok: false,
      message:
        "Faltan columnas obligatorias en el Excel: Código y/o Descripción.",
    };
  }

  const supabase = await createClient();

  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name");
  const businessUnitByName = new Map(
    (businessUnits ?? []).map((bu) => [bu.name.trim().toLowerCase(), bu.id])
  );

  const { data: existingCategories } = await supabase
    .from("categories")
    .select("id, name");
  const categoryByName = new Map(
    (existingCategories ?? []).map((c) => [c.name.trim().toLowerCase(), c.id])
  );

  const { data: existingSubcategories } = await supabase
    .from("subcategories")
    .select("id, category_id, name");
  const subcategoryByKey = new Map(
    (existingSubcategories ?? []).map((s) => [
      `${s.category_id}::${s.name.trim().toLowerCase()}`,
      s.id,
    ])
  );

  async function getOrCreateCategory(name: string): Promise<string> {
    const key = name.trim().toLowerCase();
    const existing = categoryByName.get(key);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("categories")
      .insert({ name: name.trim() })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "No se pudo crear la categoría");
    categoryByName.set(key, data.id);
    return data.id;
  }

  async function getOrCreateSubcategory(
    categoryId: string,
    name: string
  ): Promise<string> {
    const key = `${categoryId}::${name.trim().toLowerCase()}`;
    const existing = subcategoryByKey.get(key);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("subcategories")
      .insert({ category_id: categoryId, name: name.trim() })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "No se pudo crear la subcategoría");
    subcategoryByKey.set(key, data.id);
    return data.id;
  }

  type UpsertRow = {
    sku: string;
    description: string;
    cost: number;
    sale_price: number;
    stock: number;
    is_web: boolean;
    business_unit_id: string;
    category_id: string | null;
    subcategory_id: string | null;
  };

  const validRows: UpsertRow[] = [];
  const skipped: { row: number; sku: string; reason: string }[] = [];
  let totalRows = 0;

  const dataRows =
    worksheet.rowCount >= 2
      ? (worksheet.getRows(2, worksheet.rowCount - 1) ?? [])
      : [];

  for (const row of dataRows) {
    if (!row || row.actualCellCount === 0) continue;
    totalRows += 1;

    const record: Record<string, string> = {};
    columnByIndex.forEach((field, colNumber) => {
      record[field] = cellText(row.getCell(colNumber));
    });

    const sku = record.sku?.trim();
    const description = record.description?.trim();

    if (!sku) {
      skipped.push({ row: row.number, sku: "", reason: "Código vacío" });
      continue;
    }
    if (!description) {
      skipped.push({ row: row.number, sku, reason: "Descripción vacía" });
      continue;
    }

    const businessUnitName = record.business_unit?.trim();
    let businessUnitId: string | undefined;

    if (businessUnitName) {
      businessUnitId = resolveBusinessUnitId(
        businessUnitName,
        businessUnitByName
      );
      if (!businessUnitId) {
        skipped.push({
          row: row.number,
          sku,
          reason: `Unidad de negocio "${businessUnitName}" no reconocida`,
        });
        continue;
      }
    } else {
      // El archivo no trae la columna (o la fila la tiene vacía): usamos
      // la unidad de negocio por defecto elegida en el formulario.
      businessUnitId = defaultBusinessUnitId;
    }

    try {
      let categoryId: string | null = null;
      let subcategoryId: string | null = null;

      const categoryName = record.category?.trim();
      if (categoryName) {
        categoryId = await getOrCreateCategory(categoryName);

        const subcategoryName = record.subcategory?.trim();
        if (subcategoryName) {
          subcategoryId = await getOrCreateSubcategory(
            categoryId,
            subcategoryName
          );
        }
      }

      const stockCell = row.getCell(
        [...columnByIndex.entries()].find(([, f]) => f === "stock")?.[0] ?? -1
      );
      const costCell = row.getCell(
        [...columnByIndex.entries()].find(([, f]) => f === "cost")?.[0] ?? -1
      );
      const salePriceCell = row.getCell(
        [...columnByIndex.entries()].find(([, f]) => f === "sale_price")?.[0] ??
          -1
      );

      const webText = record.is_web?.trim().toLowerCase() ?? "";

      validRows.push({
        sku,
        description,
        cost: cellNumber(costCell),
        sale_price: cellNumber(salePriceCell),
        stock: Math.round(cellNumber(stockCell)),
        is_web: TRUTHY_WEB_VALUES.has(webText),
        business_unit_id: businessUnitId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
      });
    } catch (err) {
      skipped.push({
        row: row.number,
        sku,
        reason: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  if (validRows.length === 0) {
    return {
      ok: false,
      message: "No se importó ningún producto.",
      totalRows,
      created: 0,
      updated: 0,
      skipped,
    };
  }

  const skus = validRows.map((r) => r.sku);
  const { data: existingProducts } = await supabase
    .from("products")
    .select("sku")
    .in("sku", skus);
  const existingSkuSet = new Set((existingProducts ?? []).map((p) => p.sku));

  const created = validRows.filter((r) => !existingSkuSet.has(r.sku)).length;
  const updated = validRows.length - created;

  const CHUNK_SIZE = 500;
  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("products")
      .upsert(chunk, { onConflict: "sku" });
    if (error) {
      return {
        ok: false,
        message: `Error al guardar productos: ${error.message}`,
        totalRows,
        created,
        updated,
        skipped,
      };
    }
  }

  revalidatePath("/inventario");

  return {
    ok: true,
    totalRows,
    created,
    updated,
    skipped,
  };
}
