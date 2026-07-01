"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importMasterExcel, type ImportResult } from "./actions";

const initialState: ImportResult | null = null;

export default function ImportPage() {
  const [state, formAction, isPending] = useActionState(
    importMasterExcel,
    initialState
  );

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Importar Excel maestro
        </h1>
        <Link
          href="/inventario"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Volver al inventario
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        Subí <code className="rounded bg-slate-100 px-1">
          MUNDO_HOGAR_maestro_productos.xlsx
        </code>{" "}
        con las columnas: Código, Descripción, Stock, Costo, P. Venta, Unidad
        de Negocio, Categoría Madre, Subcategoría, En Web. Los productos se
        identifican por Código: si ya existe, se actualiza; si no, se crea.
        Las categorías y subcategorías nuevas se crean automáticamente.
      </p>

      <form
        action={formAction}
        className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <input
          type="file"
          name="file"
          accept=".xlsx"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
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
