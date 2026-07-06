import type { CompetitorSearchResult } from "./types";

// MercadoLibre tiene una API pública oficial de búsqueda, sin necesidad
// de autenticación ni de leer HTML — la fuente más confiable de las 7.
// https://developers.mercadolibre.com.ar/es_ar/items-y-busquedas
export async function search(query: string): Promise<CompetitorSearchResult | null> {
  try {
    const url = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const item = data?.results?.[0];
    if (!item) return null;

    const price = Number(item.price);
    if (!Number.isFinite(price) || price <= 0) return null;

    return {
      title: String(item.title ?? ""),
      url: String(item.permalink ?? "https://www.mercadolibre.com.ar"),
      price,
    };
  } catch {
    return null;
  }
}
