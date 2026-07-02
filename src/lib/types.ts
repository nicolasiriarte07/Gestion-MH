export type BusinessUnit = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  description: string;
  cost: number;
  sale_price: number;
  stock: number;
  is_web: boolean;
  business_unit_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchStatus = "pending" | "confirmed" | "rejected" | "no_match";

export type SaleItem = {
  id: string;
  receipt_letter: string | null;
  sale_date: string;
  customer_code: string | null;
  customer_name: string | null;
  payment_method: string | null;
  product_description_raw: string;
  quantity: number;
  iva: number | null;
  subtotal_with_iva: number;
  product_id: string | null;
  business_unit_id: string | null;
  source_article_code: string | null;
  match_status: MatchStatus;
  match_confidence: number | null;
  created_at: string;
};
