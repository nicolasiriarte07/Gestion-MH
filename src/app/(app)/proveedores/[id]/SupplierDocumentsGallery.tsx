"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileSpreadsheet, File as FileIcon, Trash2 } from "lucide-react";
import type { SupplierDocType, SupplierDocument } from "@/lib/types";
import { deleteSupplierDocument, uploadSupplierDocument } from "../actions";

export type SupplierDocumentRow = SupplierDocument & { signedUrl: string | null };

const DOC_TYPE_LABELS: Record<SupplierDocType, string> = {
  factura: "Factura",
  nota_credito: "Nota de crédito",
  lista_precios: "Lista de precios",
  otro: "Otro",
};

function isImage(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith("image/");
}

function DocIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType === "application/pdf") return <FileText size={28} />;
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return <FileSpreadsheet size={28} />;
  return <FileIcon size={28} />;
}

export default function SupplierDocumentsGallery({
  supplierId,
  documents,
}: {
  supplierId: string;
  documents: SupplierDocumentRow[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<SupplierDocType>("otro");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Seleccioná un archivo primero.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadSupplierDocument(supplierId, docType, formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleDelete(doc: SupplierDocumentRow) {
    if (!confirm(`¿Eliminar "${doc.file_name}"?`)) return;

    setRemovingId(doc.id);
    const result = await deleteSupplierDocument(doc.id, supplierId, doc.storage_path);
    setRemovingId(null);

    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as SupplierDocType)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        >
          {(Object.entries(DOC_TYPE_LABELS) as [SupplierDocType, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : "Subir documento"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
          Todavía no subiste ningún documento.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <a
                href={doc.signedUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {isImage(doc.mime_type) && doc.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.signedUrl}
                    alt={doc.file_name}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-slate-50 text-slate-300">
                    <DocIcon mimeType={doc.mime_type} />
                  </div>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-slate-900">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doc.doc_type ? DOC_TYPE_LABELS[doc.doc_type] : "Otro"} ·{" "}
                    {doc.uploaded_at.slice(0, 10)}
                  </p>
                </div>
              </a>
              <button
                onClick={() => handleDelete(doc)}
                disabled={removingId === doc.id}
                className="absolute top-1.5 right-1.5 rounded-md bg-white/90 p-1.5 text-red-600 opacity-0 shadow-sm hover:bg-red-50 disabled:opacity-50 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
