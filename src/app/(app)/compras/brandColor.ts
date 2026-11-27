// No hay logos cargados en brands: se arma un avatar con la inicial
// de la marca y un color fijo por marca (determinístico por nombre,
// nunca al azar), para distinguirlas de un vistazo en el tablero.
const BRAND_PALETTE = [
  "bg-mh-pink text-white",
  "bg-mh-blue text-white",
  "bg-emerald-600 text-white",
  "bg-amber-500 text-white",
  "bg-violet-600 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-600 text-white",
  "bg-slate-700 text-white",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function brandAvatarClass(brandName: string): string {
  return BRAND_PALETTE[hashString(brandName) % BRAND_PALETTE.length];
}

export function brandInitial(brandName: string): string {
  return brandName.trim().charAt(0).toUpperCase() || "?";
}
