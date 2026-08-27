"use client";

import { useMemo, useState } from "react";
import { Wallet, Hash, CheckCircle2, Truck } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";
import type { EquipamientoSale, SalePaymentMethod } from "@/lib/types";
import SalesHeader from "./SalesHeader";
import SalesFilterBar, { type EstadoFilter } from "./SalesFilterBar";
import SalesTable from "./SalesTable";

export default function SalesView({ rows }: { rows: EquipamientoSale[] }) {
  const [search, setSearch] = useState("");
  const [metodo, setMetodo] = useState<SalePaymentMethod | "">("");
  const [estado, setEstado] = useState<EstadoFilter>("");

  const categoryOptions = useMemo(
    () => [...new Set(rows.map((r) => r.categoria).filter((c): c is string => !!c))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.cliente.toLowerCase().includes(needle) ||
          (r.comercio ?? "").toLowerCase().includes(needle) ||
          r.producto.toLowerCase().includes(needle)
      );
    }
    if (metodo) result = result.filter((r) => r.metodo_pago === metodo);
    if (estado === "cobrado") result = result.filter((r) => r.cobrado);
    if (estado === "pendiente") result = result.filter((r) => !r.cobrado);
    return result;
  }, [rows, search, metodo, estado]);

  const totalVentas = rows.reduce((sum, r) => sum + r.monto, 0);
  const cantidad = rows.length;
  const cobradas = rows.filter((r) => r.cobrado).length;
  const entregadas = rows.filter((r) => r.entregado).length;

  return (
    <div className="font-inter space-y-8">
      <SalesHeader categoryOptions={categoryOptions} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} tone="pink" label="Total ventas" value={formatCurrency(totalVentas)} />
        <KpiCard icon={Hash} tone="blue" label="Cantidad" value={String(cantidad)} />
        <KpiCard icon={CheckCircle2} tone="blue-light" label="Cobradas" value={String(cobradas)} />
        <KpiCard icon={Truck} tone="amber" label="Entregadas" value={String(entregadas)} />
      </div>

      <SalesFilterBar
        search={search}
        onSearchChange={setSearch}
        metodo={metodo}
        onMetodoChange={setMetodo}
        estado={estado}
        onEstadoChange={setEstado}
        onClear={() => {
          setSearch("");
          setMetodo("");
          setEstado("");
        }}
      />

      <SalesTable rows={filteredRows} categoryOptions={categoryOptions} />
    </div>
  );
}
