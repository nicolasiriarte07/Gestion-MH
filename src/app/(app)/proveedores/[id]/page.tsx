import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Brand, Supplier, SupplierBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import Badge from "@/components/ds/Badge";
import Avatar from "@/components/ds/Avatar";
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
    <div className="font-inter space-y-6">
      <Link
        href="/proveedores"
        className="flex items-center gap-1 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
      >
        <ChevronLeft size={16} />
        Volver a Proveedores
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={supplierRow.trade_name} size={56} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
                {supplierRow.trade_name}
              </h1>
              <Badge tone={supplierRow.is_active ? "green" : "gray"}>
                {supplierRow.is_active ? "Activo" : "Inactivo"}
              </Badge>
              <Badge tone={supplierBalance.balance > 0 ? "red" : "green"}>
                {supplierBalance.balance > 0 ? "Con deuda" : "Al día"}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-mh-ink-muted">
              {[supplierRow.category, supplierRow.city].filter(Boolean).join(" · ") ||
                "Sin categoría ni ciudad cargadas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-mh-ink-muted">Saldo de cuenta corriente</p>
            <p
              className={`text-xl font-extrabold ${
                supplierBalance.balance > 0 ? "text-red-600" : "text-mh-ink"
              }`}
            >
              {formatCurrency(supplierBalance.balance)}
            </p>
          </div>
          <Link
            href={`/proveedores/${id}/editar`}
            className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-mh-pink-dark"
          >
            <Pencil size={16} />
            Editar
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
