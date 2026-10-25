import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'mora-customer-session-v1';

interface CustomerSession {
  phone: string;
  name?: string;
  verifiedAt: string;
}

interface CustomerContextType {
  session: CustomerSession | null;
  isAuthenticated: boolean;
  requestCode: (phone: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  verifyCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  setCustomerName: (name: string) => void;
  signOut: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

const loadSession = (): CustomerSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerSession;
  } catch {
    return null;
  }
};

const normalizePhone = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<CustomerSession | null>(loadSession);

  // Сохраняем сессию в localStorage
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [session]);

  /**
   * Запросить код подтверждения.
   * Пока возвращает код клиенту (для теста), потом — отправка SMS.
   */
  const requestCode = useCallback(
    async (
      phone: string
    ): Promise<{ success: boolean; code?: string; error?: string }> => {
      const normalized = normalizePhone(phone);
      if (normalized.length < 10) {
        return { success: false, error: 'Некорректный номер телефона' };
      }

      try {
        const { data, error } = await supabase.rpc('create_customer_code', {
          phone_input: phone,
        });

        if (error) throw error;

        return { success: true, code: data as string };
      } catch (e) {
        console.error('[CustomerContext.requestCode]', e);
        return {
          success: false,
          error:
            e instanceof Error ? e.message : 'Не удалось создать код',
        };
      }
    },
    []
  );

  /**
   * Проверить код и войти в кабинет.
   */
  const verifyCode = useCallback(
    async (
      phone: string,
      code: string
    ): Promise<{ success: boolean; error?: string }> => {
      const normalized = normalizePhone(phone);
      if (normalized.length < 10) {
        return { success: false, error: 'Некорректный номер телефона' };
      }

      const trimmedCode = code.trim();
      if (!/^\d{4}$/.test(trimmedCode)) {
        return { success: false, error: 'Код должен содержать 4 цифры' };
      }

      try {
        const { data, error } = await supabase.rpc('verify_customer_code', {
          phone_input: phone,
          code_input: trimmedCode,
        });

        if (error) throw error;

        if (!data) {
          return { success: false, error: 'Неверный или истёкший код' };
        }

        setSession({
          phone: normalized,
          verifiedAt: new Date().toISOString(),
        });

        return { success: true };
      } catch (e) {
        console.error('[CustomerContext.verifyCode]', e);
        return {
          success: false,
          error:
            e instanceof Error ? e.message : 'Ошибка проверки кода',
        };
      }
    },
    []
  );

  const setCustomerName = useCallback((name: string) => {
    setSession((prev) => (prev ? { ...prev, name: name.trim() } : prev));
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
  }, []);

  return (
    <CustomerContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        requestCode,
        verifyCode,
        setCustomerName,
        signOut,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};