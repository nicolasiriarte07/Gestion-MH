import { genericSiteSearch } from "./fetchHtml";
import type { CompetitorSearchResult } from "./types";

// URL de búsqueda sin confirmar contra el sitio real (no hay acceso a
// internet desde este entorno de desarrollo, ver nota en el plan) —
// ajustar acá si no trae resultados una vez probado en producción.
export async function search(query: string): Promise<CompetitorSearchResult | null> {
  const url = `https://www.fravega.com/l/?keyword=${encodeURIComponent(query)}`;
  return genericSiteSearch(url);
}
