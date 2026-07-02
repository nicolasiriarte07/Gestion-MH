// Similaridad de texto simple (coeficiente de Dice sobre bigramas de
// caracteres) para sugerir a qué producto del inventario corresponde una
// descripción de venta histórica. No requiere llamadas a la base de datos:
// se calcula en memoria contra la lista de productos ya cargada.

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function bigrams(text: string): Map<string, number> {
  const normalized = normalize(text);
  const counts = new Map<string, number>();
  for (let i = 0; i < normalized.length - 1; i++) {
    const gram = normalized.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

export function similarity(a: string, b: string): number {
  const gramsA = bigrams(a);
  const gramsB = bigrams(b);

  const totalA = [...gramsA.values()].reduce((s, n) => s + n, 0);
  const totalB = [...gramsB.values()].reduce((s, n) => s + n, 0);
  if (totalA === 0 || totalB === 0) return 0;

  let overlap = 0;
  for (const [gram, countA] of gramsA) {
    const countB = gramsB.get(gram);
    if (countB) overlap += Math.min(countA, countB);
  }

  return (2 * overlap) / (totalA + totalB);
}

export function bestMatch<T>(
  query: string,
  candidates: T[],
  getLabel: (item: T) => string
): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  for (const item of candidates) {
    const score = similarity(query, getLabel(item));
    if (!best || score > best.score) best = { item, score };
  }
  return best;
}
