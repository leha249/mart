import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { categoriesService } from '../services/categories';
import type { Category } from '../types/database';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CategoriesContextType {
  /**
   * Категории для вкладки «Категории»:
   * - продавец → только свои (seller_id = его id)
   * - админ → только общие (seller_id IS NULL)
   * - гость → общие
   */
  categories: Category[];
  /** Только общие (seller_id IS NULL) — для селекта «Категория» в товаре и табов на главной */
  commonCategories: Category[];
  /** Только свои (seller_id = текущий продавец) — для селекта «Подкатегория» */
  myCategories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, sellerId } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [commonCategories, setCommonCategories] = useState<Category[]>([]);
  const [myCategories, setMyCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const pendingRefetchRef = useRef(false);
  const fetchingRef = useRef(false);

  const isSeller = role === 'seller' && sellerId !== null;
  const isAdmin = role === 'admin';

  const fetchCategories = async () => {
    if (fetchingRef.current) {
      pendingRefetchRef.current = true;
      return;
    }
    fetchingRef.current = true;

    try {
      setError(null);

      if (isSeller) {
        // Продавец:
        // - categories (вкладка «Категории») = только свои
        // - commonCategories (селект в товаре) = общие
        // - myCategories (селект подкатегории) = свои
        const [common, mine] = await Promise.all([
          categoriesService.getCommon(),
          categoriesService.getMine(sellerId),
        ]);
        if (!mountedRef.current) return;
        setCommonCategories(common);
        setMyCategories(mine);
        setCategories(mine);
      } else if (isAdmin) {
        // Админ: и вкладка, и селект — только общие
        const common = await categoriesService.getCommon();
        if (!mountedRef.current) return;
        setCommonCategories(common);
        setMyCategories([]);
        setCategories(common);
      } else {
        // Гость: только общие
        const common = await categoriesService.getCommon();
        if (!mountedRef.current) return;
        setCommonCategories(common);
        setMyCategories([]);
        setCategories(common);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки категорий';
      if (mountedRef.current) setError(msg);
      console.error('CategoriesContext error:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        setTimeout(fetchCategories, 100);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchCategories();

    const channelName = isSeller
      ? `mora-categories-seller-${sellerId}-${Math.random()
          .toString(36)
          .slice(2)}`
      : `mora-categories-${Math.random().toString(36).slice(2)}`;

    // Продавцу нужны и общие, и свои — без filter, фильтруем на клиенте
    const config = {
      event: '*' as const,
      schema: 'public',
      table: 'categories',
    };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, () => {
        fetchCategories();
      })
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
  }, [user, role, sellerId]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        commonCategories,
        myCategories,
        loading,
        error,
        refetch: fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx)
    throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
};