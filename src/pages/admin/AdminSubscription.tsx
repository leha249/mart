import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, Check, Clock, AlertTriangle, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSellers } from '../../context/SellersContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import {
  SUBSCRIPTION,
  subscriptionsService,
  subscriptionState,
  daysLeft,
  type SubscriptionPayment,
} from '../../services/subscriptions';
import { formatDate } from '../../utils/format';

/** Дата подписки: «5 декабря 2026» (formatDate даёт относительное «только что»). */
const formatUntil = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const stateLabel = {
  trial: 'Пробный период',
  active: 'Оплачена',
  expired: 'Истекла',
  none: 'Не оформлена',
} as const;

const stateColor = {
  trial: 'var(--accent)',
  active: 'var(--success)',
  expired: 'var(--danger)',
  none: 'var(--muted)',
} as const;

/**
 * subscriptionState знает только дату окончания, а пробный период
 * отличается от оплаченного по subscription_plan. Поэтому «trial»
 * подставляем здесь — и для своего статуса, и для списка продавцов.
 */
const sellerState = (until?: string, plan?: string) => {
  const state = subscriptionState(until);
  return state === 'active' && plan === 'trial' ? 'trial' : state;
};

const AdminSubscription = () => {
  const { role, sellerId } = useAuth();
  const { sellers, refetch: refetchSellers } = useSellers();
  const { addToast } = useToast();

  const isAdmin = role === 'admin';
  const me = useMemo(
    () => (sellerId ? sellers.find((s) => s.id === sellerId) ?? null : null),
    [sellers, sellerId]
  );

  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);

  const pending = payments.filter((p) => p.status === 'pending');
  // Пока заявка на проверке, повторно отправлять её нельзя: админ
  // подтвердит обе и продлит подписку дважды.
  const hasPendingRequest = pending.some((p) => p.seller_id === sellerId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = isAdmin
        ? await subscriptionsService.getAll()
        : sellerId
        ? await subscriptionsService.getMine(sellerId)
        : [];
      setPayments(data);
    } catch {
      addToast('Не удалось загрузить платежи', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, sellerId, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequest = async () => {
    if (!sellerId || sending || loading || hasPendingRequest) return;
    setSending(true);
    try {
      await subscriptionsService.requestPayment(sellerId, 1);
      addToast('Заявка отправлена — админ подтвердит оплату', 'success');
      await load();
    } catch {
      addToast('Не удалось отправить заявку', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async (id: number) => {
    if (confirming) return;
    setConfirming(id);
    try {
      await subscriptionsService.confirm(id);
      addToast('Оплата подтверждена, подписка продлена', 'success');
      await Promise.all([load(), refetchSellers()]);
    } catch {
      addToast('Не удалось подтвердить оплату', 'error');
    } finally {
      setConfirming(null);
    }
  };

  const handleReject = async (id: number) => {
    if (rejecting) return;
    setRejecting(id);
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .update({ status: 'rejected' })
        .eq('id', id)
        .eq('status', 'pending')
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('payment not updated');
      addToast('Заявка отклонена', 'success');
      await load();
    } catch {
      addToast('Не удалось отклонить заявку', 'error');
    } finally {
      setRejecting(null);
    }
  };

  // Пробный период показываем как «Пробный», а не «Оплачена»
  const state = sellerState(me?.subscriptionUntil, me?.subscriptionPlan);
  const left = daysLeft(me?.subscriptionUntil);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Статус подписки продавца */}
      {!isAdmin && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              color: 'var(--muted)',
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            <CreditCard size={14} /> Подписка продавца
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <span
              className="serif"
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: stateColor[state],
              }}
            >
              {stateLabel[state]}
            </span>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>
              {me?.subscriptionUntil
                ? `до ${formatUntil(me.subscriptionUntil)}`
                : 'дата не задана'}
            </span>
          </div>

          <p
            style={{
              fontSize: 13.5,
              color: 'var(--text-dim)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {state === 'expired'
              ? 'Товары скрыты с витрины, кабинет работает в режиме чтения. Продлите подписку, чтобы магазин снова стал виден покупателям.'
              : state === 'trial'
              ? `Пробный период: осталось ${Math.max(left, 0)} дн. Дальше ${SUBSCRIPTION.priceMonth} ${SUBSCRIPTION.currency} в месяц.`
              : `Осталось ${Math.max(left, 0)} дн. Продление — ${SUBSCRIPTION.priceMonth} ${SUBSCRIPTION.currency} в месяц.`}
          </p>

          <div
            style={{
              padding: 18,
              borderRadius: 14,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              fontSize: 13,
              lineHeight: 1.7,
              color: 'var(--text-dim)',
              marginBottom: 20,
            }}
          >
            <strong style={{ color: 'var(--text)' }}>
              Как оплатить {SUBSCRIPTION.priceMonth} {SUBSCRIPTION.currency}:
            </strong>
            <br />
            Перевод {SUBSCRIPTION.payDetails.method} на{' '}
            {SUBSCRIPTION.payDetails.phone}, получатель:{' '}
            {SUBSCRIPTION.payDetails.recipient}.
            <br />
            {SUBSCRIPTION.payDetails.comment}. После перевода нажмите кнопку
            ниже — админ подтвердит оплату и продлит подписку на месяц.
          </div>

          <button
            onClick={handleRequest}
            disabled={sending || loading || hasPendingRequest}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              borderRadius: 100,
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontSize: 14,
              fontWeight: 700,
              cursor: sending
                ? 'wait'
                : loading || hasPendingRequest
                ? 'not-allowed'
                : 'pointer',
              fontFamily: 'inherit',
              opacity: sending || loading || hasPendingRequest ? 0.7 : 1,
            }}
          >
            {sending ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : hasPendingRequest ? (
              <Clock size={16} />
            ) : (
              <Check size={16} />
            )}
            {hasPendingRequest ? 'Заявка на проверке' : 'Я оплатил — сообщить'}
          </button>

          {pending.length > 0 && (
            <div
              style={{
                marginTop: 16,
                fontSize: 13,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Clock size={14} /> Заявка на проверке — ждём подтверждения админа
            </div>
          )}
        </div>
      )}

      {/* Заявки на подтверждение (админ) */}
      {isAdmin && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <h2 className="serif" style={{ fontSize: 24, marginBottom: 4 }}>
            Заявки на оплату
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Подтверждение продлевает подписку продавца на указанное число
            месяцев.
          </p>

          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Загрузка…
            </div>
          ) : pending.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Новых заявок нет
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {pending.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: 'var(--text)' }}>
                      {p.sellers?.name ?? `Магазин #${p.seller_id}`}
                    </strong>
                    <span style={{ color: 'var(--muted)' }}>
                      {' '}
                      · {p.amount} ₽ · {p.months} мес · {formatDate(p.created_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleReject(p.id)}
                      disabled={rejecting === p.id || confirming === p.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '9px 18px',
                        borderRadius: 100,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--danger)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: rejecting === p.id ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: confirming === p.id ? 0.5 : 1,
                      }}
                    >
                      <X size={14} /> Отклонить
                    </button>
                    <button
                      onClick={() => handleConfirm(p.id)}
                      disabled={confirming === p.id || rejecting === p.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '9px 18px',
                        borderRadius: 100,
                        border: 'none',
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: confirming === p.id ? 'wait' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: rejecting === p.id ? 0.5 : 1,
                      }}
                    >
                      <Check size={14} /> Подтвердить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Продавцы и их подписки (админ) */}
      {isAdmin && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <h2 className="serif" style={{ fontSize: 24, marginBottom: 16 }}>
            Подписки продавцов
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {sellers.map((s) => {
              const st = sellerState(s.subscriptionUntil, s.subscriptionPlan);
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--text)' }}>{s.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: stateColor[st] }}>
                      {stateLabel[st]}
                    </span>
                    <span style={{ color: 'var(--muted)' }}>
                      {s.subscriptionUntil
                        ? formatUntil(s.subscriptionUntil)
                        : '—'}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* История платежей */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
        }}
      >
        <h2 className="serif" style={{ fontSize: 24, marginBottom: 16 }}>
          {isAdmin ? 'Все платежи' : 'Мои платежи'}
        </h2>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Загрузка…</div>
        ) : payments.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            <AlertTriangle size={14} /> Платежей пока нет
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {payments.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-dim)' }}>
                  {formatDate(p.created_at)}
                  {isAdmin && p.sellers?.name ? ` · ${p.sellers.name}` : ''}
                </span>
                <span style={{ color: 'var(--muted)' }}>
                  {p.amount} ₽ · {p.months} мес
                </span>
                <span
                  style={{
                    color:
                      p.status === 'confirmed'
                        ? 'var(--success)'
                        : p.status === 'rejected'
                        ? 'var(--danger)'
                        : 'var(--accent)',
                  }}
                >
                  {p.status === 'confirmed'
                    ? 'Подтверждён'
                    : p.status === 'rejected'
                    ? 'Отклонён'
                    : 'На проверке'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscription;
