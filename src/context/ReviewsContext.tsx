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
import { normalizeError } from '../utils/errors';
import type { Review } from '../types/database';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ReviewsFilter = 'pending' | 'approved' | 'rejected' | 'all';

interface ReviewsContextType {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  filter: ReviewsFilter;
  search: string;
  pendingCount: number;
  setFilter: (f: ReviewsFilter) => void;
  setSearch: (s: string) => void;
  refetch: () => Promise<void>;
  approve: (id: number) => Promise<void>;
  reject: (id: number) => Promise<void>;
  removeReview: (id: number) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

const FILTER_KEY = 'mora-reviews-filter-v1';
const SEARCH_KEY = 'mora-reviews-search-v1';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, sellerId } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<ReviewsFilter>(() =>
    loadFromStorage<ReviewsFilter>(FILTER_KEY, 'pending')
  );
  const [search, setSearchState] = useState<string>(() =>
    loadFromStorage<string>(SEARCH_KEY, '')
  );
  const [pendingCount, setPendingCount] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const pendingRefetchRef = useRef(false);
  const fetchingRef = useRef(false);

  // Продавец видит только отзывы на свои товары (и только одобренные)
  const isSeller = role === 'seller' && sellerId !== null;

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
    } catch {}
  }, [filter]);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_KEY, JSON.stringify(search));
    } catch {}
  }, [search]);

  const fetchPendingCount = useCallback(async () => {
    // Продавцу нечего модерировать — pending count не нужен
    if (isSeller) {
      if (mountedRef.current) setPendingCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('approved', false);

      if (error) throw error;
      if (mountedRef.current) setPendingCount(count ?? 0);
    } catch (e) {
      console.warn('[ReviewsContext] pending count failed:', e);
    }
  }, [isSeller]);

  const fetchReviews = useCallback(async () => {
    if (fetchingRef.current) {
      pendingRefetchRef.current = true;
      return;
    }
    fetchingRef.current = true;

    try {
      setError(null);

      // Для продавца: join через products, чтобы получить только его отзывы
      if (isSeller && sellerId !== null) {
        let productQuery = supabase
          .from('products')
          .select('id')
          .eq('seller_id', sellerId);

        const { data: sellerProducts } = await productQuery;
        const productIds = (sellerProducts ?? []).map((p) => p.id);

        if (productIds.length === 0) {
          if (mountedRef.current) setReviews([]);
          return;
        }

        let query = supabase
          .from('reviews')
          .select('*')
          .in('product_id', productIds)
          .eq('approved', true)
          .order('created_at', { ascending: false });

        if (search.trim()) {
          const q = search.trim();
          query = query.or(`author_name.ilike.%${q}%,text.ilike.%${q}%`);
        }

        const { data, error: dbError } = await query;
        if (dbError) throw dbError;
        if (mountedRef.current) setReviews(data ?? []);
        return;
      }

      // Для админа: обычная логика с фильтрами
      let query = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('approved', false);
      } else if (filter === 'approved') {
        query = query.eq('approved', true);
      } else if (filter === 'rejected') {
        query = query.eq('approved', false);
      }

      if (search.trim()) {
        const q = search.trim();
        query = query.or(`author_name.ilike.%${q}%,text.ilike.%${q}%`);
      }

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;

      if (mountedRef.current) setReviews(data ?? []);
    } catch (e) {
      const normalized = normalizeError(e);
      if (mountedRef.current) setError(normalized.message);
      console.error('[ReviewsContext] fetch failed:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        setTimeout(fetchReviews, 100);
      }
    }
  }, [filter, search, isSeller, sellerId]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchReviews();
    fetchPendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, isSeller, sellerId]);

  // Realtime: для продавца — все события (RLS отсечёт чужие),
  // для админа — все события
  useEffect(() => {
    if (!user) return;

    const channelName = isSeller
      ? `mora-reviews-seller-${sellerId}-${Math.random().toString(36).slice(2)}`
      : `mora-reviews-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          fetchReviews();
          if (!isSeller) fetchPendingCount();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSeller, sellerId]);

  const approve = async (id: number) => {
    const prev = reviews;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, approved: true } : r)));
    setPendingCount((c) => Math.max(0, c - 1));

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ approved: true })
        .eq('id', id);

      if (error) throw error;

      if (filter === 'pending') {
        setTimeout(() => {
          setReviews((rs) => rs.filter((r) => r.id !== id));
        }, 300);
      }
    } catch (e) {
      setReviews(prev);
      setPendingCount((c) => c + 1);
      throw normalizeError(e);
    }
  };

  const reject = async (id: number) => {
    const prev = reviews;
    setReviews((rs) => rs.filter((r) => r.id !== id));
    setPendingCount((c) => Math.max(0, c - 1));

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      setReviews(prev);
      setPendingCount((c) => c + 1);
      throw normalizeError(e);
    }
  };

  const removeReview = async (id: number) => {
    const prev = reviews;
    setReviews((rs) => rs.filter((r) => r.id !== id));

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      fetchPendingCount();
    } catch (e) {
      setReviews(prev);
      throw normalizeError(e);
    }
  };

  const setFilter = (f: ReviewsFilter) => setFilterState(f);
  const setSearch = (s: string) => setSearchState(s);

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        loading,
        error,
        filter,
        search,
        pendingCount,
        setFilter,
        setSearch,
        refetch: fetchReviews,
        approve,
        reject,
        removeReview,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
};