import type { ContentType } from "@/lib/types";

export const CONTENT_LABELS: Record<ContentType, string> = {
  educacional: "Educacional",
  marca: "Marca",
  comercial: "Comercial",
};

// Mismos tonos que ya usaba la tabla de Orgánico (antes en clases
// slate/violet/blue "a mano"), ahora restringidos a la paleta del
// sistema de diseño nuevo.
export const CONTENT_TONE_CLASSES: Record<ContentType, string> = {
  educacional: "bg-mh-blue-light text-mh-blue",
  marca: "bg-mh-pink-light text-mh-pink",
  comercial: "bg-emerald-100 text-emerald-700",
};

export const VERTICAL_TONE_CLASSES: Record<string, string> = {
  "MUNDO HOGAR": "bg-mh-pink-light text-mh-pink",
  "EQUIPAMIENTOS MH": "bg-mh-blue-light text-mh-blue",
};
