"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileSpreadsheet, File as FileIcon, Trash2, Upload } from "lucide-react";
import type { SupplierDocType, SupplierDocument } from "@/lib/types";
import Card from "@/components/ds/Card";
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
    <div className="font-inter space-y-4">
      <Card padding="sm" className="flex flex-wrap items-center gap-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as SupplierDocType)}
          className="rounded-xl border border-mh-border px-3 py-2 text-sm focus:border-mh-pink focus:outline-none"
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
          className="text-sm text-mh-ink-muted file:mr-3 file:rounded-xl file:border-0 file:bg-mh-pink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-mh-pink-dark"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-xl bg-mh-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-mh-pink-dark disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading ? "Subiendo..." : "Subir documento"}
        </button>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </Card>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mh-border bg-mh-surface p-12 text-center text-sm text-mh-ink-muted">
          Todavía no subiste ningún documento.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative overflow-hidden rounded-2xl border border-mh-border bg-mh-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
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
                  <div className="flex h-28 w-full items-center justify-center bg-mh-bg text-mh-ink-muted/60">
                    <DocIcon mimeType={doc.mime_type} />
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-xs font-bold text-mh-ink">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-mh-ink-muted">
                    {doc.doc_type ? DOC_TYPE_LABELS[doc.doc_type] : "Otro"} ·{" "}
                    {doc.uploaded_at.slice(0, 10)}
                  </p>
                </div>
              </a>
              <button
                onClick={() => handleDelete(doc)}
                disabled={removingId === doc.id}
                className="absolute top-1.5 right-1.5 rounded-lg bg-white/90 p-1.5 text-red-600 opacity-0 shadow-sm hover:bg-red-50 disabled:opacity-50 group-hover:opacity-100"
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
