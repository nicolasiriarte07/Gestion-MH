"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveBusinessUnitId } from "@/lib/business-unit";
import {
  normalizeHeader,
  cellText,
  cellNumber,
  parseArgentineDate,
  decodeCsvBuffer,
  detectCsvDelimiter,
  csvKeepAsText,
} from "@/lib/excel";

export type SalesImportResult = {
  ok: boolean;
  message?: string;
  totalRows?: number;
  imported?: number;
  duplicates?: number;
  autoMatched?: number;
  pending?: number;
  replaced?: boolean;
  skipped?: { row: number; reason: string }[];
};

// Encabezados tal como aparecen en FACTURAS_MH___EXC_NC (.xlsx o .csv).
const COLUMN_MAP: Record<string, string> = {
  "nombre pdf": "receipt_number",
  "tipo comprobante": "receipt_letter",
  fecha: "sale_date",
  dia: "weekday_label",
  cliente: "customer_name",
  "forma pago": "payment_method",
  articulo: "source_article_code",
  descripcion: "description",
  categoria: "category_raw",
  cantidad: "quantity",
  "iva monto": "iva",
  "subtotal con iva": "subtotal_with_iva_text",
  "monto con iva ars": "subtotal_with_iva",
  "monto con iva usd": "amount_usd",
  vertical: "business_unit",
};

const CHUNK_SIZE = 500;

export async function importSalesExcel(
  _prevState: SalesImportResult | null,
  formData: FormData
): Promise<SalesImportResult> {
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
      // Readable.from(buffer) iteraría el Buffer byte a byte; envolverlo
      // en un array lo pasa como un único chunk, que es lo que espera el
      // parser de CSV.
      const csvBuffer = decodeCsvBuffer(buffer);
      const delimiter = detectCsvDelimiter(csvBuffer);
      worksheet = await workbook.csv.read(Readable.from([csvBuffer]), {
        parserOptions: { delimiter },
        map: csvKeepAsText,
      });
    } else {
      // exceljs tipa `load` contra un `Buffer` de una versión de
      // @types/node distinta a la nuestra (la trae fast-csv, dependencia
      // transitiva); en tiempo de ejecución es un Buffer válido igual.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);

      // El archivo puede traer una hoja "DATA" con el detalle y otra
      // auxiliar (ej. "USD" con la cotización); usamos la que tenga más
      // columnas reconocidas del mapeo.
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
    const field = COLUMN_MAP[normalizeHeader(cellText(cell))];
    if (field) columnByIndex.set(colNumber, field);
  });

  const fields = new Set(columnByIndex.values());
  if (!fields.has("sale_date") || !fields.has("description")) {
    return {
      ok: false,
      message:
        "Faltan columnas obligatorias en el archivo: Fecha y/o Descripcion.",
    };
  }
  const hasAmount =
    fields.has("subtotal_with_iva") || fields.has("subtotal_with_iva_text");
  if (!hasAmount) {
    return {
      ok: false,
      message:
        "Faltan columnas obligatorias en el archivo: Monto_con_IVA_ars o Subtotal_con_IVA.",
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
    receipt_number: string | null;
    sale_date: string;
    weekday_label: string | null;
    customer_code: null;
    customer_name: string | null;
    payment_method: string | null;
    product_description_raw: string;
    category_raw: string | null;
    quantity: number;
    iva: number | null;
    subtotal_with_iva: number;
    amount_usd: number | null;
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

    const usdCell = row.getCell(columnOf.get("amount_usd") ?? -1);
    const amountUsd = cellText(usdCell) ? cellNumber(usdCell) : null;

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
      receipt_number: record.receipt_number?.trim() || null,
      sale_date: saleDate,
      weekday_label: record.weekday_label?.trim().toLowerCase() || null,
      customer_code: null,
      customer_name: record.customer_name?.trim() || null,
      payment_method: record.payment_method?.trim() || null,
      product_description_raw: description,
      category_raw: record.category_raw?.trim() || null,
      quantity,
      iva,
      subtotal_with_iva: subtotalWithIva,
      amount_usd: amountUsd,
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

  // "Reemplazar ventas existentes" borra todo sale_items antes de insertar
  // el archivo nuevo. Ya no hace falta para evitar duplicados (ver
  // dedupe_key más abajo), pero sigue siendo necesaria para resubir el
  // mismo histórico completo cuando se agrega una columna nueva más
  // adelante (ej. amount_usd/weekday_label): una fila que ya existe se
  // reconoce como duplicada por su contenido y se omite, así que sin
  // "reemplazar" esa columna nueva no se completaría en filas viejas.
  const replaceExisting = formData.get("replaceExisting") === "on";
  if (replaceExisting) {
    const { error: deleteError } = await supabase
      .from("sale_items")
      .delete()
      .not("id", "is", null);
    if (deleteError) {
      return {
        ok: false,
        message: `Error al borrar las ventas existentes: ${deleteError.message}`,
        totalRows,
        skipped,
      };
    }
  }

  // Los chunks se insertan en tandas concurrentes (no todos a la vez, para
  // no saturar el pool de conexiones de Supabase) para que archivos de
  // varios miles de filas terminen antes del límite de tiempo de la
  // función serverless.
  const chunks: (typeof rows)[] = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE));
  }

  // upsert + ignoreDuplicates en vez de insert: si una fila ya existe (su
  // dedupe_key, calculada a partir de fecha/cliente/descripción/cantidad/
  // monto/comprobante, coincide con una fila ya cargada), Postgres la
  // descarta en silencio en vez de duplicarla o fallar. No pisa
  // match_status/product_id de filas ya confirmadas a mano en Revisar
  // coincidencias, porque esas filas ni siquiera se tocan.
  const INSERT_CONCURRENCY = 5;
  let insertedCount = 0;
  for (let i = 0; i < chunks.length; i += INSERT_CONCURRENCY) {
    const batch = chunks.slice(i, i + INSERT_CONCURRENCY);
    const results = await Promise.all(
      batch.map((chunk) =>
        supabase
          .from("sale_items")
          .upsert(chunk, { onConflict: "dedupe_key", ignoreDuplicates: true })
          .select("id")
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return {
        ok: false,
        message: `Error al guardar ventas (se importaron ${insertedCount} de ${rows.length}): ${failed.error.message}`,
        totalRows,
        imported: insertedCount,
        autoMatched,
        pending: insertedCount - autoMatched,
        skipped,
      };
    }
    insertedCount += results.reduce((sum, r) => sum + (r.data?.length ?? 0), 0);
  }

  revalidatePath("/ventas");

  return {
    ok: true,
    totalRows,
    imported: insertedCount,
    duplicates: rows.length - insertedCount,
    autoMatched,
    pending: rows.length - autoMatched,
    replaced: replaceExisting,
    skipped,
  };
}
