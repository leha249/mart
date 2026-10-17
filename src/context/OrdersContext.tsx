import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { ordersService } from '../services/orders';
import type { OrdersStats, OrderFilters } from '../services/orders';
import type { Order, OrderStatus } from '../types/database';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

interface OrdersContextType {
  orders: Order[];
  stats: OrdersStats | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  filters: OrderFilters;
  setStatusFilter: (status: OrderStatus | 'all') => void;
  setSearchFilter: (search: string) => void;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  updateStatus: (id: number, status: OrderStatus) => Promise<void>;
  removeOrder: (id: number) => Promise<void>;
  newOrdersCount: number;
  markAllSeen: () => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

const STATUS_KEY = 'mora-orders-status-v1';
const SEARCH_KEY = 'mora-orders-search-v1';
const SEEN_KEY_BASE = 'mora-orders-seen-v1';

const loadInitial = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, sellerId } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrdersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilterState] = useState<OrderStatus | 'all'>(
    () => loadInitial(STATUS_KEY, 'all' as OrderStatus | 'all')
  );
  const [search, setSearchState] = useState<string>(() =>
    loadInitial(SEARCH_KEY, '')
  );
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const effectiveSellerId = role === 'seller' ? sellerId : null;

  // 🐛 ИСПРАВЛЕНИЕ БАГА 3: отдельный SEEN_KEY для продавцов
  const seenKey = effectiveSellerId
    ? `${SEEN_KEY_BASE}-seller-${effectiveSellerId}`
    : SEEN_KEY_BASE;

  useEffect(() => {
    try {
      localStorage.setItem(STATUS_KEY, JSON.stringify(statusFilter));
    } catch {}
  }, [statusFilter]);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_KEY, JSON.stringify(search));
    } catch {}
  }, [search]);

  const fetchFirstPage = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);
      const [page, st] = await Promise.all([
        ordersService.getPage({
          status: statusFilter,
          search,
          limit: PAGE_SIZE,
          offset: 0,
          sellerId: effectiveSellerId,
        }),
        ordersService.getStats(effectiveSellerId),
      ]);

      if (!mountedRef.current) return;
      setOrders(page.orders);
      setStats(st);
      setHasMore(page.hasMore);
      setOffset(page.orders.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки заказов';
      if (mountedRef.current) setError(msg);
      console.error('OrdersContext fetchFirstPage error:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
    }
  }, [statusFilter, search, effectiveSellerId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || fetchingRef.current) return;
    setLoadingMore(true);
    fetchingRef.current = true;

    try {
      const page = await ordersService.getPage({
        status: statusFilter,
        search,
        limit: PAGE_SIZE,
        offset,
        sellerId: effectiveSellerId,
      });

      if (!mountedRef.current) return;
      setOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const newOnes = page.orders.filter((o) => !existingIds.has(o.id));
        return [...prev, ...newOnes];
      });
      setHasMore(page.hasMore);
      setOffset((prev) => prev + page.orders.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
      if (mountedRef.current) setError(msg);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [loadingMore, hasMore, statusFilter, search, offset, effectiveSellerId]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setOffset(0);
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Realtime-подписка
  useEffect(() => {
    if (!user) return;

    const channelName =
      role === 'seller'
        ? `mora-orders-seller-${sellerId}-${Math.random().toString(36).slice(2)}`
        : `mora-orders-admin-${Math.random().toString(36).slice(2)}`;

    const config =
      role === 'seller' && sellerId !== null
        ? {
            event: '*' as const,
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${sellerId}`,
          }
        : {
            event: '*' as const,
            schema: 'public',
            table: 'orders',
          };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newOrder = payload.new as Order;
          // 🐛 ИСПРАВЛЕНИЕ БАГА 4: не увеличиваем вручную — пересчитается ниже
          if (
            statusFilter === 'all' ||
            statusFilter === (newOrder.status as OrderStatus)
          ) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          }
          ordersService.getStats(effectiveSellerId).then((st) => {
            if (mountedRef.current) setStats(st);
          });
          return;
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          );
          ordersService.getStats(effectiveSellerId).then((st) => {
            if (mountedRef.current) setStats(st);
          });
          return;
        }

        if (payload.eventType === 'DELETE' && payload.old) {
          const deleted = payload.old as { id: number };
          setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
          ordersService.getStats(effectiveSellerId).then((st) => {
            if (mountedRef.current) setStats(st);
          });
          return;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [statusFilter, user, role, sellerId, effectiveSellerId]);

  // 🐛 ИСПРАВЛЕНИЕ БАГА 4: пересчёт счётчика при изменении orders или seenKey
  useEffect(() => {
    const seen = loadInitial<number[]>(seenKey, []);
    const seenSet = new Set(seen);
    const unseen = orders.filter((o) => !seenSet.has(o.id) && o.status === 'new');
    setNewOrdersCount(unseen.length);
  }, [orders, seenKey]);

  const markAllSeen = useCallback(() => {
    const ids = orders.map((o) => o.id);
    try {
      localStorage.setItem(seenKey, JSON.stringify(ids));
    } catch {}
    setNewOrdersCount(0);
  }, [orders, seenKey]);

  const setStatusFilter = (status: OrderStatus | 'all') => {
    setStatusFilterState(status);
  };

  const setSearchFilter = (q: string) => {
    setSearchState(q);
  };

  const updateStatus = async (id: number, status: OrderStatus) => {
    const prevOrders = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );

    try {
      const updated = await ordersService.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      const st = await ordersService.getStats(effectiveSellerId);
      if (mountedRef.current) setStats(st);
    } catch (e) {
      setOrders(prevOrders);
      throw e;
    }
  };

  const removeOrder = async (id: number) => {
    const prevOrders = orders;
    setOrders((prev) => prev.filter((o) => o.id !== id));

    try {
      await ordersService.remove(id);
      const st = await ordersService.getStats(effectiveSellerId);
      if (mountedRef.current) setStats(st);
    } catch (e) {
      setOrders(prevOrders);
      throw e;
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        stats,
        loading,
        loadingMore,
        error,
        hasMore,
        filters: { status: statusFilter, search },
        setStatusFilter,
        setSearchFilter,
        loadMore,
        refetch: fetchFirstPage,
        updateStatus,
        removeOrder,
        newOrdersCount,
        markAllSeen,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};