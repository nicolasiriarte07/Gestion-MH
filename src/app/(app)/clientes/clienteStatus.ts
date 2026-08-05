import type { BadgeTone } from "@/components/ds/Badge";
import type { ClienteStatus } from "./aggregate";

// Paleta de badges restringida por el brief a verde/azul/amarillo/rojo/gris
// (sin rosa), una por estado.
const LABELS: Record<ClienteStatus, string> = {
  vip: "VIP",
  inactivo: "Inactivo",
  nuevo: "Nuevo",
  frecuente: "Frecuente",
  activo: "Activo",
};

const TONES: Record<ClienteStatus, BadgeTone> = {
  vip: "amber",
  inactivo: "red",
  nuevo: "blue",
  frecuente: "green",
  activo: "gray",
};

export function clienteStatusLabel(status: ClienteStatus): string {
  return LABELS[status];
}

export function clienteStatusTone(status: ClienteStatus): BadgeTone {
  return TONES[status];
}
