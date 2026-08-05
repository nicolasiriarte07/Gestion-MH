"use client";

import { useMemo, useState } from "react";
import { Users, UserPlus, UserCheck, Wallet, Receipt } from "lucide-react";
import KpiCard from "@/components/ds/KpiCard";
import { formatCurrency } from "@/lib/currency";
import ClienteFilterBar, { type ClienteSort } from "./ClienteFilterBar";
import ClientesTable, { type ClienteTableRow } from "./ClientesTable";
import ClientesToolbar from "./ClientesToolbar";
import ClientesBottomDashboard, {
  type InactiveClienteRow,
  type MovementRow,
} from "./ClientesBottomDashboard";
import type { ClienteStatus } from "./aggregate";

export default function ClientesView({
  rows,
  totalCount,
  newThisMonth,
  activeCount,
  revenueThisMonth,
  avgTicket,
  topClientes,
  inactiveClientes,
  movements,
}: {
  rows: ClienteTableRow[];
  totalCount: number;
  newThisMonth: number;
  activeCount: number;
  revenueThisMonth: number;
  avgTicket: number;
  topClientes: { label: string; value: number }[];
  inactiveClientes: InactiveClienteRow[];
  movements: MovementRow[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClienteStatus | "">("");
  const [sort, setSort] = useState<ClienteSort>("facturacion");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter((r) => r.customer_name.toLowerCase().includes(needle));
    }
    if (status) {
      result = result.filter((r) => r.status === status);
    }
    result = [...result].sort((a, b) => {
      if (sort === "nombre") return a.customer_name.localeCompare(b.customer_name);
      if (sort === "ultima_compra") return b.last_sale_date.localeCompare(a.last_sale_date);
      return b.total_ars - a.total_ars;
    });
    return result;
  }, [rows, search, status, sort]);

  function toggleSelect(name: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleSelectAll(names: string[]) {
    setSelectedIds((prev) => {
      const allSelected = names.every((n) => prev.has(n));
      const next = new Set(prev);
      if (allSelected) {
        names.forEach((n) => next.delete(n));
      } else {
        names.forEach((n) => next.add(n));
      }
      return next;
    });
  }

  const selectedRows = rows.filter((r) => selectedIds.has(r.customer_name));

  return (
    <div className="font-inter space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={Users} tone="pink" label="Clientes totales" value={String(totalCount)} />
        <KpiCard icon={UserPlus} tone="blue" label="Clientes nuevos este mes" value={String(newThisMonth)} />
        <KpiCard icon={UserCheck} tone="blue-light" label="Clientes activos" value={String(activeCount)} />
        <KpiCard
          icon={Wallet}
          tone="pink"
          label="Facturación por clientes"
          value={formatCurrency(revenueThisMonth)}
          sublabel="este mes"
        />
        <KpiCard icon={Receipt} tone="gray" label="Ticket promedio" value={formatCurrency(avgTicket)} />
      </div>

      <ClientesToolbar selectedRows={selectedRows} allRows={rows} />

      <ClienteFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        onClear={() => {
          setSearch("");
          setStatus("");
          setSort("facturacion");
        }}
      />

      <ClientesTable
        rows={filteredRows}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      <ClientesBottomDashboard
        topClientes={topClientes}
        inactiveClientes={inactiveClientes}
        movements={movements}
      />
    </div>
  );
}
