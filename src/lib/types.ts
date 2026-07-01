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
  business_unit_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  created_at: string;
  updated_at: string;
};
