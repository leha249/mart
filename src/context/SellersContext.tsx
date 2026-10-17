import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { sellersService } from '../services/sellers';
import type { UISeller } from '../types/database';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SellersContextType {
  sellers: UISeller[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SellersContext = createContext<SellersContextType | undefined>(undefined);

export const SellersProvider = ({ children }: { children: ReactNode }) => {
  const { user, role } = useAuth();

  const [sellers, setSellers] = useState<UISeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Админ видит всех продавцов, все остальные — только активных
  const isAdmin = role === 'admin';

  const fetch = async () => {
    try {
      setError(null);
      const data = isAdmin
        ? await sellersService.getAll()
        : await sellersService.getActive();
      if (mountedRef.current) setSellers(data);
    } catch (e) {
      if (mountedRef.current)
        setError(e instanceof Error ? e.message : 'Ошибка загрузки продавцов');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetch();

    const channelName = `mora-sellers-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sellers' },
        () => fetch()
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
  }, [user, isAdmin]);

  return (
    <SellersContext.Provider
      value={{ sellers, loading, error, refetch: fetch }}
    >
      {children}
    </SellersContext.Provider>
  );
};

export const useSellers = () => {
  const ctx = useContext(SellersContext);
  if (!ctx)
    throw new Error('useSellers must be used within SellersProvider');
  return ctx;
};