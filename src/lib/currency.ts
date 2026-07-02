const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export type Currency = "ars" | "usd";

export function formatCurrency(value: number, currency: Currency = "ars"): string {
  return currency === "usd" ? usdFormatter.format(value) : arsFormatter.format(value);
}
