"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { Product } from "@/lib/types";
import { updateProduct } from "./actions";

// Atajo rápido para lo que más se usa a diario (cargar/corregir stock),
// sin pasar por el formulario completo de edición.
export default function StockAdjustModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const [stock, setStock] = useState(product.stock);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await updateProduct(product.id, { stock });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result.data as Product);
  }

  return (
    <Modal title="Ajustar stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div>
          <p className="text-sm font-semibold text-mh-ink">{product.description}</p>
          <p className="text-xs text-mh-ink-muted">{product.sku}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-mh-ink-muted">
            Stock actual: {product.stock}
          </label>
          <input
            type="number"
            autoFocus
            className="w-full rounded-xl border border-mh-border px-3 py-2 text-lg font-bold focus:border-mh-pink focus:outline-none"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-mh-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-mh-ink-muted hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-mh-pink px-4 py-2 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
