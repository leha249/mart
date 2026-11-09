import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { normalizeError, AuthError } from '../utils/errors';
import { navigate } from '../utils/navigate';

export type UserRole = 'admin' | 'seller' | 'pending' | 'guest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  sellerId: number | null;
  sellerName: string | null;
  signIn: (email: string, password: string) => Promise<UserRole>;
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

  const resolveRole = async (u: User | null): Promise<UserRole> => {
    if (!u) {
      setRole('guest');
      setSellerId(null);
      setSellerName(null);
      return 'guest';
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
        return 'admin';
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
          sessionStorage.setItem('mora-auth-error', 'blocked');
          return 'guest';
        }

        // 2.1.2. Pending — может войти, но только смотреть
        if (sellerData.status === 'pending') {
          setRole('pending');
          setSellerId(sellerData.id);
          setSellerName(sellerData.name);
          return 'pending';
        }

        // 2.1.3. Активен или на паузе — продавец
        setRole('seller');
        setSellerId(sellerData.id);
        setSellerName(sellerData.name);
        return 'seller';
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
      return 'guest';
    } catch (e) {
      console.error('[AuthContext] resolveRole failed:', e);
      setRole('guest');
      setSellerId(null);
      setSellerName(null);
      return 'guest';
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setRole('guest');
        setSellerId(null);
        setSellerName(null);

        if (window.location.pathname === '/admin') {
          navigate('/login');
        }
        return;
      }

      // Колбэк onAuthStateChange должен оставаться синхронным: запросы к
      // Supabase внутри него могут привести к дедлоку supabase-js.
      setTimeout(() => {
        if (!mounted) return;
        void resolveRole(session?.user ?? null);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Вход продавца/админа. Принимает email ИЛИ телефон:
   * телефон резолвится в email магазина на сервере (RPC
   * seller_login_email), потому что Supabase Auth умеет только email.
   *
   * Возвращает роль сразу после входа: без этого страница входа
   * успевала увести на /admin, где роль ещё 'guest', и гард выкидывал
   * обратно — «Добро пожаловать» есть, а кабинет не открылся.
   */
  const signIn = async (
    login: string,
    password: string
  ): Promise<UserRole> => {
    try {
      let email = login.trim();

      if (!email.includes('@')) {
        const digits = email.replace(/\D/g, '');
        if (digits.length < 10) {
          throw new AuthError('Введите email или телефон');
        }

        const { data, error } = await supabase.rpc('seller_login_email', {
          p_phone: digits,
        });
        if (error) throw error;
        if (!data) {
          throw new AuthError(
            'Аккаунт с таким телефоном не найден. Проверьте номер или войдите по email.'
          );
        }
        email = String(data);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      setSession(data.session ?? null);
      setUser(data.user ?? null);

      // Ждём определение роли, чтобы UI не гадал
      return await resolveRole(data.user ?? null);
    } catch (e) {
      throw normalizeError(e);
    }
  };

  /**
   * Выход из аккаунта.
   *
   * Важно: выход не должен зависеть от сети. Если Supabase не ответил
   * (VPN, блокировка, протухший токен), локальную сессию всё равно
   * вычищаем — иначе пользователь остаётся в кабинете навсегда.
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AuthContext] signOut через сеть не удался:', e);
    }

    // Локальный выход: чистит сессию в localStorage без запроса к серверу.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('[AuthContext] локальный signOut:', e);
    }

    // Страховка: убираем оставшиеся токены Supabase вручную.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.includes('auth-token')) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // приватный режим — не критично
    }

    setUser(null);
    setSession(null);
    setRole('guest');
    setSellerId(null);
    setSellerName(null);
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