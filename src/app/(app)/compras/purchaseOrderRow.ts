import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/types";

export type PurchaseOrderRow = PurchaseOrder & {
  items: PurchaseOrderItem[];
  totalAmount: number;
  totalQuantity: number;
};
