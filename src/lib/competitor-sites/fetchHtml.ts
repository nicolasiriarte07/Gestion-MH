import { extractFirstProductFromJsonLd, extractFromOpenGraph } from "./jsonld";
import type { CompetitorSearchResult } from "./types";

// Algunos sitios bloquean pedidos sin pinta de navegador; un User-Agent
// común reduce ese riesgo (no lo elimina).
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 8000;

async function fetchHtml(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Pide la URL de búsqueda del sitio y extrae el primer producto que
// encuentre (JSON-LD primero, Open Graph como respaldo). Nunca tira
// error: si algo falla, devuelve null y quien llama lo trata como "no
// encontrado" en vez de romper la búsqueda de los demás sitios.
export async function genericSiteSearch(
  searchUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<CompetitorSearchResult | null> {
  try {
    const html = await fetchHtml(searchUrl, timeoutMs);
    return (
      extractFirstProductFromJsonLd(html, searchUrl) ??
      extractFromOpenGraph(html, searchUrl)
    );
  } catch {
    return null;
  }
}
