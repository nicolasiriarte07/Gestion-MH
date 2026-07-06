import type { CompetitorSearchResult } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPriceFromOffers(offers: any): number | null {
  if (!offers) return null;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const raw = offer?.price ?? offer?.lowPrice;
  const price = Number(raw);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function resolveUrl(url: string | undefined, baseUrl: string): string {
  if (!url) return baseUrl;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasType(node: any, type: string): boolean {
  const t = node?.["@type"];
  return t === type || (Array.isArray(t) && t.includes(type));
}

// La gran mayoría de los e-commerce (armados en Magento, VTEX, Tiendanube,
// etc.) incluyen datos estructurados JSON-LD (schema.org Product/Offer)
// en el HTML para que Google los indexe, aunque la parte visual de la
// página se arme con JavaScript. Esta es la fuente más confiable de
// precio/nombre/link, y funciona igual sin necesidad de renderizar la
// página con un navegador.
export function extractFirstProductFromJsonLd(
  html: string,
  baseUrl: string
): CompetitorSearchResult | null {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: any[] = Array.isArray(parsed)
      ? parsed
      : ((parsed as Record<string, unknown>)?.["@graph"] as unknown[]) ?? [parsed];

    for (const node of nodes) {
      if (hasType(node, "Product")) {
        const price = extractPriceFromOffers(node.offers);
        if (price !== null) {
          return {
            title: String(node.name ?? ""),
            url: resolveUrl(node.url, baseUrl),
            price,
          };
        }
      }

      if (hasType(node, "ItemList") && Array.isArray(node.itemListElement)) {
        for (const el of node.itemListElement) {
          const item = el?.item ?? el;
          if (hasType(item, "Product")) {
            const price = extractPriceFromOffers(item.offers);
            if (price !== null) {
              return {
                title: String(item.name ?? ""),
                url: resolveUrl(item.url, baseUrl),
                price,
              };
            }
          }
        }
      }
    }
  }

  return null;
}

// Respaldo si el sitio no trae JSON-LD: metaetiquetas Open Graph del tipo
// "product" (product:price:amount / og:title), otra convención bastante
// extendida y más confiable que buscar un precio suelto en el texto
// visible de la página.
export function extractFromOpenGraph(
  html: string,
  baseUrl: string
): CompetitorSearchResult | null {
  const metaTag = (property: string): string | null => {
    const match = html.match(
      new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    );
    return match?.[1] ?? null;
  };

  const priceRaw =
    metaTag("product:price:amount") ?? metaTag("og:price:amount");
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price <= 0) return null;

  const title = metaTag("og:title") ?? "";
  const url = metaTag("og:url") ?? baseUrl;

  return { title, url: resolveUrl(url, baseUrl), price };
}
