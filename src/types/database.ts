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
  purchases: number;
  in_stock: boolean;
  seller_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  seller_id: number | null;
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
  promo_code: string | null;
  promo_discount: number | null;
  seller_id: number | null;
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
  purchases: number;
  inStock: boolean;
  sellerId: number | null;
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
    purchases: p.purchases ?? 0,
    inStock: p.in_stock,
    sellerId: p.seller_id,
  };
};

// ============= SELLERS =============
export type SellerStatus = 'active' | 'paused' | 'blocked';

export interface Seller {
  id: number;
  user_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  cover: string | null;
  phone: string | null;
  email: string | null;
  status: SellerStatus;

  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image: string | null;
  hero_badge: string | null;
  about_title: string | null;
  about_text: string | null;
  about_image: string | null;
  about_badge: string | null;
  footer_text: string | null;
  accent_color: string | null;

  created_at: string;
  updated_at: string;
}

export interface UISeller {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  cover?: string;
  phone?: string;
  email?: string;
  status: SellerStatus;

  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroBadge?: string;
  aboutTitle?: string;
  aboutText?: string;
  aboutImage?: string;
  aboutBadge?: string;
  footerText?: string;
  accentColor?: string;

  createdAt: string;
}

export const mapSellerToUI = (s: Seller): UISeller => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  description: s.description ?? undefined,
  logo: s.logo ?? undefined,
  cover: s.cover ?? undefined,
  phone: s.phone ?? undefined,
  email: s.email ?? undefined,
  status: s.status,

  heroTitle: s.hero_title ?? undefined,
  heroSubtitle: s.hero_subtitle ?? undefined,
  heroImage: s.hero_image ?? undefined,
  heroBadge: s.hero_badge ?? undefined,
  aboutTitle: s.about_title ?? undefined,
  aboutText: s.about_text ?? undefined,
  aboutImage: s.about_image ?? undefined,
  aboutBadge: s.about_badge ?? undefined,
  footerText: s.footer_text ?? undefined,
  accentColor: s.accent_color ?? undefined,

  createdAt: s.created_at,
});

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
  seller_id: number | null;
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