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

export type Brand = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  description: string;
  cost: number;
  price_cash: number;
  price_web: number;
  stock: number;
  is_web: boolean;
  business_unit_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentType = "educacional" | "marca" | "comercial";

export type MarketingPost = {
  id: string;
  concept: string;
  description: string | null;
  business_unit_id: string | null;
  publish_date: string;
  content_type: ContentType | null;
  is_scheduled: boolean;
  investment_ars: number;
  created_at: string;
  updated_at: string;
};

export type AdCampaign = {
  id: string;
  campaign_name: string;
  investment_ars: number;
  reach: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type MatchStatus = "pending" | "confirmed" | "rejected" | "no_match";

export type SaleItem = {
  id: string;
  receipt_letter: string | null;
  receipt_number: string | null;
  sale_date: string;
  weekday_label: string | null;
  customer_code: string | null;
  customer_name: string | null;
  payment_method: string | null;
  product_description_raw: string;
  category_raw: string | null;
  quantity: number;
  iva: number | null;
  subtotal_with_iva: number;
  amount_usd: number | null;
  product_id: string | null;
  business_unit_id: string | null;
  source_article_code: string | null;
  match_status: MatchStatus;
  match_confidence: number | null;
  created_at: string;
};
