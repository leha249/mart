import { supabase } from '../lib/supabase';
import { ValidationError, normalizeError } from '../utils/errors';
import type { Order, OrderItem, OrderStatus } from '../types/database';
import { productsService } from './products';

export interface OrderFilters {
  status?: OrderStatus | 'all';
  search?: string;
  limit?: number;
  offset?: number;
  sellerId?: number | null;
}

export interface OrdersStats {
  total: number;
  new: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  revenueDelivered: number;
}

export interface OrdersPage {
  orders: Order[];
  total: number;
  hasMore: boolean;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  total: number;
  promo_code?: string;
  promo_discount?: number;
  seller_id?: number | null;
}

const validateOrder = (order: CreateOrderInput): void => {
  if (!order.customer_name?.trim()) throw new ValidationError('Имя обязательно');
  if (!order.customer_phone?.trim())
    throw new ValidationError('Телефон обязателен');
  if (order.customer_phone.trim().length < 5)
    throw new ValidationError('Некорректный телефон');
  if (!order.items || order.items.length === 0)
    throw new ValidationError('Корзина пуста');
  if (order.total <= 0) throw new ValidationError('Некорректная сумма');
  if (
    order.customer_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer_email)
  ) {
    throw new ValidationError('Некорректный email');
  }
};

export const ordersService = {
  async create(order: CreateOrderInput): Promise<Order> {
    validateOrder(order);

    try {
      const payload: Record<string, unknown> = {
        customer_name: order.customer_name.trim(),
        customer_phone: order.customer_phone.trim(),
        customer_email: order.customer_email?.trim() || null,
        items: order.items,
        total: order.total,
      };

      if (order.promo_code) {
        payload.promo_code = order.promo_code;
        payload.promo_discount = order.promo_discount ?? 0;
      }

      if (order.seller_id !== undefined && order.seller_id !== null) {
        payload.seller_id = order.seller_id;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // ✅ После успешного создания заказа — увеличиваем purchases у товаров
      // Не блокируем: если упадёт — заказ уже создан, не страшно
      const purchaseItems = order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));
      productsService.incrementPurchases(purchaseItems).catch((e) => {
        console.warn('[ordersService.create] incrementPurchases failed:', e);
      });

      return data;
    } catch (e) {
      console.error('[ordersService.create]', e);
      throw normalizeError(e);
    }
  },

  async getPage(filters: OrderFilters = {}): Promise<OrdersPage> {
    const {
      status = 'all',
      search = '',
      limit = 20,
      offset = 0,
      sellerId = null,
    } = filters;

    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (sellerId !== null) {
        query = query.eq('seller_id', sellerId);
      }

      if (status !== 'all') query = query.eq('status', status);

      if (search.trim()) {
        const q = search.trim();
        query = query.or(
          `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const total = count ?? 0;
      return {
        orders: data ?? [],
        total,
        hasMore: offset + limit < total,
      };
    } catch (e) {
      console.error('[ordersService.getPage]', e);
      throw normalizeError(e);
    }
  },

  async getById(id: number): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async remove(id: number): Promise<void> {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  async getStats(sellerId: number | null = null): Promise<OrdersStats> {
    try {
      let query = supabase.from('orders').select('status, total');

      if (sellerId !== null) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const orders = data ?? [];
      const stats: OrdersStats = {
        total: orders.length,
        new: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        revenue: 0,
        revenueDelivered: 0,
      };

      for (const o of orders) {
        stats[o.status as keyof OrdersStats]++;
        if (o.status !== 'cancelled') stats.revenue += o.total;
        if (o.status === 'delivered') stats.revenueDelivered += o.total;
      }

      return stats;
    } catch (e) {
      throw normalizeError(e);
    }
  },
};