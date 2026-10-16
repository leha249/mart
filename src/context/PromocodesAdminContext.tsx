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
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ContextType {
  promocodes: Promocode[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const Ctx = createContext<ContextType | undefined>(undefined);

export const PromocodesAdminProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [promocodes, setPromocodes] = useState<Promocode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  const fetch = async () => {
    try {
      setError(null);
      const data = await promocodesService.getAll();
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

    const channel = supabase
      .channel(`mora-promos-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promocodes' },
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
  }, []);

  return (
    <Ctx.Provider value={{ promocodes, loading, error, refetch: fetch }}>
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