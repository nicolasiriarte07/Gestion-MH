import { Users } from "lucide-react";

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        <Users className="text-slate-300" size={32} />
        <p>Este módulo todavía no está disponible.</p>
      </div>
    </div>
  );
}
