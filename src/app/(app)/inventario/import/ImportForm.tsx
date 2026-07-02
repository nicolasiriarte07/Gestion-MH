"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importMasterExcel, type ImportResult } from "./actions";

const initialState: ImportResult | null = null;

export default function ImportForm() {
  const [state, formAction, isPending] = useActionState(
    importMasterExcel,
    initialState
  );

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Importar productos (.xlsx o .csv)
        </h1>
        <Link
          href="/inventario"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Volver al inventario
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        Subí un archivo .xlsx o .csv con al menos las columnas{" "}
        <strong>Código</strong>, <strong>Descripción</strong> y{" "}
        <strong>P. Contado</strong> (filas sin alguna de estas tres se
        omiten). Si además trae Stock, Costo, P. Web, Unidad de Negocio,
        Categoría Madre, Subcategoría o Publicado/En Web, se usan también.
        Todo lo demás que falte (incluida la Unidad de Negocio) queda vacío
        y lo completás después a mano desde la tabla. Los productos se
        identifican por Código: si ya existe se actualiza, si no existe se
        crea. Las categorías y subcategorías nuevas se crean
        automáticamente.
      </p>

      <form
        action={formAction}
        className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
      >
        <input
          type="file"
          name="file"
          accept=".xlsx,.csv"
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
