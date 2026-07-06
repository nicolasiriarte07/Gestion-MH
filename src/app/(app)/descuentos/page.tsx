import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import DescuentosSimulator from "./DescuentosSimulator";

export default async function DescuentosPage() {
  const supabase = await createClient();

  // Solo entran productos con Costo cargado (> 0): sin costo no se puede
  // calcular ganancia neta real, solo un número inventado.
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .gt("cost", 0)
    .order("description");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Descuentos</h1>
        <p className="text-sm text-slate-500">
          Probá un % de descuento y mirá la ganancia neta resultante por
          producto, en cada medio de pago, para saber hasta cuánto podés
          descontar.
        </p>
      </div>
      <DescuentosSimulator products={(products ?? []) as Product[]} />
    </div>
  );
}
