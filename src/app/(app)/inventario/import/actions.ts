"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
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
  "p contado": "price_cash",
  "p web": "price_web",
  // "P. Venta" es el nombre viejo (de antes de separar contado/web); lo
  // seguimos aceptando como alias de price_cash.
  "p venta": "price_cash",
  "unidad de negocio": "business_unit",
  "categoria madre": "category",
  subcategoria: "subcategory",
  publicado: "is_web",
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

  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      message: "Seleccioná un archivo .xlsx o .csv primero.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet | undefined;

  try {
    if (isCsv) {
      // Readable.from(buffer) iteraría el Buffer byte a byte (es un
      // Uint8Array iterable); envolverlo en un array lo pasa como un
      // único chunk, que es lo que espera el parser de CSV.
      worksheet = await workbook.csv.read(Readable.from([buffer]));
    } else {
      // exceljs tipa `load` contra un `Buffer` de una versión de
      // @types/node distinta a la nuestra (la trae fast-csv, dependencia
      // transitiva) y ninguno de los dos alias "Buffer" visibles calza
      // estructuralmente con el otro; en tiempo de ejecución es un
      // Buffer válido igual.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
      worksheet = workbook.worksheets[0];
    }
  } catch {
    return {
      ok: false,
      message: "No se pudo leer el archivo. ¿Es un .xlsx o .csv válido?",
    };
  }

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
  if (
    !fields.has("sku") ||
    !fields.has("description") ||
    !fields.has("price_cash")
  ) {
    return {
      ok: false,
      message:
        "Faltan columnas obligatorias en el archivo: Código, Descripción y/o P. Contado.",
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
    price_cash: number;
    price_web: number;
    stock: number;
    is_web: boolean;
    business_unit_id: string | null;
    category_id: string | null;
    subcategory_id: string | null;
  };

  // Mapa inverso field -> columna, calculado una sola vez.
  const columnOf = new Map<string, number>();
  columnByIndex.forEach((field, colNumber) => columnOf.set(field, colNumber));

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
    if (!record.price_cash?.trim()) {
      skipped.push({ row: row.number, sku, reason: "P. Contado vacío" });
      continue;
    }

    // La unidad de negocio es opcional: si el archivo no trae la columna,
    // o la fila la deja vacía, el producto se importa sin asignar y se
    // completa después a mano. Si viene un valor que no se reconoce, sí se
    // omite la fila (para no asignar una unidad equivocada).
    const businessUnitName = record.business_unit?.trim();
    let businessUnitId: string | null = null;

    if (businessUnitName) {
      businessUnitId =
        resolveBusinessUnitId(businessUnitName, businessUnitByName) ?? null;
      if (!businessUnitId) {
        skipped.push({
          row: row.number,
          sku,
          reason: `Unidad de negocio "${businessUnitName}" no reconocida`,
        });
        continue;
      }
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

      const webText = record.is_web?.trim().toLowerCase() ?? "";

      validRows.push({
        sku,
        description,
        cost: cellNumber(row.getCell(columnOf.get("cost") ?? -1)),
        price_cash: cellNumber(row.getCell(columnOf.get("price_cash") ?? -1)),
        price_web: cellNumber(row.getCell(columnOf.get("price_web") ?? -1)),
        stock: Math.round(cellNumber(row.getCell(columnOf.get("stock") ?? -1))),
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
