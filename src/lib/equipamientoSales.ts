import type { EquipamientoSale } from "./types";

// Ventas en cuotas (tienen cuota_semanal cargada): lo que falta es el
// monto total menos la entrega inicial y las cuotas ya pagadas, nunca
// negativo. Ventas no cuotificadas: si no están cobradas, el saldo es
// el monto completo; si ya están cobradas, no queda nada pendiente.
export function outstandingBalance(sale: EquipamientoSale): number {
  if (sale.cuota_semanal != null && sale.cuota_semanal > 0) {
    const remaining =
      sale.monto - sale.entrega_inicial - sale.semanas_pagadas * sale.cuota_semanal;
    return Math.max(0, remaining);
  }
  return sale.cobrado ? 0 : sale.monto;
}
