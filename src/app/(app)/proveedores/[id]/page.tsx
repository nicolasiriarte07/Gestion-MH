import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Supplier, SupplierBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import SupplierTabs, { type SupplierTab } from "./SupplierTabs";
import SupplierSummaryTab from "./SupplierSummaryTab";
import SupplierProductsTab from "./SupplierProductsTab";
import SupplierLedgerTab from "./SupplierLedgerTab";
import SupplierPaymentsTab from "./SupplierPaymentsTab";
import SupplierDocumentsTab from "./SupplierDocumentsTab";
import SupplierHistoryTab from "./SupplierHistoryTab";

const VALID_TABS: SupplierTab[] = [
  "resumen",
  "productos",
  "cuenta-corriente",
  "pagos",
  "documentos",
  "historial",
];

export default async function SupplierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: SupplierTab = VALID_TABS.includes(tab as SupplierTab)
    ? (tab as SupplierTab)
    : "resumen";

  const supabase = await createClient();

  const [
    { data: supplier },
    { data: balance },
    { data: supplierBrands },
    { data: brands },
  ] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", id).single(),
    supabase.from("supplier_balances").select("*").eq("supplier_id", id).maybeSingle(),
    supabase.from("supplier_brands").select("brand_id").eq("supplier_id", id),
    supabase.from("brands").select("id, name"),
  ]);

  if (!supplier) notFound();

  const brandName = new Map(((brands ?? []) as Brand[]).map((b) => [b.id, b.name]));
  const brandNames = (supplierBrands ?? [])
    .map((sb) => brandName.get(sb.brand_id))
    .filter((n): n is string => !!n);

  const supplierRow = supplier as Supplier;
  const supplierBalance = (balance as SupplierBalance | null) ?? {
    supplier_id: id,
    balance: 0,
    last_purchase_date: null,
    purchase_count: 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900">
              {supplierRow.trade_name}
            </h1>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                supplierRow.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {supplierRow.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {[supplierRow.category, supplierRow.city].filter(Boolean).join(" · ") ||
              "Sin categoría ni ciudad cargadas"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">Saldo de cuenta corriente</p>
            <p
              className={`text-lg font-semibold ${
                supplierBalance.balance > 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatCurrency(supplierBalance.balance)}
            </p>
          </div>
          <Link
            href={`/proveedores/${id}/editar`}
            className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light"
          >
            Editar
          </Link>
          <Link
            href="/proveedores"
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <SupplierTabs active={activeTab} />

      {activeTab === "resumen" && (
        <SupplierSummaryTab
          supplier={supplierRow}
          balance={supplierBalance}
          brandNames={brandNames}
        />
      )}
      {activeTab === "productos" && <SupplierProductsTab supplierId={id} />}
      {activeTab === "cuenta-corriente" && <SupplierLedgerTab supplierId={id} />}
      {activeTab === "pagos" && <SupplierPaymentsTab supplierId={id} />}
      {activeTab === "documentos" && <SupplierDocumentsTab supplierId={id} />}
      {activeTab === "historial" && <SupplierHistoryTab supplierId={id} />}
    </div>
  );
}
