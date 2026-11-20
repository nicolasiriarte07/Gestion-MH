import type { ContactCategory, ContactStage } from "@/lib/types";

export const STAGE_LABELS: Record<ContactStage, string> = {
  lead: "Lead",
  contactado: "Contactado",
  cotizado: "Cotizado",
  cliente: "Cliente",
  perdido: "Perdido",
};

export const STAGE_TONE_CLASSES: Record<ContactStage, string> = {
  lead: "bg-slate-100 text-slate-600",
  contactado: "bg-mh-blue-light text-mh-blue",
  cotizado: "bg-amber-100 text-amber-700",
  cliente: "bg-emerald-100 text-emerald-700",
  perdido: "bg-red-100 text-red-700",
};

// Mensaje genérico por rubro, para cuando el contacto todavía no tiene
// cargado un "equipo de interés" puntual.
const CATEGORY_INTEREST_HINT: Record<ContactCategory, string> = {
  "Carnicería": "equipamiento para la carnicería (balanzas, peladoras, exhibidoras)",
  "Panadería": "equipamiento para la panadería (hornos, sobadoras, exhibidoras)",
  Restaurant: "equipamiento para el local (cocinas, freezers, exhibidoras)",
  "Almacén": "equipamiento para el almacén (balanzas, heladeras, exhibidoras)",
  Supermercado: "equipamiento para el supermercado (balanzas, exhibidoras, freezers)",
  Otro: "el equipamiento que estabas necesitando",
};

// Nunca se manda sola: siempre queda como texto prellenado en wa.me, el
// usuario la revisa/edita y aprieta enviar él mismo desde WhatsApp.
export function suggestedWhatsAppMessage(contact: {
  category: ContactCategory;
  equipo_interes: string | null;
}): string {
  const topic = contact.equipo_interes?.trim() || CATEGORY_INTEREST_HINT[contact.category];
  return `Hola! Te escribe Nico de MH Equipamientos. Te quería consultar cómo seguís con lo de ${topic}.`;
}
