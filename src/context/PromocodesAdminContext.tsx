import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { promocodesService } from '../services/promocodes';
import type { Promocode } from '../types/database';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ContextType {
  promocodes: Promocode[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** sellerId для использования в создании промокодов */
  currentSellerId: number | null;
}

const Ctx = createContext<ContextType | undefined>(undefined);

export const PromocodesAdminProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user, role, sellerId } = useAuth();

  const [promocodes, setPromocodes] = useState<Promocode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Продавец видит только свои промокоды; админ — все
  const effectiveSellerId = role === 'seller' ? sellerId : null;

  const fetch = async () => {
    try {
      setError(null);
      const data = await promocodesService.getAll(effectiveSellerId);
      if (mountedRef.current) setPromocodes(data);
    } catch (e) {
      if (mountedRef.current)
        setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetch();

    const channelName =
      role === 'seller' && sellerId !== null
        ? `mora-promos-seller-${sellerId}-${Math.random().toString(36).slice(2)}`
        : `mora-promos-${Math.random().toString(36).slice(2)}`;

    const config =
      role === 'seller' && sellerId !== null
        ? {
            event: '*' as const,
            schema: 'public',
            table: 'promocodes',
            filter: `seller_id=eq.${sellerId}`,
          }
        : {
            event: '*' as const,
            schema: 'public',
            table: 'promocodes',
          };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, () => fetch())
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
  }, [user, role, sellerId, effectiveSellerId]);

  return (
    <Ctx.Provider
      value={{
        promocodes,
        loading,
        error,
        refetch: fetch,
        currentSellerId: sellerId,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const usePromocodesAdmin = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      'usePromocodesAdmin must be used within PromocodesAdminProvider'
    );
  return ctx;
};