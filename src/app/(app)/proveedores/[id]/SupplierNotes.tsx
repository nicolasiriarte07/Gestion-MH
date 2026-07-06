"use client";

import { useState } from "react";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import { updateSupplier } from "../actions";

export default function SupplierNotes({
  supplierId,
  initialNotes,
}: {
  supplierId: string;
  initialNotes: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-slate-900">
        Observaciones internas
      </p>
      <p className="mb-2 text-xs text-slate-500">
        Notas propias sobre este proveedor (ej. &quot;No entregar
        cheques&quot;, &quot;Siempre mejora precio a fin de mes&quot;).
      </p>
      <AutoGrowTextarea
        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        defaultValue={initialNotes ?? ""}
        onBlur={async (e) => {
          const value = e.target.value.trim();
          if (value === (initialNotes ?? "")) return;
          const result = await updateSupplier(supplierId, {
            internal_notes: value || null,
          });
          setError(result.error ?? null);
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
