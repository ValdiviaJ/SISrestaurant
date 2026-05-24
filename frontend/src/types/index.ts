export type UserRole = 'admin' | 'cajero' | 'mozo' | 'cocina';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Dish {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id: number;
  category?: Category;
}

export type TableStatus = 'free' | 'busy' | 'reserved';

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: TableStatus;
  current_order_id?: number;
}

export type OrderStatus = 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'pagado' | 'cancelado';

export interface OrderItem {
  id: number;
  dish_id: number;
  dish?: Dish;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: number;
  table_id?: number;
  table?: Table;
  user_id: number;
  user?: User;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantConfig {
  name: string;
  ruc?: string;
  address: string;
  phone: string;
  tax_rate: number; // e.g. 18% for IGV/IVA
  currency: string; // e.g. 'PEN', 'USD'
  currency_symbol: string; // e.g. 'S/', '$', '€'
}
