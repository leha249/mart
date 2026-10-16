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
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const pendingRefetchRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchCategories = async () => {
    if (fetchingRef.current) {
      pendingRefetchRef.current = true;
      return;
    }
    fetchingRef.current = true;

    try {
      setError(null);
      const data = await categoriesService.getAll();
      if (mountedRef.current) setCategories(data);
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

    const channel = supabase
      .channel(`mora-categories-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newCat = payload.new as Category;
            setCategories((prev) => {
              if (prev.some((c) => c.id === newCat.id)) return prev;
              return [...prev, newCat].sort(
                (a, b) =>
                  a.sort_order - b.sort_order || a.name.localeCompare(b.name)
              );
            });
            return;
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as Category;
            setCategories((prev) =>
              prev
                .map((c) => (c.id === updated.id ? updated : c))
                .sort(
                  (a, b) =>
                    a.sort_order - b.sort_order ||
                    a.name.localeCompare(b.name)
                )
            );
            return;
          }

          fetchCategories();
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
  }, []);

  return (
    <CategoriesContext.Provider
      value={{ categories, loading, error, refetch: fetchCategories }}
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