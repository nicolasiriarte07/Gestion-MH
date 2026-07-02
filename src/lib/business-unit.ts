// Alias conocidos para nombres de unidad de negocio que vienen de archivos
// reales con variantes de orden/redacción (ej. "MH Equipamientos" en vez de
// "EQUIPAMIENTOS MH").
const BUSINESS_UNIT_ALIASES: Record<string, string> = {
  "mh equipamientos": "equipamientos mh",
};

export function resolveBusinessUnitId(
  rawName: string | undefined | null,
  businessUnitByName: Map<string, string>
): string | undefined {
  const normalized = rawName?.trim().toLowerCase();
  if (!normalized) return undefined;

  const direct = businessUnitByName.get(normalized);
  if (direct) return direct;

  const alias = BUSINESS_UNIT_ALIASES[normalized];
  return alias ? businessUnitByName.get(alias) : undefined;
}
