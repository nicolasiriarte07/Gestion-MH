import { createClient } from "@/lib/supabase/server";
import type { SupplierDocument } from "@/lib/types";
import SupplierDocumentsGallery, {
  type SupplierDocumentRow,
} from "./SupplierDocumentsGallery";

const DOCUMENTS_BUCKET = "supplier-documents";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function SupplierDocumentsTab({
  supplierId,
}: {
  supplierId: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_documents")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("uploaded_at", { ascending: false });

  const documents = (data ?? []) as SupplierDocument[];

  const rows: SupplierDocumentRow[] = await Promise.all(
    documents.map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS);
      return { ...doc, signedUrl: signed?.signedUrl ?? null };
    })
  );

  return <SupplierDocumentsGallery supplierId={supplierId} documents={rows} />;
}
