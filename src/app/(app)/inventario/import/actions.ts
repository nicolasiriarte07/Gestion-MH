"use server";

import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveBusinessUnitId } from "@/lib/business-unit";
import {
  normalizeHeader,
  cellText,
  parseFlexibleNumber,
  decodeCsvBuffer,
  detectCsvDelimiter,
  csvKeepAsText,
} from "@/lib/excel";

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
  "p costo": "cost",
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

// IVA que se asume para un producto nuevo (el archivo no trae esa columna),
// al convertir el Costo sin IVA del archivo a costo con IVA. Es la
// alícuota general (21%); el usuario la puede ajustar después desde la
// ficha del producto si corresponde 10,5%.
const DEFAULT_IVA_RATE = 21;

const TRUTHY_WEB_VALUES = new Set([
  "si",
  "s",
  "1",
  "true",
  "x",
  "yes",
  "y",
]);

type CandidateRow = {
  rowNumber: number;
  sku: string;
  description: string;
  record: Record<string, string>;
};

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
      const csvBuffer = decodeCsvBuffer(buffer);
      const delimiter = detectCsvDelimiter(csvBuffer);
      worksheet = await workbook.csv.read(Readable.from([csvBuffer]), {
        parserOptions: { delimiter },
        map: csvKeepAsText,
      });
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

  // ---------------------------------------------------------------------
  // Paso 1: leer y validar todas las filas (Código, Descripción y P.
  // Contado son obligatorios). Todavía no resolvemos unidad de
  // negocio/categoría acá porque eso depende de lo que ya haya guardado
  // en la base para cada código (ver paso 2).
  // ---------------------------------------------------------------------
  const candidates: CandidateRow[] = [];
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

    candidates.push({ rowNumber: row.number, sku, description, record });
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      message: "No se importó ningún producto.",
      totalRows,
      created: 0,
      updated: 0,
      skipped,
    };
  }

  // ---------------------------------------------------------------------
  // Paso 2: traer los productos que ya existen por Código, para poder
  // reimportar el mismo archivo (o una versión más nueva, ej. solo con
  // Código/Descripción/Stock/P.Contado/P.Web para actualizar stock y
  // precios) sin perder datos que el archivo no trae. Costo, Publicado,
  // Unidad de Negocio, Categoría y Subcategoría se preservan si la fila
  // del archivo no especifica un valor (o si la columna no está en el
  // archivo); Descripción, P. Contado, P. Web y Stock siempre se
  // actualizan con lo que traiga el archivo. Marca nunca se toca acá (no
  // viene del archivo).
  // ---------------------------------------------------------------------
  const skus = candidates.map((c) => c.sku);
  // El filtro `.in("sku", skus)` va en la URL del pedido (GET): con
  // catálogos grandes (miles de códigos) una sola consulta con todos los
  // códigos juntos puede superar el largo máximo de URL y fallar. Por eso
  // se pide en tandas chicas. IMPORTANTE: si alguna tanda falla, se corta
  // la importación acá en vez de seguir con una lista de "productos
  // existentes" incompleta — eso haría que productos que sí existen se
  // traten como nuevos y les borre el costo/publicado/unidad de negocio/
  // categoría que ya tenían (bug real: pasó exactamente esto).
  const EXISTING_LOOKUP_CHUNK = 200;
  const existingProducts: {
    sku: string;
    cost: number;
    iva_rate: number;
    is_web: boolean;
    business_unit_id: string | null;
    category_id: string | null;
    subcategory_id: string | null;
  }[] = [];
  for (let i = 0; i < skus.length; i += EXISTING_LOOKUP_CHUNK) {
    const skuChunk = skus.slice(i, i + EXISTING_LOOKUP_CHUNK);
    const { data, error } = await supabase
      .from("products")
      .select("sku, cost, iva_rate, is_web, business_unit_id, category_id, subcategory_id")
      .in("sku", skuChunk);
    if (error) {
      return {
        ok: false,
        message: `No se pudo verificar los productos existentes (para no borrar datos por error, se canceló la importación sin guardar nada): ${error.message}`,
        totalRows,
        created: 0,
        updated: 0,
        skipped,
      };
    }
    existingProducts.push(...(data ?? []));
  }
  const existingBySku = new Map(existingProducts.map((p) => [p.sku, p]));

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

  const validRows: UpsertRow[] = [];

  for (const { rowNumber, sku, description, record } of candidates) {
    const existing = existingBySku.get(sku);

    // La unidad de negocio es opcional: si el archivo no trae la columna
    // (o la fila la deja vacía), se preserva la que ya tenía el producto
    // (o queda sin asignar si es nuevo). Si viene un valor que no se
    // reconoce, sí se omite la fila (para no asignar una unidad
    // equivocada, ni pisar la que ya estaba).
    const businessUnitName = record.business_unit?.trim();
    let businessUnitId: string | null = existing?.business_unit_id ?? null;

    if (businessUnitName) {
      const resolved =
        resolveBusinessUnitId(businessUnitName, businessUnitByName) ?? null;
      if (!resolved) {
        skipped.push({
          row: rowNumber,
          sku,
          reason: `Unidad de negocio "${businessUnitName}" no reconocida`,
        });
        continue;
      }
      businessUnitId = resolved;
    }

    try {
      let categoryId: string | null = existing?.category_id ?? null;
      let subcategoryId: string | null = existing?.subcategory_id ?? null;

      const categoryName = record.category?.trim();
      if (categoryName) {
        categoryId = await getOrCreateCategory(categoryName);

        const subcategoryName = record.subcategory?.trim();
        subcategoryId = subcategoryName
          ? await getOrCreateSubcategory(categoryId, subcategoryName)
          : null;
      }

      // El Costo que traen estos archivos (columna Costo o P.Costo) viene
      // SIN IVA (neto). El campo `cost` de la base guarda el costo CON IVA
      // (de ahí se calcula "Costo S/IVA" en la tabla de Inventario,
      // dividiendo por el IVA de cada producto). Por eso acá se hace la
      // conversión inversa: costo con IVA = costo sin IVA * (1 +
      // iva_rate/100), con el IVA que ya tiene el producto (21% si es
      // nuevo, porque el archivo no trae esa columna). Así "Costo S/IVA"
      // termina mostrando exactamente el valor que trae el archivo.
      //
      // Un producto real nunca cuesta $0, así que una fila con Costo en 0
      // se trata igual que una fila sin la columna: se preserva el costo
      // que ya tenía el producto en vez de pisarlo con 0. Sin esto, un
      // archivo que solo tiene el costo cargado para algunos productos (el
      // resto en 0 porque nadie lo completó todavía) borraría el costo real
      // de todos los demás al reimportarlo (bug real: pasó exactamente
      // esto).
      const ivaRate = existing?.iva_rate ?? DEFAULT_IVA_RATE;
      const costText = record.cost?.trim();
      const costWithoutIva = costText ? parseFlexibleNumber(costText) : 0;
      const cost =
        costWithoutIva > 0
          ? costWithoutIva * (1 + ivaRate / 100)
          : (existing?.cost ?? 0);

      // Publicado es opcional igual que unidad de negocio/categoría: si el
      // archivo no trae la columna (o la fila la deja vacía), se preserva
      // el valor que ya tenía el producto (o queda sin publicar si es
      // nuevo), en vez de despublicar todo el catálogo cada vez que se
      // sube un archivo que no incluye esa columna (ej. una actualización
      // de stock).
      // `normalizeHeader` saca tildes y pasa a minúscula igual que para
      // los encabezados: "Sí" (como lo exporta esta misma app) no
      // matcheaba contra el "si" sin tilde de TRUTHY_WEB_VALUES, así que
      // toda fila con "Sí" se importaba como no publicada (bug real).
      const webText = record.is_web ? normalizeHeader(record.is_web) : "";
      const isWeb = webText
        ? TRUTHY_WEB_VALUES.has(webText)
        : (existing?.is_web ?? false);

      validRows.push({
        sku,
        description,
        cost,
        price_cash: parseFlexibleNumber(record.price_cash),
        price_web: parseFlexibleNumber(record.price_web ?? ""),
        stock: Math.round(parseFlexibleNumber(record.stock ?? "")),
        is_web: isWeb,
        business_unit_id: businessUnitId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
      });
    } catch (err) {
      skipped.push({
        row: rowNumber,
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

  const created = validRows.filter((r) => !existingBySku.has(r.sku)).length;
  const updated = validRows.length - created;

  // Los chunks se insertan en tandas concurrentes (no todos a la vez, para
  // no saturar el pool de conexiones de Supabase) para que catálogos de
  // varios miles de filas terminen antes del límite de tiempo de la
  // función serverless.
  const CHUNK_SIZE = 500;
  const chunks: (typeof validRows)[] = [];
  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    chunks.push(validRows.slice(i, i + CHUNK_SIZE));
  }

  const UPSERT_CONCURRENCY = 5;
  for (let i = 0; i < chunks.length; i += UPSERT_CONCURRENCY) {
    const batch = chunks.slice(i, i + UPSERT_CONCURRENCY);
    const results = await Promise.all(
      batch.map((chunk) =>
        supabase.from("products").upsert(chunk, { onConflict: "sku" })
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      return {
        ok: false,
        message: `Error al guardar productos: ${failed.error.message}`,
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
