import { supabase } from '../lib/supabase';
import { normalizeError, ValidationError } from '../utils/errors';

/** Условия платформы. Меняются в одном месте. */
export const COMMISSION = {
  /** Ставка по умолчанию, %. */
  defaultPercent: 10,
  /** Реквизиты для перевода — заполните перед запуском. */
  payDetails: {
    method: 'СБП',
    phone: '[УКАЖИТЕ НОМЕР ТЕЛЕФОНА ДЛЯ СБП]',
    recipient: '[УКАЖИТЕ ПОЛУЧАТЕЛЯ]',
    comment: 'В комментарии укажите название магазина и период',
  },
};

export const MIN_COMMISSION_PERCENT = 0;
export const MAX_COMMISSION_PERCENT = 50;

export type CommissionPaymentStatus = 'pending' | 'confirmed' | 'rejected';

export interface CommissionPayment {
  id: number;
  seller_id: number;
  amount: number;
  method: string;
  status: CommissionPaymentStatus;
  comment: string | null;
  created_at: string;
  confirmed_at: string | null;
  sellers?: { name: string | null } | null;
}

/** Строка view seller_commission_balance. */
export interface CommissionBalance {
  seller_id: number;
  accrued: number;
  paid: number;
  debt: number;
}

const clampComment = (comment?: string): string | null => {
  const clean = comment?.trim();
  return clean ? clean.slice(0, 500) : null;
};

export const commissionService = {
  /** Начислено / оплачено / долг по продавцам (продавец видит только себя). */
  async getBalances(): Promise<CommissionBalance[]> {
    try {
      const { data, error } = await supabase
        .from('seller_commission_balance')
        .select('*');
      if (error) throw error;
      return (data ?? []) as CommissionBalance[];
    } catch (e) {
      console.error('[commissionService.getBalances]', e);
      throw normalizeError(e);
    }
  },

  /** Свои платежи (продавец). */
  async getMine(sellerId: number): Promise<CommissionPayment[]> {
    try {
      const { data, error } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CommissionPayment[];
    } catch (e) {
      console.error('[commissionService.getMine]', e);
      throw normalizeError(e);
    }
  },

  /** Все заявки (админ). */
  async getAll(): Promise<CommissionPayment[]> {
    try {
      const { data, error } = await supabase
        .from('commission_payments')
        .select('*, sellers(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as CommissionPayment[];
    } catch (e) {
      console.error('[commissionService.getAll]', e);
      throw normalizeError(e);
    }
  },

  /**
   * Продавец сообщает о переводе комиссии: создаётся заявка pending.
   * seller_id обязателен: RLS проверяет seller_id = my_seller_id().
   */
  async requestPayment(
    sellerId: number,
    amount: number,
    comment?: string
  ): Promise<void> {
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value < 1) {
      throw new ValidationError('Сумма должна быть больше 0');
    }

    try {
      const { error } = await supabase.from('commission_payments').insert({
        seller_id: sellerId,
        amount: value,
        method: 'sbp',
        status: 'pending',
        comment: clampComment(comment),
      });
      if (error) throw error;
    } catch (e) {
      console.error('[commissionService.requestPayment]', e);
      throw normalizeError(e);
    }
  },

  /** Подтвердить оплату (только админ, RPC). */
  async confirm(paymentId: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('confirm_commission_payment', {
        payment_id: paymentId,
      });
      if (error) throw error;
    } catch (e) {
      console.error('[commissionService.confirm]', e);
      throw normalizeError(e);
    }
  },

  /** Отклонить заявку (только админ, RLS). */
  async reject(paymentId: number): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('commission_payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId)
        .eq('status', 'pending')
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Заявка уже обработана');
      }
    } catch (e) {
      console.error('[commissionService.reject]', e);
      throw normalizeError(e);
    }
  },

  /** Ставка комиссии продавца (только админ, 0..50). */
  async setRate(sellerId: number, percent: number): Promise<void> {
    if (
      !Number.isFinite(percent) ||
      percent < MIN_COMMISSION_PERCENT ||
      percent > MAX_COMMISSION_PERCENT
    ) {
      throw new ValidationError(
        `Ставка должна быть от ${MIN_COMMISSION_PERCENT} до ${MAX_COMMISSION_PERCENT}%`
      );
    }

    const value = Math.round(percent * 100) / 100;

    try {
      const { data, error } = await supabase
        .from('sellers')
        .update({
          commission_percent: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerId)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Продавец не найден или недостаточно прав');
      }
    } catch (e) {
      console.error('[commissionService.setRate]', e);
      throw normalizeError(e);
    }
  },
};
