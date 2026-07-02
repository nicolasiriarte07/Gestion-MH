import type ExcelJS from "exceljs";

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

// Parsea números que pueden venir en formato es-AR ("1.234,56") o
// internacional ("1,234.56"), según cuál separador aparezca último (ese es
// el decimal; el otro, si aparece, es de miles y se descarta).
export function cellNumber(cell: ExcelJS.Cell | undefined): number {
  const raw = cellText(cell);
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
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
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
