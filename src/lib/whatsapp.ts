// Los teléfonos se cargan a mano con todo tipo de formato local
// ("02914 15-412345", "291 4123456", "+54 9 291 412-3456", etc.). Esta
// función siempre devuelve 549 + código de área + número, pelado, que es
// lo que wa.me necesita para abrir el chat de un celular argentino.
export function normalizeArgentinePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  // Código de país: si ya viene con 54 (con o sin el 9 de celular) se
  // saca para no duplicarlo, porque siempre se vuelve a agregar al final.
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }

  // Prefijo de larga distancia local ("0" adelante del código de área).
  if (digits.startsWith("0")) digits = digits.slice(1);

  // El "15" de celular va pegado al código de área (ej. "2914 15-123456"),
  // nunca al principio del todo. No hay forma de saber de antemano si el
  // área tiene 2, 3 o 4 dígitos, así que se prueba de más a menos
  // específico y se saca el primer "15" que aparezca ahí.
  for (const areaLength of [4, 3, 2]) {
    if (digits.slice(areaLength, areaLength + 2) === "15") {
      digits = digits.slice(0, areaLength) + digits.slice(areaLength + 2);
      break;
    }
  }

  return `549${digits}`;
}

export function buildWhatsAppLink(phone: string, message?: string): string {
  const intl = normalizeArgentinePhone(phone);
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
