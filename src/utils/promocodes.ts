import { supabase } from '../lib/supabase';
import type { Promocode } from '../types/database';

export interface PromoValidation {
  valid: boolean;
  discount: number;
  message: string;
  promocode?: Promocode;
}

export const validatePromocode = async (
  code: string,
  cartTotal: number
): Promise<PromoValidation> => {
  const trimmed = code.trim().toUpperCase();

  if (!trimmed) {
    return { valid: false, discount: 0, message: 'Введите промокод' };
  }

  const { data, error } = await supabase
    .from('promocodes')
    .select('*')
    .eq('code', trimmed)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    return { valid: false, discount: 0, message: 'Ошибка проверки' };
  }

  if (!data) {
    return { valid: false, discount: 0, message: 'Промокод не найден' };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, discount: 0, message: 'Промокод истёк' };
  }

  if (data.max_uses !== null && data.used_count >= data.max_uses) {
    return { valid: false, discount: 0, message: 'Лимит использований исчерпан' };
  }

  if (cartTotal < data.min_total) {
    return {
      valid: false,
      discount: 0,
      message: `Минимальная сумма — ${new Intl.NumberFormat('ru-RU').format(data.min_total)} ₽`,
    };
  }

  const discount = Math.round((cartTotal * data.discount_percent) / 100);

  return {
    valid: true,
    discount,
    message: `Скидка −${data.discount_percent}%`,
    promocode: data,
  };
};

export const incrementPromocodeUsage = async (id: number): Promise<void> => {
  const { error } = await supabase.rpc('increment_promo_usage', {
    promo_id: id,
  });
  if (error) console.warn('Не удалось увеличить счётчик промокода:', error);
};