export type PaymentStatus = "pagado" | "pendiente" | "parcial";

// El estado de pago se deriva de amount_paid vs. el total del pedido
// (no se guarda aparte, para que nunca quede desincronizado de los
// montos reales).
export function paymentStatus(totalAmount: number, amountPaid: number): PaymentStatus {
  if (totalAmount <= 0 || amountPaid <= 0) return "pendiente";
  if (amountPaid >= totalAmount) return "pagado";
  return "parcial";
}

export function paymentBalance(totalAmount: number, amountPaid: number): number {
  return Math.max(0, totalAmount - amountPaid);
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  parcial: "Parcial",
};

export const PAYMENT_STATUS_TONE_CLASSES: Record<PaymentStatus, string> = {
  pagado: "bg-emerald-100 text-emerald-700",
  pendiente: "bg-red-100 text-red-700",
  parcial: "bg-amber-100 text-amber-700",
};

// payment_type es texto libre (no hay un enum rígido en la base): se
// colorean los valores más comunes y cualquier otro texto cae en gris
// neutro, sin romper nada si el usuario escribe algo distinto.
const PAYMENT_TYPE_TONE_CLASSES: Record<string, string> = {
  contado: "bg-mh-blue-light text-mh-blue",
  "contado anticipado": "bg-violet-100 text-violet-700",
  "cuenta corriente": "bg-amber-100 text-amber-700",
  "contra entrega": "bg-mh-pink-light text-mh-pink",
  transferencia: "bg-emerald-100 text-emerald-700",
  cheque: "bg-slate-200 text-slate-700",
};

export function paymentTypeToneClass(paymentType: string | null): string {
  if (!paymentType) return "bg-slate-100 text-slate-600";
  return PAYMENT_TYPE_TONE_CLASSES[paymentType.trim().toLowerCase()] ?? "bg-slate-100 text-slate-600";
}
