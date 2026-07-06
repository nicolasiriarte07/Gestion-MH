import type { PostgrestError } from "@supabase/supabase-js";

// Supabase (PostgREST) devuelve como máximo 1000 filas por consulta sin
// importar cuántas haya en la tabla ("Max Rows" del proyecto). Con más de
// 1000 productos en el catálogo, un `select("*")` sin paginar se corta en
// seco y todo lo que dependa del resultado (KPIs, tabla, gráficos) queda
// mal calculado. Esto pagina automáticamente hasta traer todas las filas.
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  makeQuery: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await makeQuery(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: all, error: null };
}
