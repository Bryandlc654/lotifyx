export interface User {
  id: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  status: string;
  referral_code: string;
  role?: { id: string; name: string; is_admin: boolean };
  profile?: UserProfile;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  document_type?: string;
  document_number?: string;
  address?: string;
  ruc?: string;
  razon_social?: string;
  account_type?: string;
  plan_id?: string;
}

export interface Product {
  id: string;
  title: string;
  sku?: string;
  user_id: string;
  category_id: string;
  specifications: Record<string, any>;
  metodo_pago: string;
  status: string;
  stock: number;
  views: number;
  saves_count: number;
  precio_inicial?: number;
  precio_lote?: number;
  envio_delivery: boolean;
  envio_courier: boolean;
  costo_envio: number;
  tiempo_entrega?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  operation_number?: string;
  amount?: number;
  proof_image?: string;
  rejected_reason?: string;
  created_at: string;
  items: OrderItem[];
  bid_info?: { bid_amount: number; ganador_id?: string | null; auction_estado?: string } | null;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_title?: string;
  price: number;
  seller?: Seller | null;
}

export interface Seller {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  images?: string[];
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
  image?: string;
  children?: Category[];
}

export interface BidInfo {
  bid_amount: number;
  ganador_id?: string | null;
  auction_estado?: string;
}
