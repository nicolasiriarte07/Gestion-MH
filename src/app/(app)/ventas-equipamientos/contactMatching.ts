import type { EquipamientoContact, EquipamientoSale } from "@/lib/types";

export type MatchLevel = "exacta" | "parecida" | "sin_match";

export type SaleMatch = {
  contact: EquipamientoContact | null;
  level: MatchLevel;
  score: number;
};

// Sin tildes, sin mayúsculas, sin espacios — para que "Juan Pérez",
// "juan perez" y "Juan  Pérez " comparen igual.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// Distancia de Levenshtein clásica, con la fila anterior achicada a un
// solo array (no hace falta la matriz completa para este tamaño de
// textos).
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prevRow = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let diagonal = prevRow[0];
    prevRow[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const temp = prevRow[i];
      prevRow[i] =
        a[i - 1] === b[j - 1]
          ? diagonal
          : 1 + Math.min(diagonal, prevRow[i - 1], prevRow[i]);
      diagonal = temp;
    }
  }
  return prevRow[a.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

const PARECIDA_THRESHOLD = 0.6;

// Compara cliente/comercio de la venta contra nombre/comercio de cada
// contacto (las 4 combinaciones) y se queda con la mejor coincidencia
// de todo el padrón de contactos.
export function matchContactForSale(
  sale: Pick<EquipamientoSale, "cliente" | "comercio">,
  contacts: EquipamientoContact[]
): SaleMatch {
  const clienteN = normalize(sale.cliente);
  const comercioN = sale.comercio ? normalize(sale.comercio) : null;

  let best: { contact: EquipamientoContact; score: number } | null = null;

  for (const contact of contacts) {
    const nameN = normalize(contact.name);
    const bizN = contact.business_name ? normalize(contact.business_name) : null;

    const scores = [similarity(clienteN, nameN)];
    if (bizN) scores.push(similarity(clienteN, bizN));
    if (comercioN) {
      scores.push(similarity(comercioN, nameN));
      if (bizN) scores.push(similarity(comercioN, bizN));
    }

    const score = Math.max(...scores);
    if (!best || score > best.score) best = { contact, score };
  }

  if (!best || best.score < PARECIDA_THRESHOLD) {
    return { contact: null, level: "sin_match", score: best?.score ?? 0 };
  }
  if (best.score >= 0.999) {
    return { contact: best.contact, level: "exacta", score: best.score };
  }
  return { contact: best.contact, level: "parecida", score: best.score };
}
