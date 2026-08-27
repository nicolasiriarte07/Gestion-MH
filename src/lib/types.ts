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
  iva_rate: number;
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
  is_published: boolean;
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

export type Supplier = {
  id: string;
  trade_name: string;
  legal_name: string | null;
  cuit: string | null;
  vat_condition: string | null;
  gross_income: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  contact_name: string | null;
  contact_role: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  category: string | null;
  price_list: string | null;
  delivery_time: string | null;
  min_order: string | null;
  usual_discount: number | null;
  payment_cash: boolean;
  payment_7d: boolean;
  payment_15d: boolean;
  payment_30d: boolean;
  payment_60d: boolean;
  payment_transfer: boolean;
  payment_check: boolean;
  payment_card: boolean;
  payment_notes: string | null;
  is_active: boolean;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierBalance = {
  supplier_id: string;
  balance: number;
  last_purchase_date: string | null;
  purchase_count: number;
};

export type SupplierProduct = {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_cost: number | null;
  last_purchase_date: string | null;
  created_at: string;
};

export type LedgerKind = "compra" | "pago" | "ajuste" | "nota_credito";

export type SupplierLedgerEntry = {
  id: string;
  supplier_id: string;
  entry_date: string;
  kind: LedgerKind;
  concept: string;
  debit: number;
  credit: number;
  status: string | null;
  payment_method: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
};

export type SupplierDocType = "factura" | "nota_credito" | "lista_precios" | "otro";

export type SupplierDocument = {
  id: string;
  supplier_id: string;
  doc_type: SupplierDocType | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
};

export type SupplierHistoryEntry = {
  id: string;
  supplier_id: string;
  event_type: string;
  description: string;
  occurred_at: string;
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

export const CONTACT_CATEGORIES = [
  "Carnicería",
  "Panadería",
  "Restaurant",
  "Almacén",
  "Supermercado",
  "Otro",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export type EquipamientoContact = {
  id: string;
  name: string;
  business_name: string | null;
  city: string | null;
  phone: string | null;
  category: ContactCategory;
  last_contact_date: string | null;
  created_at: string;
  updated_at: string;
};

export const SALE_PAYMENT_METHODS = [
  "contado",
  "pago semanal",
  "tarjeta",
  "cheque",
] as const;

export type SalePaymentMethod = (typeof SALE_PAYMENT_METHODS)[number];

export type EquipamientoSale = {
  id: string;
  cliente: string;
  comercio: string | null;
  mes: string | null;
  fecha: string | null;
  producto: string;
  categoria: string | null;
  monto: number;
  metodo_pago: SalePaymentMethod | null;
  entrega_inicial: number;
  cuota_semanal: number | null;
  semanas_pagadas: number;
  comentario: string | null;
  cobrado: boolean;
  entregado: boolean;
  created_at: string;
  updated_at: string;
};
