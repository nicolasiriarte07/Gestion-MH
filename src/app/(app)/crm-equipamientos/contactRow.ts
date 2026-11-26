import type { EquipamientoContact } from "@/lib/types";

export type ContactRow = EquipamientoContact & {
  lastPurchaseDate: string | null;
  totalRevenue: number;
  salesCount: number;
  outstandingBalance: number;
};
