"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importSalesExcel, type SalesImportResult } from "./actions";

const initialState: SalesImportResult | null = null;

export default function ImportForm() {
  const [state, formAction, isPending] = useActionState(
    importSalesExcel,
    initialState
  );

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Importar ventas (.xlsx o .csv)
        </h1>
        <Link
          href="/ventas"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Volver a ventas
        </Link>
      </div>

      <p className="text-sm text-slate-600">
        Subí el archivo de facturas, en .xlsx o .csv (columnas
        Tipo_Comprobante, Fecha, Dia, Cliente, Forma_Pago, Articulo,
        Descripcion, Categoria, Cantidad, IVA_Monto, Monto_con_IVA_ars,
        Monto_con_IVA_usd, Vertical y opcionalmente Nombre_PDF). Las filas con
        código de artículo que coincide con un producto del inventario se
        vinculan automáticamente; el resto queda pendiente de revisión manual
        en{" "}
        <Link href="/ventas/revisar" className="text-brand underline">
          Revisar coincidencias
        </Link>
        .
      </p>

      <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Podés resubir el mismo archivo (por ejemplo, con ventas nuevas
        agregadas al final) sin miedo a duplicar: las filas que ya estaban
        cargadas se reconocen por su contenido y se omiten solas. Solo
        marcá &quot;Reemplazar ventas existentes&quot; si necesitás recargar
        todo el histórico desde cero (por ejemplo, para completar una
        columna que se agregó después de tu última importación).
      </p>

      <form
        action={formAction}
        className="space-y-3 rounded-2xl border border-slate-200 shadow-sm bg-white p-4"
      >
        <input
          type="file"
          name="file"
          accept=".xlsx,.csv"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
        />
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="replaceExisting"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          <span>
            Reemplazar ventas existentes: borra todas las ventas ya
            importadas antes de cargar este archivo. Usalo para volver a
            subir el mismo histórico completo (por ejemplo, para completar
            datos de una columna nueva) sin duplicar filas.
          </span>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Importando... puede tardar unos minutos" : "Importar"}
        </button>
      </form>

      {state && (
        <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-4">
          {state.ok ? (
            <p className="text-sm font-medium text-green-700">
              {state.replaced && "Se borraron las ventas anteriores. "}
              Importación completa: {state.totalRows} filas procesadas,{" "}
              {state.imported} nuevas
              {!!state.duplicates && ` (${state.duplicates} ya existían y se omitieron)`}
              . Del archivo: {state.autoMatched} vinculadas automáticamente
              por código, {state.pending} pendientes de revisión.
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
                    Fila {s.row}: {s.reason}
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
