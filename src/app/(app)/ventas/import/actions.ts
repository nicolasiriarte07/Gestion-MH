"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveBusinessUnitId } from "@/lib/business-unit";
import { normalizeHeader, cellText, cellNumber, parseArgentineDate } from "@/lib/excel";

export type SalesImportResult = {
  ok: boolean;
  message?: string;
  totalRows?: number;
  imported?: number;
  autoMatched?: number;
  pending?: number;
  skipped?: { row: number; reason: string }[];
};

// Encabezados tal como aparecen en FACTURAS_MH___EXC_NC.xlsx (columna
// "Nombre_PDF", "Categoria", "Items" y "Monto_con_IVA_usd" no se usan).
const COLUMN_MAP: Record<string, string> = {
  "tipo comprobante": "receipt_letter",
  fecha: "sale_date",
  cliente: "customer_name",
  "forma pago": "payment_method",
  articulo: "source_article_code",
  descripcion: "description",
  cantidad: "quantity",
  "iva monto": "iva",
  "subtotal con iva": "subtotal_with_iva_text",
  "monto con iva ars": "subtotal_with_iva",
  vertical: "business_unit",
};

const CHUNK_SIZE = 500;

export async function importSalesExcel(
  _prevState: SalesImportResult | null,
  formData: FormData
): Promise<SalesImportResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Seleccioná un archivo .xlsx primero." };
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

  // El archivo puede traer una hoja "DATA" con el detalle y otra auxiliar
  // (ej. "USD" con la cotización); usamos la que tenga más columnas
  // reconocidas del mapeo.
  let worksheet = workbook.worksheets[0];
  let bestMatchCount = -1;
  for (const ws of workbook.worksheets) {
    const headerRow = ws.getRow(1);
    let count = 0;
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      if (COLUMN_MAP[normalizeHeader(cellText(cell))]) count += 1;
    });
    if (count > bestMatchCount) {
      bestMatchCount = count;
      worksheet = ws;
    }
  }

  if (!worksheet) {
    return { ok: false, message: "El archivo no tiene hojas." };
  }

  const headerRow = worksheet.getRow(1);
  const columnByIndex = new Map<number, string>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const field = COLUMN_MAP[normalizeHeader(cellText(cell))];
    if (field) columnByIndex.set(colNumber, field);
  });

  const fields = new Set(columnByIndex.values());
  if (!fields.has("sale_date") || !fields.has("description")) {
    return {
      ok: false,
      message:
        "Faltan columnas obligatorias en el Excel: Fecha y/o Descripcion.",
    };
  }
  const hasAmount =
    fields.has("subtotal_with_iva") || fields.has("subtotal_with_iva_text");
  if (!hasAmount) {
    return {
      ok: false,
      message:
        "Faltan columnas obligatorias en el Excel: Monto_con_IVA_ars o Subtotal_con_IVA.",
    };
  }

  const supabase = await createClient();

  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name");
  const businessUnitByName = new Map(
    (businessUnits ?? []).map((bu) => [bu.name.trim().toLowerCase(), bu.id])
  );

  const { data: products } = await supabase.from("products").select("id, sku");
  const productIdBySku = new Map(
    (products ?? []).map((p) => [p.sku.trim().toLowerCase(), p.id])
  );

  type InsertRow = {
    receipt_letter: string | null;
    sale_date: string;
    customer_code: null;
    customer_name: string | null;
    payment_method: string | null;
    product_description_raw: string;
    quantity: number;
    iva: number | null;
    subtotal_with_iva: number;
    product_id: string | null;
    business_unit_id: string | null;
    source_article_code: string | null;
    match_status: "confirmed" | "pending";
    match_confidence: number | null;
  };

  // Mapa inverso field -> columna, calculado una sola vez (evita recorrer
  // columnByIndex por cada fila del archivo).
  const columnOf = new Map<string, number>();
  columnByIndex.forEach((field, colNumber) => columnOf.set(field, colNumber));
  const primaryAmountCol = columnOf.get("subtotal_with_iva");
  const fallbackAmountCol = columnOf.get("subtotal_with_iva_text");

  const rows: InsertRow[] = [];
  const skipped: { row: number; reason: string }[] = [];
  let totalRows = 0;
  let autoMatched = 0;

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

    const description = record.description?.trim();
    if (!description) {
      skipped.push({ row: row.number, reason: "Descripción vacía" });
      continue;
    }

    const saleDate = parseArgentineDate(record.sale_date ?? "");
    if (!saleDate) {
      skipped.push({
        row: row.number,
        reason: `Fecha inválida: "${record.sale_date}"`,
      });
      continue;
    }

    // La columna "fórmula" (Monto_con_IVA_ars) puede fallar en algunas
    // filas (#VALUE! en el archivo original); en ese caso usamos la
    // columna de texto (Subtotal_con_IVA) como respaldo.
    const subtotalWithIva =
      cellNumber(row.getCell(primaryAmountCol ?? -1)) ||
      cellNumber(row.getCell(fallbackAmountCol ?? -1));
    if (!subtotalWithIva) {
      skipped.push({ row: row.number, reason: "Monto no encontrado o en $0" });
      continue;
    }

    const quantity = cellNumber(row.getCell(columnOf.get("quantity") ?? -1)) || 1;

    const ivaCell = row.getCell(columnOf.get("iva") ?? -1);
    const iva = cellText(ivaCell) ? cellNumber(ivaCell) : null;

    const businessUnitName = record.business_unit?.trim();
    const businessUnitId = businessUnitName
      ? (resolveBusinessUnitId(businessUnitName, businessUnitByName) ?? null)
      : null;

    const sourceArticleCode = record.source_article_code?.trim() || null;
    const matchedProductId = sourceArticleCode
      ? (productIdBySku.get(sourceArticleCode.toLowerCase()) ?? null)
      : null;

    if (matchedProductId) autoMatched += 1;

    rows.push({
      receipt_letter: record.receipt_letter?.trim() || null,
      sale_date: saleDate,
      customer_code: null,
      customer_name: record.customer_name?.trim() || null,
      payment_method: record.payment_method?.trim() || null,
      product_description_raw: description,
      quantity,
      iva,
      subtotal_with_iva: subtotalWithIva,
      product_id: matchedProductId,
      business_unit_id: businessUnitId,
      source_article_code: sourceArticleCode,
      match_status: matchedProductId ? "confirmed" : "pending",
      match_confidence: matchedProductId ? 100 : null,
    });
  }

  if (rows.length === 0) {
    return {
      ok: false,
      message: "No se importó ninguna venta.",
      totalRows,
      imported: 0,
      autoMatched: 0,
      pending: 0,
      skipped,
    };
  }

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("sale_items").insert(chunk);
    if (error) {
      return {
        ok: false,
        message: `Error al guardar ventas (se importaron ${i} de ${rows.length}): ${error.message}`,
        totalRows,
        imported: i,
        autoMatched,
        pending: i - autoMatched,
        skipped,
      };
    }
  }

  revalidatePath("/ventas");

  return {
    ok: true,
    totalRows,
    imported: rows.length,
    autoMatched,
    pending: rows.length - autoMatched,
    skipped,
  };
}
