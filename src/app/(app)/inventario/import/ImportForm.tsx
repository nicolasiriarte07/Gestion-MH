"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BusinessUnit } from "@/lib/types";
import { importMasterExcel, type ImportResult } from "./actions";

const initialState: ImportResult | null = null;

export default function ImportForm({
  businessUnits,
}: {
  businessUnits: BusinessUnit[];
}) {
  const [state, formAction, isPending] = useActionState(
    importMasterExcel,
    initialState
  );

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Importar Excel de productos
        </h1>
        <Link
          href="/inventario"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Volver al inventario
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        Subí un Excel con al menos las columnas <strong>Código</strong> y{" "}
        <strong>Descripción</strong>. Si además trae Stock, Costo, P. Venta,
        Unidad de Negocio, Categoría Madre, Subcategoría o En Web, se usan
        también. Los productos se identifican por Código: si ya existe se
        actualiza, si no existe se crea. Las categorías y subcategorías
        nuevas se crean automáticamente.
      </p>

      <form
        action={formAction}
        className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <div>
          <label
            htmlFor="defaultBusinessUnit"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Unidad de negocio por defecto
          </label>
          <select
            id="defaultBusinessUnit"
            name="defaultBusinessUnit"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          >
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Se usa para las filas donde el archivo no trae (o deja vacía) la
            columna Unidad de Negocio.
          </p>
        </div>

        <input
          type="file"
          name="file"
          accept=".xlsx"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Importando..." : "Importar"}
        </button>
      </form>

      {state && (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          {state.ok ? (
            <p className="text-sm font-medium text-green-700">
              Importación completa: {state.totalRows} filas procesadas,{" "}
              {state.created} creados, {state.updated} actualizados.
            </p>
          ) : (
            <p className="text-sm font-medium text-red-700">
              {state.message}
            </p>
          )}

          {state.skipped && state.skipped.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-slate-700">
                Filas omitidas ({state.skipped.length}):
              </p>
              <ul className="mt-1 max-h-64 space-y-1 overflow-y-auto text-xs text-slate-600">
                {state.skipped.map((s, i) => (
                  <li key={i}>
                    Fila {s.row} {s.sku && `(${s.sku})`}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
