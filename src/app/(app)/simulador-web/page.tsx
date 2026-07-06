import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import SimuladorWeb from "./SimuladorWeb";

export default async function SimuladorWebPage() {
  const supabase = await createClient();
  const { data: products } = await fetchAllRows<{
    cost: number;
    price_web: number;
  }>((from, to) =>
    supabase
      .from("products")
      .select("cost, price_web")
      .order("id")
      .range(from, to)
  );

  // Mismo criterio que el COGS promedio de Inventario: solo productos con
  // Costo y P. Web cargados (> 0) cuentan para el promedio.
  const withCompleteMetrics = products.filter(
    (p) => p.cost > 0 && p.price_web > 0
  );
  const cogsValues = withCompleteMetrics.map((p) => p.cost / p.price_web);
  const avgCogsPct = cogsValues.length
    ? (cogsValues.reduce((sum, n) => sum + n, 0) / cogsValues.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Simulador Web
        </h1>
        <p className="text-sm text-slate-500">
          Simulá la rentabilidad de una venta por la web según el medio de
          pago elegido.
        </p>
      </div>
      <SimuladorWeb defaultCogsPct={avgCogsPct} />
    </div>
  );
}
