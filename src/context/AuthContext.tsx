import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { normalizeError } from '../utils/errors';

export type UserRole = 'admin' | 'seller' | 'guest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  sellerId: number | null;
  sellerName: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('guest');
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);

  // Определяем роль по наличию записи в sellers
  const resolveRole = async (u: User | null): Promise<void> => {
    if (!u) {
      setRole('guest');
      setSellerId(null);
      setSellerName(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('id, name')
        .eq('user_id', u.id)
        .maybeSingle();

      if (error) {
        console.warn('[AuthContext] seller lookup error:', error);
        // Если ошибка — считаем админом (он видит всё)
        setRole('admin');
        setSellerId(null);
        setSellerName(null);
        return;
      }

      if (data) {
        setRole('seller');
        setSellerId(data.id);
        setSellerName(data.name);
      } else {
        setRole('admin');
        setSellerId(null);
        setSellerName(null);
      }
    } catch (e) {
      console.error('[AuthContext] resolveRole failed:', e);
      setRole('admin');
      setSellerId(null);
      setSellerName(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[AuthContext] session error:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        await resolveRole(session?.user ?? null);
        if (mounted) setLoading(false);
      })
      .catch((e) => {
        console.error('[AuthContext] getSession failed:', e);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      await resolveRole(session?.user ?? null);

      if (
        event === 'SIGNED_OUT' ||
        (event === 'TOKEN_REFRESHED' && !session)
      ) {
        if (window.location.pathname === '/admin') {
          window.history.pushState({}, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (e) {
      throw normalizeError(e);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setRole('guest');
      setSellerId(null);
      setSellerName(null);
    } catch (e) {
      throw normalizeError(e);
    }
  };

  const refreshRole = async () => {
    await resolveRole(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        sellerId,
        sellerName,
        signIn,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};