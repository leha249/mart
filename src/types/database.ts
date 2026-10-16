export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  category: string;
  image: string;
  images: string[];
  tag: 'NEW' | 'HOT' | 'SALE' | null;
  sizes: string[];
  colors: string[];
  rating: number;
  reviews: number;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
}

export type OrderStatus =
  | 'new'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  processing: 'В работе',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string }
> = {
  new: { bg: 'rgba(232,255,90,0.15)', text: '#c8e03d' },
  processing: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  shipped: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  delivered: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  cancelled: { bg: 'rgba(255,77,77,0.15)', text: '#ff4d4d' },
};

export interface UIProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number;
  category: string;
  image: string;
  images: string[];
  tag?: string;
  sizes: string[];
  colors: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
}

export const mapProductToUI = (p: Product): UIProduct => {
  const imagesSet = new Set<string>();
  if (p.image) imagesSet.add(p.image);
  (p.images ?? []).forEach((img) => {
    if (img) imagesSet.add(img);
  });
  const images = Array.from(imagesSet);

  return {
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    price: p.price,
    oldPrice: p.old_price ?? undefined,
    category: p.category,
    image: images[0] || p.image,
    images,
    tag: p.tag ?? undefined,
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    rating: Number(p.rating),
    reviews: p.reviews,
    inStock: p.in_stock,
  };
};

// ============= PROMOCODES =============
export interface Promocode {
  id: number;
  code: string;
  discount_percent: number;
  min_total: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

// ============= REVIEWS =============
export interface Review {
  id: number;
  product_id: number;
  author_name: string;
  rating: number;
  text: string;
  approved: boolean;
  created_at: string;
}

// ============= SIZE CHARTS =============
export interface SizeChart {
  id: number;
  category: string;
  columns: string[];
  rows: string[][];
  note: string | null;
  created_at: string;
}

// ============= THEME =============
export type Theme = 'dark' | 'light';