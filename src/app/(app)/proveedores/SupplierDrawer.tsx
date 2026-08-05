"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, FileText as FileIcon, ArrowRight } from "lucide-react";
import Drawer from "@/components/ds/Drawer";
import Badge from "@/components/ds/Badge";
import Avatar from "@/components/ds/Avatar";
import { formatCurrency } from "@/lib/currency";
import LedgerEntryModal from "./LedgerEntryModal";
import { getSupplierQuickView, type SupplierQuickView } from "./queries";
import type { SupplierRow } from "./SuppliersTable";

const PAYMENT_LABELS: { key: keyof SupplierRow; label: string }[] = [
  { key: "payment_cash", label: "Contado" },
  { key: "payment_7d", label: "7 días" },
  { key: "payment_15d", label: "15 días" },
  { key: "payment_30d", label: "30 días" },
  { key: "payment_60d", label: "60 días" },
  { key: "payment_transfer", label: "Transferencia" },
  { key: "payment_check", label: "Cheque" },
  { key: "payment_card", label: "Tarjeta" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-mh-ink-muted">{label}</p>
      <p className="text-sm font-medium text-mh-ink">{value}</p>
    </div>
  );
}

export default function SupplierDrawer({
  supplier,
  onClose,
}: {
  supplier: SupplierRow | null;
  onClose: () => void;
}) {
  // Se guarda junto al id del proveedor (en vez de resetear a null al
  // cambiar `supplier`) para no llamar a setState de forma síncrona
  // dentro del efecto: mientras se carga el próximo, se sigue mostrando
  // "Cargando..." derivándolo de que el id no coincide todavía.
  const [quickView, setQuickView] = useState<{ supplierId: string; data: SupplierQuickView } | null>(
    null
  );
  const [ledgerModal, setLedgerModal] = useState<"compra" | "pago" | null>(null);

  useEffect(() => {
    if (!supplier) return;
    let cancelled = false;
    getSupplierQuickView(supplier.id).then((data) => {
      if (!cancelled) setQuickView({ supplierId: supplier.id, data });
    });
    return () => {
      cancelled = true;
    };
  }, [supplier]);

  const currentQuickView =
    supplier && quickView?.supplierId === supplier.id ? quickView.data : null;

  const paymentTerms = supplier
    ? PAYMENT_LABELS.filter((t) => supplier[t.key]).map((t) => t.label)
    : [];

  return (
    <>
      <Drawer open={supplier !== null} onClose={onClose}>
        {supplier && (
          <>
            <div className="flex items-start gap-4 border-b border-mh-border p-6">
              <Avatar name={supplier.trade_name} size={56} />
              <div className="min-w-0 flex-1 pr-8">
                <p className="truncate text-lg font-extrabold text-mh-ink">
                  {supplier.trade_name}
                </p>
                {supplier.legal_name && (
                  <p className="truncate text-sm text-mh-ink-muted">{supplier.legal_name}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={supplier.is_active ? "green" : "gray"}>
                    {supplier.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge tone={supplier.balance > 0 ? "red" : "green"}>
                    {supplier.balance > 0 ? "Con deuda" : "Al día"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="CUIT" value={supplier.cuit ?? "—"} />
                <Field label="Condición de IVA" value={supplier.vat_condition ?? "—"} />
                <Field label="Categoría" value={supplier.category ?? "—"} />
                <Field
                  label="Marca(s)"
                  value={supplier.brandNames.length > 0 ? supplier.brandNames.join(", ") : "—"}
                />
              </div>

              <div className="space-y-3 border-t border-mh-border pt-4">
                <p className="text-sm font-bold text-mh-ink">Contacto</p>
                {supplier.contact_name && (
                  <p className="text-sm font-medium text-mh-ink">
                    {supplier.contact_name}
                    {supplier.contact_role ? ` · ${supplier.contact_role}` : ""}
                  </p>
                )}
                {supplier.phone && (
                  <p className="flex items-center gap-2 text-sm text-mh-ink-muted">
                    <Phone size={14} /> {supplier.phone}
                  </p>
                )}
                {supplier.email && (
                  <p className="flex items-center gap-2 text-sm text-mh-ink-muted">
                    <Mail size={14} /> {supplier.email}
                  </p>
                )}
                {(supplier.address || supplier.city) && (
                  <p className="flex items-center gap-2 text-sm text-mh-ink-muted">
                    <MapPin size={14} />
                    {[supplier.address, supplier.city].filter(Boolean).join(", ")}
                  </p>
                )}
                {!supplier.contact_name && !supplier.phone && !supplier.email && !supplier.address && (
                  <p className="text-sm text-mh-ink-muted">Sin datos de contacto cargados.</p>
                )}
              </div>

              <div className="border-t border-mh-border pt-4">
                <p className="mb-1 text-sm font-bold text-mh-ink">Condiciones de pago</p>
                <p className="text-sm text-mh-ink-muted">
                  {paymentTerms.length > 0 ? paymentTerms.join(", ") : "Sin condiciones cargadas."}
                </p>
              </div>

              <div className="rounded-2xl border border-mh-border bg-mh-bg p-4">
                <p className="text-xs font-semibold text-mh-ink-muted">Saldo pendiente</p>
                <p
                  className={`text-2xl font-extrabold ${supplier.balance > 0 ? "text-red-600" : "text-mh-ink"}`}
                >
                  {formatCurrency(supplier.balance)}
                </p>
                <p className="mt-1 text-xs text-mh-ink-muted">
                  Última compra: {supplier.last_purchase_date ?? "sin compras"}
                </p>
              </div>

              <div className="border-t border-mh-border pt-4">
                <p className="mb-2 text-sm font-bold text-mh-ink">Últimas compras</p>
                {!currentQuickView ? (
                  <p className="text-sm text-mh-ink-muted">Cargando...</p>
                ) : currentQuickView.recentPurchases.length === 0 ? (
                  <p className="text-sm text-mh-ink-muted">Sin compras registradas.</p>
                ) : (
                  <ul className="space-y-2">
                    {currentQuickView.recentPurchases.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate text-mh-ink">{p.concept}</span>
                        <span className="shrink-0 font-semibold text-mh-ink">
                          {formatCurrency(p.debit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-mh-border pt-4">
                <p className="mb-2 text-sm font-bold text-mh-ink">Productos</p>
                {!currentQuickView ? (
                  <p className="text-sm text-mh-ink-muted">Cargando...</p>
                ) : currentQuickView.topProducts.length === 0 ? (
                  <p className="text-sm text-mh-ink-muted">Sin productos vinculados.</p>
                ) : (
                  <ul className="space-y-2">
                    {currentQuickView.topProducts.map((p) => (
                      <li key={p.id} className="min-w-0 text-sm">
                        <p className="truncate font-medium text-mh-ink">{p.description}</p>
                        <p className="text-xs text-mh-ink-muted">{p.sku}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-mh-border pt-4">
                <p className="mb-2 text-sm font-bold text-mh-ink">Historial de pagos</p>
                {!currentQuickView ? (
                  <p className="text-sm text-mh-ink-muted">Cargando...</p>
                ) : currentQuickView.recentPayments.length === 0 ? (
                  <p className="text-sm text-mh-ink-muted">Sin pagos registrados.</p>
                ) : (
                  <ul className="space-y-2">
                    {currentQuickView.recentPayments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-mh-ink-muted">{p.entry_date}</span>
                        <span className="font-semibold text-mh-ink">
                          {formatCurrency(p.credit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {supplier.internal_notes && (
                <div className="border-t border-mh-border pt-4">
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-mh-ink">
                    <FileIcon size={14} /> Observaciones
                  </p>
                  <p className="text-sm text-mh-ink-muted">{supplier.internal_notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-mh-border p-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLedgerModal("compra")}
                  className="rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50"
                >
                  Nueva compra
                </button>
                <button
                  onClick={() => setLedgerModal("pago")}
                  className="rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50"
                >
                  Registrar pago
                </button>
              </div>
              <Link
                href={`/proveedores/${supplier.id}/editar`}
                className="block w-full rounded-xl bg-mh-pink px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-mh-pink-dark"
              >
                Editar proveedor
              </Link>
              <Link
                href={`/proveedores/${supplier.id}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-mh-pink hover:bg-mh-pink-light"
              >
                Ver historial completo <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </Drawer>

      {supplier && ledgerModal && (
        <LedgerEntryModal
          supplierId={supplier.id}
          supplierName={supplier.trade_name}
          kind={ledgerModal}
          onClose={() => setLedgerModal(null)}
        />
      )}
    </>
  );
}
