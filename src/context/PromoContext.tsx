import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { validatePromocode, type PromoValidation } from '../utils/promocodes';
import type { Promocode } from '../types/database';
import { useCart } from './CartContext';

const STORAGE_KEY = 'mora-promo-v1';

interface PromoContextType {
  code: string;
  setCode: (c: string) => void;
  applied: Promocode | null;
  discount: number;
  checking: boolean;
  error: string | null;
  applyCode: (cartTotal: number) => Promise<boolean>;
  clearCode: () => void;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

const loadApplied = (): Promocode | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Promocode;
    // Если срок истёк — не применяем
    if (parsed.expires_at && new Date(parsed.expires_at) < new Date()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const PromoProvider = ({ children }: { children: ReactNode }) => {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<Promocode | null>(loadApplied);
  const [discount, setDiscount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { totalPrice } = useCart();

  useEffect(() => {
    if (applied) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [applied]);

  // 🐛 ИСПРАВЛЕНИЕ БАГА 2: пересчёт скидки + явная очистка localStorage
  useEffect(() => {
    if (!applied) {
      setDiscount(0);
      return;
    }

    if (applied.min_total > 0 && totalPrice < applied.min_total) {
      const msg = `Минимальная сумма для «${applied.code}» — ${applied.min_total.toLocaleString('ru-RU')} ₽`;
      setApplied(null);
      setDiscount(0);
      setError(msg);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }

    const newDiscount = Math.round(
      (totalPrice * applied.discount_percent) / 100
    );
    setDiscount(newDiscount);
  }, [applied, totalPrice]);

  const applyCode = async (cartTotal: number): Promise<boolean> => {
    setChecking(true);
    setError(null);

    try {
      const result: PromoValidation = await validatePromocode(code, cartTotal);

      if (!result.valid) {
        setError(result.message);
        setDiscount(0);
        return false;
      }

      setApplied(result.promocode!);
      setDiscount(result.discount);
      setError(null); // 🐛 очищаем прошлую ошибку
      return true;
    } catch (e) {
      setError('Ошибка проверки промокода');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const clearCode = () => {
    setCode('');
    setApplied(null);
    setDiscount(0);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <PromoContext.Provider
      value={{
        code,
        setCode,
        applied,
        discount,
        checking,
        error,
        applyCode,
        clearCode,
      }}
    >
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = () => {
  const ctx = useContext(PromoContext);
  if (!ctx) throw new Error('usePromo must be used within PromoProvider');
  return ctx;
};