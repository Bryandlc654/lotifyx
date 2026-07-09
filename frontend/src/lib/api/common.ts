interface RegisterPayload {
  nombre: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
  contrasena: string;
  ruc?: string;
  razonSocial?: string;
  codigoReferidos?: string;
  comoNosEncontraste: string;
  aceptaTerminos: boolean;
}

interface LoginPayload {
  credential: string;
  contrasena: string;
}

interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken?: string;
  user: Record<string, unknown>;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface Marquee {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  stars: number;
  text: string;
  name: string;
  cargo: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  status: string;
  is_verified: boolean;
  provider: string;
  referral_code: string;
  role_id: string;
  role?: { id: string; name: string };
  profile?: {
    first_name: string; last_name: string; document_type: string;
    document_number: string; ruc: string; razon_social: string;
    avatar_url: string;
  };
  created_at: string;
}

export interface Category {
  id: string; name: string; slug: string; icon: string;
  parent_id: string; parent?: Category; children?: Category[];
  status: string; created_at: string;
}

export interface CategoryField {
  id: string; category_id: string; name: string; label: string; type: string;
  required: boolean; options: string[] | null; order_index: number;
}

export interface Product {
  id: string;
  sku?: string;
  user_id: string;
  category_id: string;
  title: string;
  specifications: Record<string, any>;
  stock?: number;
  views?: number;
  saves_count?: number;
  metodo_pago: string;
  precio_base?: number;
  precio_inicial?: number;
  incremento_minimo?: number;
  precio_lote?: number;
  precio_individual?: number;
  participantes_minimos?: number;
  cierre_estimado?: string;
  envio_delivery: boolean;
  envio_courier: boolean;
  costo_envio: number;
  tiempo_entrega: string;
  cambios: string;
  devoluciones: string;
  garantia: string;
  politicas_imagenes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  author?: string;
  status: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SecondaryBanner {
  id: string; title: string; subtitle: string; image_url: string; link_url: string;
  button_text: string; type: string; is_active: boolean; order_index: number; created_at: string;
}

export interface BackingLogo {
  id: string; name: string; image_url: string; is_active: boolean; order_index: number; created_at: string;
}

export interface Plan {
  id: string; name: string; description: string; price: number;
  max_products: number; max_featured: number; duration_days: number;
  commission: number;
  icon: string; is_active: boolean; order_index: number;
}

export interface Faq { id: string; category: string; question: string; answer: string; is_active: boolean; order_index: number; }

export interface FaqCategory { id: string; name: string; slug: string; description: string; order_index: number; is_active: boolean; }

export interface RoleWithPerms {
  id: string; name: string; description: string;
  rolePermissions: { id: string; permission_id: string; permission?: Permission; }[];
}

export interface Permission {
  id: string; name: string; description: string; module: string;
}

export interface Lead {
  id: string; first_name: string; last_name: string; email: string; phone: string; message: string; created_at: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  image_url?: string;
  status: string;
  created_at: string;
}

export interface AppEvent {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  image_url?: string;
  status: string;
  created_at: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  status: string;
  created_at: string;
}

export interface PressArticle {
  id: string;
  title: string;
  excerpt?: string;
  source: string;
  link: string;
  image_url?: string;
  status: string;
  published_at?: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  images: string[];
  files: string[];
  status: string;
  response: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  buyer_email: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_avatar: string | null;
  seller_email: string;
  seller_first_name: string;
  seller_last_name: string;
  seller_avatar: string | null;
  product_title: string | null;
  product_images: string | null;
  unread_count: number;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_title?: string;
  product_sku?: string;
  operation_number?: string;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  seller_first_name?: string;
  seller_last_name?: string;
}
