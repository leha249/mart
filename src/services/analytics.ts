import { supabase } from '../lib/supabase';
import { normalizeError } from '../utils/errors';
import type { OrderStatus } from '../types/database';

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_image: string;
  sold_count: number;
  revenue: number;
}

export interface RevenueDay {
  day: string;
  orders_count: number;
  revenue: number;
}

export interface DashboardMetrics {
  revenue: number;
  revenuePrev: number;
  orders: number;
  ordersPrev: number;
  avgOrder: number;
  avgOrderPrev: number;
  uniqueCustomers: number;
  conversionRate: number;
}

export interface StatusDistribution {
  status: OrderStatus;
  value: number;
}

export interface HourlyActivity {
  data: number[][]; // 7 дней × 8 интервалов (0, 3, 6, 9, 12, 15, 18, 21)
}

const getDateFrom = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const analyticsService = {
  async getMetrics(days: number = 30): Promise<DashboardMetrics> {
    try {
      const now = Date.now();
      const fromCurrent = getDateFrom(days);
      const fromPrev = getDateFrom(days * 2);
      const toPrev = new Date(now - days * 86400000).toISOString();

      const [current, previous] = await Promise.all([
        supabase
          .from('orders')
          .select('total, status, customer_phone')
          .gte('created_at', fromCurrent)
          .neq('status', 'cancelled'),
        supabase
          .from('orders')
          .select('total, status, customer_phone')
          .gte('created_at', fromPrev)
          .lt('created_at', toPrev)
          .neq('status', 'cancelled'),
      ]);

      if (current.error) throw current.error;
      if (previous.error) throw previous.error;

      const cur = current.data ?? [];
      const prev = previous.data ?? [];

      const revenue = cur.reduce((s, o) => s + o.total, 0);
      const revenuePrev = prev.reduce((s, o) => s + o.total, 0);
      const orders = cur.length;
      const ordersPrev = prev.length;
      const avgOrder = orders > 0 ? Math.round(revenue / orders) : 0;
      const avgOrderPrev =
        ordersPrev > 0 ? Math.round(revenuePrev / ordersPrev) : 0;
      const uniqueCustomers = new Set(cur.map((o) => o.customer_phone)).size;
      const conversionRate =
        orders > 0 ? (uniqueCustomers / orders) * 100 : 0;

      return {
        revenue,
        revenuePrev,
        orders,
        ordersPrev,
        avgOrder,
        avgOrderPrev,
        uniqueCustomers,
        conversionRate,
      };
    } catch (e) {
      console.error('[analyticsService.getMetrics]', e);
      throw normalizeError(e);
    }
  },

  async getRevenueByDay(days: number = 30): Promise<RevenueDay[]> {
    try {
      const { data, error } = await supabase.rpc('get_revenue_by_day', {
        days_count: days,
      });

      if (error) throw error;

      // Заполняем пропущенные дни нулями
      const map = new Map<string, RevenueDay>();
      (data ?? []).forEach((d: RevenueDay) => {
        const day = d.day.slice(0, 10);
        map.set(day, { ...d, day });
      });

      const result: RevenueDay[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const existing = map.get(key);
        result.push(
          existing || { day: key, orders_count: 0, revenue: 0 }
        );
      }

      return result;
    } catch (e) {
      console.error('[analyticsService.getRevenueByDay]', e);
      throw normalizeError(e);
    }
  },

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    try {
      const { data, error } = await supabase.rpc('get_top_products', {
        limit_count: limit,
      });

      if (error) throw error;
      return (data ?? []) as TopProduct[];
    } catch (e) {
      console.error('[analyticsService.getTopProducts]', e);
      throw normalizeError(e);
    }
  },

  async getStatusDistribution(): Promise<StatusDistribution[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status');

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data ?? []).forEach((o) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });

      const statuses: OrderStatus[] = [
        'new',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];

      return statuses.map((status) => ({
        status,
        value: counts[status] || 0,
      }));
    } catch (e) {
      console.error('[analyticsService.getStatusDistribution]', e);
      throw normalizeError(e);
    }
  },

  async getHourlyActivity(days: number = 30): Promise<number[][]> {
    try {
      const from = getDateFrom(days);
      const { data, error } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', from)
        .neq('status', 'cancelled');

      if (error) throw error;

      // 7 дней × 8 трёхчасовых интервалов
      const grid: number[][] = Array.from({ length: 7 }, () =>
        Array(8).fill(0)
      );

      (data ?? []).forEach((o) => {
        const d = new Date(o.created_at);
        // JS: 0 = воскресенье, нужно 0 = понедельник
        const jsDay = d.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        const hour = d.getHours();
        const intervalIndex = Math.floor(hour / 3);
        grid[dayIndex][intervalIndex]++;
      });

      return grid;
    } catch (e) {
      console.error('[analyticsService.getHourlyActivity]', e);
      throw normalizeError(e);
    }
  },
};