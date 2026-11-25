"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

const inputClass =
  "w-full rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none";

export default function LostReasonModal({
  contactName,
  onClose,
  onConfirm,
}: {
  contactName: string;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motivo.trim()) {
      setError("Contá brevemente por qué se perdió.");
      return;
    }
    onConfirm(motivo.trim());
  }

  return (
    <Modal title={`Marcar "${contactName}" como perdido`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="font-inter space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-mh-ink-muted">Motivo</label>
          <textarea
            autoFocus
            rows={3}
            className={inputClass}
            placeholder="Ej: eligió otro proveedor, precio, no contestó más..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
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
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Marcar perdido
          </button>
        </div>
      </form>
    </Modal>
  );
}
