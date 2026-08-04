import type { BadgeTone } from "@/components/ds/Badge";

// Mismos 3 estados en toda la pantalla (tabla, drawer, filtro "Estado"):
// 0 = sin stock, 1 = stock bajo, 2+ = en stock.
export function stockTone(stock: number): BadgeTone {
  if (stock <= 0) return "red";
  if (stock === 1) return "amber";
  return "green";
}

export function stockLabel(stock: number): string {
  if (stock <= 0) return "Sin stock";
  if (stock === 1) return "Stock bajo";
  return "En stock";
}

export function stockTextClass(stock: number): string {
  if (stock <= 0) return "text-red-600";
  if (stock === 1) return "text-amber-600";
  return "text-emerald-600";
}
