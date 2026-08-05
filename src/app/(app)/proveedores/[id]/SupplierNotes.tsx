"use client";

import { useState } from "react";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import Card from "@/components/ds/Card";
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
    <Card padding="sm" className="font-inter">
      <p className="mb-2 text-sm font-bold text-mh-ink">
        Observaciones internas
      </p>
      <p className="mb-2 text-xs text-mh-ink-muted">
        Notas propias sobre este proveedor (ej. &quot;No entregar
        cheques&quot;, &quot;Siempre mejora precio a fin de mes&quot;).
      </p>
      <AutoGrowTextarea
        className="w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
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
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </Card>
  );
}
