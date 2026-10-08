// wa.me necesita el número en formato internacional sin "+" ni espacios.
// Si el teléfono cargado no tiene código de país (lo más común: se tipea
// el número local tal cual, ej. "341-555-1234"), se asume Argentina y se
// le agrega "549" adelante — el "9" es el prefijo que WhatsApp pide para
// celulares argentinos, sin él el link no abre el chat correctamente.
export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("54") ? digits : `549${digits}`;
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
