import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { errorMessage } from '../utils/errors';

const STORAGE_KEY = 'mora-customer-session-v1';

interface CustomerSession {
  phone: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  customerId?: number;
  verifiedAt: string;
}

export interface RegisterCustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface CustomerContextType {
  session: CustomerSession | null;
  isAuthenticated: boolean;
  /**
   * `code` приходит только в demo-режиме (флаг otp_demo в БД).
   * В обычном режиме сервер возвращает null — код уходит по SMS.
   */
  requestCode: (
    phone: string
  ) => Promise<{ success: boolean; code?: string | null; error?: string }>;
  verifyCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  /** Регистрация покупателя: имя, фамилия, телефон, email. */
  register: (
    input: RegisterCustomerInput
  ) => Promise<{ success: boolean; error?: string }>;
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
   *
   * Код клиенту не возвращается, кроме demo-режима: флаг `otp_demo`
   * в таблице app_settings включает показ кода на экране (для локальных
   * тестов). В обычном режиме код уходит по SMS — провайдер ещё не
   * подключён, поэтому вход в кабинет там недоступен.
   */
  const requestCode = useCallback(
    async (
      phone: string
    ): Promise<{ success: boolean; code?: string | null; error?: string }> => {
      // Мусор в номере не «вырезаем молча»: иначе +7 999 000-00-0% станет
      // другим валидным номером и код уйдёт не туда.
      if (!/^[\d\s()+\-]+$/.test(phone.trim())) {
        return { success: false, error: 'Некорректный номер телефона' };
      }

      const normalized = normalizePhone(phone);
      if (normalized.length < 10 || normalized.length > 15) {
        return { success: false, error: 'Некорректный номер телефона' };
      }

      try {
        const { data, error } = await supabase.rpc('create_customer_code', {
          phone_input: phone,
        });

        if (error) throw error;

        return { success: true, code: (data as string | null) ?? null };
      } catch (e) {
        console.error('[CustomerContext.requestCode]', e);
        return { success: false, error: errorMessage(e, 'Не удалось создать код') };
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
          error: errorMessage(e, 'Ошибка проверки кода'),
        };
      }
    },
    []
  );

  /**
   * Регистрация покупателя перед первым заказом.
   * Профиль (имя, фамилия, телефон, email) хранится на сервере,
   * на устройстве остаётся только сессия.
   */
  const register = useCallback(
    async (
      input: RegisterCustomerInput
    ): Promise<{ success: boolean; error?: string }> => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const phone = input.phone.trim();
      const email = input.email?.trim() ?? '';

      if (!firstName) return { success: false, error: 'Укажите имя' };
      if (!lastName) return { success: false, error: 'Укажите фамилию' };
      if (!/^[\d\s()+\-]+$/.test(phone)) {
        return { success: false, error: 'Некорректный номер телефона' };
      }

      const digits = normalizePhone(phone);
      if (digits.length < 10 || digits.length > 15) {
        return { success: false, error: 'Некорректный номер телефона' };
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Некорректный email' };
      }

      try {
        const { data, error } = await supabase.rpc('register_customer', {
          p_first_name: firstName,
          p_last_name: lastName,
          p_phone: phone,
          p_email: email || null,
        });
        if (error) throw error;

        const row = (data ?? {}) as {
          id?: number;
          phone?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
        };

        setSession({
          phone: row.phone ?? digits,
          firstName: row.first_name ?? firstName,
          lastName: row.last_name ?? lastName,
          email: row.email ?? (email || undefined),
          customerId: row.id,
          name: `${row.first_name ?? firstName} ${row.last_name ?? lastName}`.trim(),
          verifiedAt: new Date().toISOString(),
        });

        return { success: true };
      } catch (e) {
        console.error('[CustomerContext.register]', e);
        return {
          success: false,
          error: errorMessage(e, 'Не удалось создать профиль покупателя'),
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
        register,
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