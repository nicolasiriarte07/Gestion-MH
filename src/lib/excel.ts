import type ExcelJS from "exceljs";

// Algunas planillas que llegan del negocio (ej. exportadas desde Excel con
// configuración regional es-AR) no vienen en UTF-8 sino en Windows-1252/
// ISO-8859-1, y usan punto y coma como separador en vez de coma. Si no se
// detecta esto, los acentos quedan corruptos y las columnas no se separan.
export function decodeCsvBuffer(buffer: Buffer): Buffer {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return Buffer.from(text, "utf-8");
  } catch {
    const text = buffer.toString("latin1");
    return Buffer.from(text, "utf-8");
  }
}

export function detectCsvDelimiter(buffer: Buffer): string {
  const firstLine = buffer.toString("utf-8", 0, 2000).split(/\r?\n/)[0] ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

// Por defecto, exceljs convierte cualquier celda de CSV con pinta de
// número a un `Number` de JS (ej. "929.000" -> 929, perdiendo los 3 ceros;
// "390.880" -> 390.88). Como los precios vienen con formato es-AR (punto
// de miles), esto corrompe silenciosamente cualquier precio "redondo" en
// miles. Con este `map` las celdas quedan como texto tal cual vienen, y es
// `parseFlexibleNumber` el único que decide cómo interpretar el número.
export function csvKeepAsText(value: string): string | null {
  return value === "" ? null : value;
}

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  const value = cell.value;

  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if ("richText" in value) {
      return (value.richText as { text: string }[])
        .map((t) => t.text)
        .join("")
        .trim();
    }
    // Celdas con fórmula (comunes en planillas exportadas de Google Sheets):
    // ExcelJS expone el último valor calculado en `.result`.
    if ("result" in value) {
      const result = (value as { result: unknown }).result;
      if (result instanceof Date) return result.toISOString();
      return result === null || result === undefined
        ? ""
        : String(result).trim();
    }
    if ("text" in value) {
      return String((value as { text: unknown }).text).trim();
    }
  }

  return String(value).trim();
}

// Parsea números que pueden venir en formato es-AR ("1.234,56" o "$30.330",
// con punto de miles) o internacional ("1,234.56"), según cuál separador
// aparezca último (ese es el decimal; el otro, si aparece, es de miles y
// se descarta). Si aparece un solo tipo de separador y el grupo final
// tiene exactamente 3 dígitos, se asume separador de miles (precios en
// pesos casi nunca tienen 3 decimales) en vez de decimal.
export function parseFlexibleNumber(raw: string): number {
  if (!raw) return 0;

  const cleaned = raw.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized = cleaned;
  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastComma > -1) {
    const decimals = cleaned.length - lastComma - 1;
    normalized =
      decimals === 3 ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  } else if (lastDot > -1) {
    const decimals = cleaned.length - lastDot - 1;
    normalized = decimals === 3 ? cleaned.replace(/\./g, "") : cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function cellNumber(cell: ExcelJS.Cell | undefined): number {
  return parseFlexibleNumber(cellText(cell));
}

// Convierte la fecha de una celda a "yyyy-mm-dd" para la columna `date` de
// Postgres. Las planillas reales del negocio mezclan dos formatos en el
// mismo archivo: texto plano "dd/mm/yyyy" en filas más viejas, y celdas de
// fecha real de Excel (que `cellText` ya deja como ISO "yyyy-mm-ddT...") en
// las más nuevas.
export function parseArgentineDate(raw: string): string | null {
  const trimmed = raw.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0].slice(0, 10);

  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}
