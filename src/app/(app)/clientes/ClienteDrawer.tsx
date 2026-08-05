"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Mail, Plus, Pencil } from "lucide-react";
import Drawer from "@/components/ds/Drawer";
import Badge from "@/components/ds/Badge";
import Avatar from "@/components/ds/Avatar";
import { formatCurrency } from "@/lib/currency";
import { clienteStatusLabel, clienteStatusTone } from "./clienteStatus";
import { getClienteQuickView, type ClienteQuickView } from "./queries";
import type { ClienteTableRow } from "./ClientesTable";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-mh-ink-muted">{label}</p>
      <p className="text-sm font-medium text-mh-ink">{value}</p>
    </div>
  );
}

function DisabledAction({
  icon: Icon,
  label,
}: {
  icon: typeof Plus;
  label: string;
}) {
  return (
    <button
      disabled
      title="Próximamente: requiere datos que hoy no existen en el sistema"
      className="flex items-center justify-center gap-1.5 rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink-muted opacity-50"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

export default function ClienteDrawer({
  cliente,
  onClose,
}: {
  cliente: ClienteTableRow | null;
  onClose: () => void;
}) {
  // Igual patrón que SupplierDrawer: se guarda junto al nombre del
  // cliente (en vez de resetear a null al cambiar `cliente`) para no
  // llamar setState de forma síncrona dentro del efecto.
  const [quickView, setQuickView] = useState<{ name: string; data: ClienteQuickView } | null>(
    null
  );

  useEffect(() => {
    if (!cliente) return;
    let cancelled = false;
    getClienteQuickView(cliente.customer_name).then((data) => {
      if (!cancelled) setQuickView({ name: cliente.customer_name, data });
    });
    return () => {
      cancelled = true;
    };
  }, [cliente]);

  const currentQuickView =
    cliente && quickView?.name === cliente.customer_name ? quickView.data : null;

  const avgTicket = cliente && cliente.line_count > 0 ? cliente.total_ars / cliente.line_count : 0;

  return (
    <Drawer open={cliente !== null} onClose={onClose}>
      {cliente && (
        <>
          <div className="flex items-start gap-4 border-b border-mh-border p-6">
            <Avatar name={cliente.customer_name} size={56} />
            <div className="min-w-0 flex-1 pr-8">
              <p className="truncate text-lg font-extrabold text-mh-ink">
                {cliente.customer_name}
              </p>
              <p className="text-sm text-mh-ink-muted">Cliente desde {cliente.first_sale_date}</p>
              <div className="mt-2">
                <Badge tone={clienteStatusTone(cliente.status)}>
                  {clienteStatusLabel(cliente.status)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Última compra" value={cliente.last_sale_date} />
              <Field label="Cantidad de compras" value={String(cliente.visit_count)} />
              <Field label="Facturación total (ARS)" value={formatCurrency(cliente.total_ars)} />
              <Field label="Facturación total (USD)" value={formatCurrency(cliente.total_usd, "usd")} />
              <Field label="Ticket promedio" value={formatCurrency(avgTicket)} />
              <Field label="Líneas de venta" value={String(cliente.line_count)} />
            </div>

            <div className="border-t border-mh-border pt-4">
              <p className="mb-2 text-sm font-bold text-mh-ink">Historial reciente</p>
              {!currentQuickView ? (
                <p className="text-sm text-mh-ink-muted">Cargando...</p>
              ) : currentQuickView.recentSales.length === 0 ? (
                <p className="text-sm text-mh-ink-muted">Sin ventas registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {currentQuickView.recentSales.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate text-mh-ink">
                        {s.product_description_raw}
                      </span>
                      <span className="shrink-0 font-semibold text-mh-ink">
                        {formatCurrency(s.subtotal_with_iva)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-mh-border pt-4">
              <p className="mb-2 text-sm font-bold text-mh-ink">Productos más comprados</p>
              {!currentQuickView ? (
                <p className="text-sm text-mh-ink-muted">Cargando...</p>
              ) : currentQuickView.topProducts.length === 0 ? (
                <p className="text-sm text-mh-ink-muted">Sin productos registrados.</p>
              ) : (
                <ul className="space-y-2">
                  {currentQuickView.topProducts.map((p) => (
                    <li key={p.description} className="min-w-0 text-sm">
                      <p className="truncate font-medium text-mh-ink">{p.description}</p>
                      <p className="text-xs text-mh-ink-muted">
                        {p.quantity} unidad(es) · {formatCurrency(p.total_ars)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-mh-border p-6">
            <div className="grid grid-cols-2 gap-2">
              <DisabledAction icon={Plus} label="Nueva venta" />
              <DisabledAction icon={Pencil} label="Editar cliente" />
              <DisabledAction icon={MessageCircle} label="Enviar WhatsApp" />
              <DisabledAction icon={Mail} label="Enviar Email" />
            </div>
            <Link
              href={`/clientes?customer=${encodeURIComponent(cliente.customer_name)}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark"
            >
              Ver historial completo <ArrowRight size={14} />
            </Link>
          </div>
        </>
      )}
    </Drawer>
  );
}
