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

  const resolveRole = async (u: User | null): Promise<void> => {
    if (!u) {
      setRole('guest');
      setSellerId(null);
      setSellerName(null);
      return;
    }

    try {
      // 1. Проверяем, админ ли
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', u.id)
        .maybeSingle();

      if (adminError) {
        console.warn('[AuthContext] admin lookup error:', adminError);
      }

      if (adminData) {
        setRole('admin');
        setSellerId(null);
        setSellerName(null);
        return;
      }

      // 2. Проверяем, продавец ли
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id, name, status')
        .eq('user_id', u.id)
        .maybeSingle();

      if (sellerError) {
        console.warn('[AuthContext] seller lookup error:', sellerError);
      }

      // 2.1. Найден продавец
      if (sellerData) {
        // 2.1.1. Заблокирован — выкидываем
        if (sellerData.status === 'blocked') {
          console.warn('[AuthContext] Account blocked, signing out');
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setRole('guest');
          setSellerId(null);
          setSellerName(null);
          // Сообщение покажем через toast (в Admin.tsx)
          sessionStorage.setItem('mora-auth-error', 'blocked');
          return;
        }

        // 2.1.2. Активен или на паузе — продавец
        setRole('seller');
        setSellerId(sellerData.id);
        setSellerName(sellerData.name);
        return;
      }

      // 3. Не админ и не продавец — удалённый аккаунт
      console.warn('[AuthContext] User has no role, signing out');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole('guest');
      setSellerId(null);
      setSellerName(null);
      sessionStorage.setItem('mora-auth-error', 'no-role');
    } catch (e) {
      console.error('[AuthContext] resolveRole failed:', e);
      // При ошибке — не даём доступ
      setRole('guest');
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

      if (event === 'SIGNED_OUT') {
        setRole('guest');
        setSellerId(null);
        setSellerName(null);

        if (window.location.pathname === '/admin') {
          window.history.pushState({}, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }

      // При входе / обновлении токена — пересчитываем роль
      await resolveRole(session?.user ?? null);
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