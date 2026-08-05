"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Brand, Supplier } from "@/lib/types";
import Card from "@/components/ds/Card";
import { createSupplier, updateSupplier, setSupplierBrands, type SupplierInput } from "./actions";

const inputClass =
  "font-inter w-full rounded-xl border border-mh-border px-3 py-2 text-sm text-mh-ink focus:border-mh-pink focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-mh-ink">{label}</span>
      {children}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="sm" className="font-inter space-y-4">
      <p className="text-sm font-bold text-mh-ink">{title}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </Card>
  );
}

function emptyInput(): SupplierInput {
  return {
    trade_name: "",
    legal_name: null,
    cuit: null,
    vat_condition: null,
    gross_income: null,
    address: null,
    city: null,
    province: null,
    postal_code: null,
    country: "Argentina",
    contact_name: null,
    contact_role: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    category: null,
    price_list: null,
    delivery_time: null,
    min_order: null,
    usual_discount: null,
    payment_cash: false,
    payment_7d: false,
    payment_15d: false,
    payment_30d: false,
    payment_60d: false,
    payment_transfer: false,
    payment_check: false,
    payment_card: false,
    payment_notes: null,
    is_active: true,
    internal_notes: null,
  };
}

function supplierToInput(s: Supplier): SupplierInput {
  return {
    trade_name: s.trade_name,
    legal_name: s.legal_name,
    cuit: s.cuit,
    vat_condition: s.vat_condition,
    gross_income: s.gross_income,
    address: s.address,
    city: s.city,
    province: s.province,
    postal_code: s.postal_code,
    country: s.country,
    contact_name: s.contact_name,
    contact_role: s.contact_role,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    website: s.website,
    category: s.category,
    price_list: s.price_list,
    delivery_time: s.delivery_time,
    min_order: s.min_order,
    usual_discount: s.usual_discount,
    payment_cash: s.payment_cash,
    payment_7d: s.payment_7d,
    payment_15d: s.payment_15d,
    payment_30d: s.payment_30d,
    payment_60d: s.payment_60d,
    payment_transfer: s.payment_transfer,
    payment_check: s.payment_check,
    payment_card: s.payment_card,
    payment_notes: s.payment_notes,
    is_active: s.is_active,
    internal_notes: s.internal_notes,
  };
}

const PAYMENT_TERMS: { key: keyof SupplierInput; label: string }[] = [
  { key: "payment_cash", label: "Contado" },
  { key: "payment_7d", label: "7 días" },
  { key: "payment_15d", label: "15 días" },
  { key: "payment_30d", label: "30 días" },
  { key: "payment_60d", label: "60 días" },
  { key: "payment_transfer", label: "Transferencia" },
  { key: "payment_check", label: "Cheque" },
  { key: "payment_card", label: "Tarjeta" },
];

export default function SupplierForm({
  mode,
  supplier,
  initialBrandIds,
  brands,
}: {
  mode: "create" | "edit";
  supplier?: Supplier;
  initialBrandIds?: string[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [input, setInput] = useState<SupplierInput>(
    supplier ? supplierToInput(supplier) : emptyInput()
  );
  const [brandIds, setBrandIds] = useState<Set<string>>(
    new Set(initialBrandIds ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBrand(id: string) {
    setBrandIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trade_name.trim()) {
      setError("El nombre comercial es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);

    const supplierId =
      mode === "edit" && supplier
        ? supplier.id
        : await (async () => {
            const result = await createSupplier(input);
            if (result.error) throw new Error(result.error);
            return result.data!.id as string;
          })().catch((err) => {
            setError(err instanceof Error ? err.message : "Error desconocido");
            return null;
          });

    if (!supplierId) {
      setSaving(false);
      return;
    }

    if (mode === "edit") {
      const result = await updateSupplier(supplierId, input);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
    }

    const brandsResult = await setSupplierBrands(supplierId, [...brandIds]);
    setSaving(false);

    if (brandsResult.error) {
      setError(brandsResult.error);
      return;
    }

    router.push(`/proveedores/${supplierId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="font-inter space-y-6">
      <Link
        href={mode === "edit" && supplier ? `/proveedores/${supplier.id}` : "/proveedores"}
        className="flex items-center gap-1 text-sm font-semibold text-mh-ink-muted hover:text-mh-ink"
      >
        <ChevronLeft size={16} />
        {mode === "edit" && supplier ? "Volver al proveedor" : "Volver a Proveedores"}
      </Link>

      <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-mh-ink">
        {mode === "create" ? "Nuevo proveedor" : `Editar ${supplier?.trade_name}`}
      </h1>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <Section title="Datos generales">
        <Field label="Nombre comercial *">
          <input
            className={inputClass}
            value={input.trade_name}
            onChange={(e) => set("trade_name", e.target.value)}
            required
          />
        </Field>
        <Field label="Razón social">
          <input
            className={inputClass}
            value={input.legal_name ?? ""}
            onChange={(e) => set("legal_name", e.target.value || null)}
          />
        </Field>
        <Field label="CUIT">
          <input
            className={inputClass}
            value={input.cuit ?? ""}
            onChange={(e) => set("cuit", e.target.value || null)}
          />
        </Field>
        <Field label="Condición de IVA">
          <input
            className={inputClass}
            value={input.vat_condition ?? ""}
            onChange={(e) => set("vat_condition", e.target.value || null)}
          />
        </Field>
        <Field label="Ingresos Brutos">
          <input
            className={inputClass}
            value={input.gross_income ?? ""}
            onChange={(e) => set("gross_income", e.target.value || null)}
          />
        </Field>
        <Field label="Dirección">
          <input
            className={inputClass}
            value={input.address ?? ""}
            onChange={(e) => set("address", e.target.value || null)}
          />
        </Field>
        <Field label="Localidad">
          <input
            className={inputClass}
            value={input.city ?? ""}
            onChange={(e) => set("city", e.target.value || null)}
          />
        </Field>
        <Field label="Provincia">
          <input
            className={inputClass}
            value={input.province ?? ""}
            onChange={(e) => set("province", e.target.value || null)}
          />
        </Field>
        <Field label="Código Postal">
          <input
            className={inputClass}
            value={input.postal_code ?? ""}
            onChange={(e) => set("postal_code", e.target.value || null)}
          />
        </Field>
        <Field label="País">
          <input
            className={inputClass}
            value={input.country}
            onChange={(e) => set("country", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Contacto">
        <Field label="Persona de contacto">
          <input
            className={inputClass}
            value={input.contact_name ?? ""}
            onChange={(e) => set("contact_name", e.target.value || null)}
          />
        </Field>
        <Field label="Cargo">
          <input
            className={inputClass}
            value={input.contact_role ?? ""}
            onChange={(e) => set("contact_role", e.target.value || null)}
          />
        </Field>
        <Field label="Teléfono">
          <input
            className={inputClass}
            value={input.phone ?? ""}
            onChange={(e) => set("phone", e.target.value || null)}
          />
        </Field>
        <Field label="WhatsApp">
          <input
            className={inputClass}
            value={input.whatsapp ?? ""}
            onChange={(e) => set("whatsapp", e.target.value || null)}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={input.email ?? ""}
            onChange={(e) => set("email", e.target.value || null)}
          />
        </Field>
        <Field label="Sitio web">
          <input
            className={inputClass}
            value={input.website ?? ""}
            onChange={(e) => set("website", e.target.value || null)}
          />
        </Field>
      </Section>

      <Section title="Datos comerciales">
        <Field label="Rubro / Categoría">
          <input
            className={inputClass}
            value={input.category ?? ""}
            onChange={(e) => set("category", e.target.value || null)}
          />
        </Field>
        <Field label="Lista de precios">
          <input
            className={inputClass}
            value={input.price_list ?? ""}
            onChange={(e) => set("price_list", e.target.value || null)}
          />
        </Field>
        <Field label="Plazo de entrega">
          <input
            className={inputClass}
            value={input.delivery_time ?? ""}
            onChange={(e) => set("delivery_time", e.target.value || null)}
          />
        </Field>
        <Field label="Pedido mínimo">
          <input
            className={inputClass}
            value={input.min_order ?? ""}
            onChange={(e) => set("min_order", e.target.value || null)}
          />
        </Field>
        <Field label="Descuento habitual (%)">
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={input.usual_discount ?? ""}
            onChange={(e) =>
              set(
                "usual_discount",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </Field>
      </Section>

      <Card padding="sm" className="font-inter">
        <p className="mb-3 text-sm font-bold text-mh-ink">
          Marcas que comercializa
        </p>
        {brands.length === 0 ? (
          <p className="text-sm text-mh-ink-muted">
            No hay marcas cargadas todavía (se administran desde Inventario).
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {brands.map((b) => (
              <label
                key={b.id}
                className="flex items-center gap-2 text-sm font-medium text-mh-ink"
              >
                <input
                  type="checkbox"
                  className="accent-mh-pink"
                  checked={brandIds.has(b.id)}
                  onChange={() => toggleBrand(b.id)}
                />
                {b.name}
              </label>
            ))}
          </div>
        )}
      </Card>

      <Card padding="sm" className="font-inter">
        <p className="mb-3 text-sm font-bold text-mh-ink">
          Condiciones de pago
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PAYMENT_TERMS.map((term) => (
            <label
              key={term.key}
              className="flex items-center gap-2 text-sm font-medium text-mh-ink"
            >
              <input
                type="checkbox"
                className="accent-mh-pink"
                checked={Boolean(input[term.key])}
                onChange={(e) =>
                  set(term.key, e.target.checked as SupplierInput[typeof term.key])
                }
              />
              {term.label}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Field label="Observaciones">
            <textarea
              className={inputClass}
              rows={2}
              value={input.payment_notes ?? ""}
              onChange={(e) => set("payment_notes", e.target.value || null)}
            />
          </Field>
        </div>
      </Card>

      <Card padding="sm" className="font-inter">
        <p className="mb-3 text-sm font-bold text-mh-ink">Estado</p>
        <label className="flex items-center gap-2 text-sm font-medium text-mh-ink">
          <input
            type="checkbox"
            className="accent-mh-pink"
            checked={input.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
          />
          Proveedor activo
        </label>
      </Card>

      <div className="flex justify-end gap-3">
        <Link
          href={mode === "edit" && supplier ? `/proveedores/${supplier.id}` : "/proveedores"}
          className="rounded-xl border border-mh-border px-4 py-2.5 text-sm font-semibold text-mh-ink hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
        >
          {saving
            ? "Guardando..."
            : mode === "create"
              ? "Crear proveedor"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
