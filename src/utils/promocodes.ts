import { supabase } from '../lib/supabase';
import type { Promocode } from '../types/database';

export interface PromoValidation {
  valid: boolean;
  discount: number;
  message: string;
  promocode?: Promocode;
}

interface PromoValidateRow {
  valid: boolean;
  discount: number;
  percent: number;
  min_total: number;
  code: string | null;
  expires_at: string | null;
  seller_id: number | null;
  message: string;
}

/**
 * Проверка промокода через SECURITY DEFINER RPC.
 *
 * Раньше корзина читала таблицу promocodes напрямую: anon мог выгрузить
 * весь список активных кодов (включая 100%-е) и использовать их.
 * Теперь таблица закрыта, а RPC отдаёт только результат проверки
 * конкретного кода — без листинга и без used_by_order_ids.
 */
export const validatePromocode = async (
  code: string,
  cartTotal: number
): Promise<PromoValidation> => {
  const trimmed = code.trim().toUpperCase();

  if (!trimmed) {
    return { valid: false, discount: 0, message: 'Введите промокод' };
  }

  const { data, error } = await supabase.rpc('promo_validate', {
    p_code: trimmed,
    p_seller_id: null,
    p_subtotal: Math.round(cartTotal),
  });

  if (error) {
    return { valid: false, discount: 0, message: 'Ошибка проверки' };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | PromoValidateRow
    | null
    | undefined;

  if (!row || !row.valid || !row.code) {
    return {
      valid: false,
      discount: 0,
      message: row?.message || 'Промокод не найден',
    };
  }

  const promocode: Promocode = {
    id: 0,
    code: row.code,
    discount_percent: row.percent,
    min_total: row.min_total,
    max_uses: null,
    used_count: 0,
    expires_at: row.expires_at,
    active: true,
    seller_id: row.seller_id,
    created_at: new Date().toISOString(),
  };

  return {
    valid: true,
    discount: row.discount,
    message: row.message,
    promocode,
  };
};
