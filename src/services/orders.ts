import { supabase } from '../lib/supabase';
import { ValidationError, normalizeError } from '../utils/errors';
import type { Order, OrderItem, OrderStatus } from '../types/database';

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
  marketing_consent?: boolean;
}

/** Позиция в группе заказа: сервер сам подтянет название, цену и картинку. */
export interface CreateOrdersBatchItem {
  id: number;
  quantity: number;
  size?: string | null;
}

/** Группа позиций одного продавца — станет одним заказом. */
export interface CreateOrdersBatchGroup {
  seller_id: number | null;
  items: CreateOrdersBatchItem[];
}

export interface CreateOrdersBatchInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  groups: CreateOrdersBatchGroup[];
  promo_code?: string | null;
  marketing_consent?: boolean;
}

/** Ключ localStorage, где лежат токены доступа к заказам этого устройства. */
const ORDER_TOKENS_KEY = 'mora-order-tokens-v1';
/** Сколько последних заказов помним на устройстве. */
const MAX_ORDER_TOKENS = 100;

/**
 * Токены заказов покупателя. Прямой доступ к таблице orders анониму закрыт,
 * поэтому список своих заказов собираем по access_token, сохранённым локально.
 */
export const orderTokens = {
  list(): string[] {
    try {
      const raw = localStorage.getItem(ORDER_TOKENS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (token): token is string =>
          typeof token === 'string' && token.trim().length > 0
      );
    } catch {
      // localStorage может быть недоступен (приватный режим, запрет cookies)
      return [];
    }
  },

  add(token: string): void {
    const value = token?.trim();
    if (!value) return;
    try {
      const tokens = orderTokens.list().filter((t) => t !== value);
      tokens.push(value);
      // Обрезаем с начала: храним только MAX_ORDER_TOKENS последних заказов
      localStorage.setItem(
        ORDER_TOKENS_KEY,
        JSON.stringify(tokens.slice(-MAX_ORDER_TOKENS))
      );
    } catch {
      // Молча: недоступное хранилище не должно ломать оформление заказа
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(ORDER_TOKENS_KEY);
    } catch {
      // Молча: недоступное хранилище не должно ломать интерфейс
    }
  },
};

const validateOrder = (order: CreateOrderInput): void => {
  // Правила синхронизированы с серверной проверкой create_order:
  // имя — минимум 2 символа, телефон — минимум 10 цифр.
  if ((order.customer_name ?? '').trim().length < 2)
    throw new ValidationError('Укажите имя');
  if ((order.customer_phone ?? '').replace(/\D/g, '').length < 10)
    throw new ValidationError('Укажите корректный телефон');
  if (!order.items || order.items.length === 0)
    throw new ValidationError('Корзина пуста');
  // 0 допустим (100% скидка), отрицательная сумма — нет.
  if (!Number.isFinite(order.total) || order.total < 0)
    throw new ValidationError('Некорректная сумма');
  if (
    order.customer_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer_email)
  ) {
    throw new ValidationError('Некорректный email');
  }
};

const validateBatchOrder = (order: CreateOrdersBatchInput): void => {
  // Сумму и скидку считает сервер (create_orders_batch), поэтому total здесь
  // не проверяем — только контакты и состав корзины.
  if ((order.customer_name ?? '').trim().length < 2)
    throw new ValidationError('Укажите имя');
  if ((order.customer_phone ?? '').replace(/\D/g, '').length < 10)
    throw new ValidationError('Укажите корректный телефон');
  if (!Array.isArray(order.groups) || order.groups.length === 0)
    throw new ValidationError('Корзина пуста');
  if (order.groups.some((group) => !group.items || group.items.length === 0))
    throw new ValidationError('Корзина пуста');
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
      // Заказ создаём через security definer RPC: аноним не может читать
      // таблицу orders, поэтому прямой insert с возвратом строки не проходит.
      const { data: created, error } = await supabase.rpc('create_order', {
        p_customer_name: order.customer_name.trim(),
        p_customer_phone: order.customer_phone.trim(),
        p_customer_email: order.customer_email?.trim() || null,
        p_items: order.items,
        p_total: order.total,
        p_seller_id: order.seller_id ?? null,
        p_promo_code: order.promo_code ?? null,
        p_promo_discount: order.promo_code
          ? order.promo_discount ?? 0
          : null,
        p_marketing_consent: order.marketing_consent ?? false,
      });

      if (error) throw error;

      const data = created as Order | null;
      if (!data?.id) throw new Error('Заказ не создан');

      // Сервер сам увеличивает purchases/promo usage внутри create_order,
      // а в ответе отдаёт access_token — сохраняем его на устройстве.
      if (data.access_token) orderTokens.add(data.access_token);

      return data;
    } catch (e) {
      console.error('[ordersService.create]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Оформление корзины одним атомарным вызовом: сервер создаёт заказы по
   * группам продавцов в одной транзакции. При любой ошибке (нет товара,
   * лимит, промокод) не создаётся ни одного заказа.
   */
  async createMany(input: CreateOrdersBatchInput): Promise<Order[]> {
    validateBatchOrder(input);

    try {
      const groups = input.groups.map((group) => ({
        seller_id: group.seller_id ?? null,
        // Сервер принимает только id/quantity/size и сам берёт цену из БД.
        items: group.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          size: item.size ?? null,
        })),
      }));

      const { data: created, error } = await supabase.rpc(
        'create_orders_batch',
        {
          p_customer_name: input.customer_name.trim(),
          p_customer_phone: input.customer_phone.trim(),
          p_customer_email: input.customer_email?.trim() || null,
          p_groups: groups,
          p_promo_code: input.promo_code?.trim() || null,
          p_marketing_consent: input.marketing_consent ?? false,
        }
      );

      if (error) throw error;

      const orders = ((created ?? []) as Order[]).filter(
        (order) => order && typeof order.id === 'number'
      );
      if (orders.length === 0) throw new Error('Заказ не создан');

      // access_token приходит на каждый заказ — сохраняем все, чтобы
      // покупатель видел их в «Моих заказах».
      for (const order of orders) {
        if (order.access_token) orderTokens.add(order.access_token);
      }

      return orders;
    } catch (e) {
      console.error('[ordersService.createMany]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Заказы по токенам доступа. Выборка заказов по номеру телефона
   * анониму больше недоступна, поэтому покупатель видит только те заказы,
   * чьи access_token сохранены на его устройстве.
   */
  async getByTokens(tokens: string[]): Promise<Order[]> {
    if (!tokens || tokens.length === 0) return [];

    try {
      const { data, error } = await supabase.rpc('get_orders_by_tokens', {
        p_tokens: tokens,
      });

      if (error) throw error;
      return (data ?? []) as Order[];
    } catch (e) {
      console.error('[ordersService.getByTokens]', e);
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

  /** Продавец отмечает оплату: деньги идут напрямую, платформа фиксирует факт. */
  async updatePaymentStatus(
    id: number,
    status: 'unpaid' | 'paid' | 'refunded'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      throw normalizeError(e);
    }
  },

  /** Продавец вписывает трек-номер вручную (без API перевозчика). */
  async updateTracking(
    id: number,
    carrier: string | null,
    trackingNumber: string | null
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          carrier,
          tracking_number: trackingNumber?.trim() || null,
        })
        .eq('id', id);
      if (error) throw error;
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