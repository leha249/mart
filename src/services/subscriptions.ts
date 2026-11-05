import { supabase } from '../lib/supabase';
import { normalizeError } from '../utils/errors';

/** Тариф. Меняется в одном месте. */
export const SUBSCRIPTION = {
  priceMonth: 600,
  currency: '₽',
  trialDays: 30,
  /** Реквизиты для перевода — заполните перед запуском. */
  payDetails: {
    method: 'СБП',
    phone: '[УКАЖИТЕ НОМЕР ТЕЛЕФОНА ДЛЯ СБП]',
    recipient: '[УКАЖИТЕ ПОЛУЧАТЕЛЯ]',
    comment: 'В комментарии укажите название магазина',
  },
};

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';

export interface SubscriptionPayment {
  id: number;
  seller_id: number;
  amount: number;
  months: number;
  method: string;
  status: PaymentStatus;
  comment: string | null;
  created_at: string;
  confirmed_at: string | null;
  sellers?: { name: string | null } | null;
}

export type SubscriptionState = 'trial' | 'active' | 'expired' | 'none';

/** Состояние подписки по дате окончания. */
export const subscriptionState = (
  until: string | null | undefined
): SubscriptionState => {
  if (!until) return 'none';
  const end = new Date(until).getTime();
  if (Number.isNaN(end)) return 'none';
  return end > Date.now() ? 'active' : 'expired';
};

/** Сколько дней осталось (может быть отрицательным). */
export const daysLeft = (until: string | null | undefined): number => {
  if (!until) return 0;
  return Math.ceil((new Date(until).getTime() - Date.now()) / 86400000);
};

export const subscriptionsService = {
  /** Продавец сообщает, что оплатил: создаётся заявка на подтверждение. */
  async requestPayment(
    sellerId: number,
    months = 1,
    comment?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('subscription_payments').insert({
        seller_id: sellerId,
        amount: SUBSCRIPTION.priceMonth * months,
        months,
        method: 'sbp',
        status: 'pending',
        comment: comment?.trim() ? comment.trim().slice(0, 500) : null,
      });
      if (error) throw error;
    } catch (e) {
      console.error('[subscriptionsService.requestPayment]', e);
      throw normalizeError(e);
    }
  },

  /** Свои платежи (продавец). */
  async getMine(sellerId: number): Promise<SubscriptionPayment[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as SubscriptionPayment[];
    } catch (e) {
      console.error('[subscriptionsService.getMine]', e);
      throw normalizeError(e);
    }
  },

  /** Все заявки (админ). */
  async getAll(): Promise<SubscriptionPayment[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*, sellers(name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as SubscriptionPayment[];
    } catch (e) {
      console.error('[subscriptionsService.getAll]', e);
      throw normalizeError(e);
    }
  },

  /** Подтвердить оплату и продлить подписку (админ). */
  async confirm(paymentId: number): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc(
        'confirm_subscription_payment',
        { payment_id: paymentId }
      );
      if (error) throw error;
      return (data as string) ?? null;
    } catch (e) {
      console.error('[subscriptionsService.confirm]', e);
      throw normalizeError(e);
    }
  },
};
