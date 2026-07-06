import type { CompetitorSearchResult, CompetitorSiteKey } from "./types";
import { search as mercadolibre } from "./mercadolibre";
import { search as fravega } from "./fravega";
import { search as hendel } from "./hendel";
import { search as musimundo } from "./musimundo";
import { search as casaSilvia } from "./casaSilvia";
import { search as casaCarlitos } from "./casaCarlitos";
import { search as casaDelAudio } from "./casaDelAudio";

export type { CompetitorSearchResult, CompetitorSiteKey } from "./types";

export const COMPETITOR_SEARCHERS: Record<
  CompetitorSiteKey,
  (query: string) => Promise<CompetitorSearchResult | null>
> = {
  mercadolibre,
  fravega,
  hendel,
  musimundo,
  casa_silvia: casaSilvia,
  casa_carlitos: casaCarlitos,
  casa_del_audio: casaDelAudio,
};
