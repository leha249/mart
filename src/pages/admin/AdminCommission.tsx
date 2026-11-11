import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Loader2,
  Percent,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSellers } from '../../context/SellersContext';
import { useToast } from '../../context/ToastContext';
import {
  COMMISSION,
  MAX_COMMISSION_PERCENT,
  MIN_COMMISSION_PERCENT,
  commissionService,
  type CommissionBalance,
  type CommissionInvoice,
  type CommissionPayment,
  type CommissionPaymentStatus,
} from '../../services/commission';
import { formatDate, formatPrice } from '../../utils/format';

const STATUS_LABEL: Record<CommissionPaymentStatus, string> = {
  pending: 'На проверке',
  confirmed: 'Подтверждён',
  rejected: 'Отклонён',
};

const STATUS_COLOR: Record<CommissionPaymentStatus, string> = {
  pending: 'var(--accent)',
  confirmed: 'var(--success)',
  rejected: 'var(--danger)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: 28,
};

/** Счёт за месяц — конкретная дата, а не «1 дн. назад». */
const invoiceDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const AdminCommission = () => {
  const { role, sellerId } = useAuth();
  const { sellers, refetch: refetchSellers } = useSellers();
  const { addToast } = useToast();

  const isAdmin = role === 'admin';

  const me = useMemo(
    () => (sellerId ? sellers.find((s) => s.id === sellerId) ?? null : null),
    [sellers, sellerId]
  );

  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [balances, setBalances] = useState<CommissionBalance[]>([]);
  const [invoices, setInvoices] = useState<CommissionInvoice[]>([]);
  const [billing, setBilling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [savingRate, setSavingRate] = useState<number | null>(null);
  // null — «не редактировали», показываем текущий долг; строка — ручной ввод.
  const [amount, setAmount] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [rateDrafts, setRateDrafts] = useState<Record<number, string>>({});

  const myBalance = useMemo(
    () =>
      sellerId
        ? balances.find((b) => b.seller_id === sellerId) ?? null
        : null,
    [balances, sellerId]
  );

  const debt = myBalance?.debt ?? 0;

  /** Самый старый неоплаченный счёт — его и предлагаем оплатить. */
  const unpaidInvoice = useMemo(
    () =>
      [...invoices]
        .filter((inv) => inv.status !== 'paid' && inv.status !== 'waived')
        .sort((a, b) => a.period_start.localeCompare(b.period_start))[0] ?? null,
    [invoices]
  );

  const amountValue =
    amount ??
    (unpaidInvoice
      ? String(Math.max(unpaidInvoice.accrued - unpaidInvoice.paid, 0))
      : debt > 0
      ? String(debt)
      : '');
  const rate = Number(me?.commissionPercent ?? COMMISSION.defaultPercent);
  const pending = payments.filter((p) => p.status === 'pending');
  const hasPendingRequest = pending.length > 0;
  // У админа в payments лежат все заявки — в историю кладём только обработанные.
  const history = isAdmin
    ? payments.filter((p) => p.status !== 'pending')
    : payments;

  const balanceBySeller = useMemo(() => {
    const map: Record<number, CommissionBalance> = {};
    balances.forEach((b) => {
      map[b.seller_id] = b;
    });
    return map;
  }, [balances]);

  const load = useCallback(async () => {
    try {
      // Ленивый месячный прогон: сервер сам решит, пора ли выставлять счёт
      // (пятница) и не пора ли кого-то поставить на паузу. Повтор безопасен.
      await commissionService.runMonthlyBilling();

      const invoiceRows = await commissionService.getInvoices();

      if (isAdmin) {
        const [paymentRows, balanceRows] = await Promise.all([
          commissionService.getAll(),
          commissionService.getBalances(),
        ]);
        setPayments(paymentRows);
        setBalances(balanceRows);
      } else if (sellerId) {
        const [paymentRows, balanceRows] = await Promise.all([
          commissionService.getMine(sellerId),
          commissionService.getBalances(),
        ]);
        setPayments(paymentRows);
        setBalances(balanceRows);
      } else {
        setPayments([]);
        setBalances([]);
      }

      setInvoices(invoiceRows);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Не удалось загрузить данные по комиссии';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, sellerId, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequest = async () => {
    if (!sellerId || sending || loading || hasPendingRequest || debt <= 0) {
      return;
    }

    const value = Math.round(Number(amountValue.replace(',', '.')));
    if (!Number.isFinite(value) || value < 1) {
      addToast('Введите сумму больше 0', 'error');
      return;
    }

    setSending(true);
    try {
      await commissionService.requestPayment(
        sellerId,
        value,
        comment,
        unpaidInvoice?.id
      );
      addToast('Заявка отправлена — админ подтвердит оплату', 'success');
      setComment('');
      setAmount(null);
      await load();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Не удалось отправить заявку';
      addToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleRunBilling = async () => {
    if (billing) return;
    setBilling(true);
    try {
      const created = await commissionService.forceMonthlyBilling();
      addToast(
        created > 0
          ? `Сформировано счетов: ${created}`
          : 'Новых счетов за этот месяц нет',
        'success'
      );
      await load();
    } catch (e) {
      addToast(
        e instanceof Error ? e.message : 'Не удалось сформировать счета',
        'error'
      );
    } finally {
      setBilling(false);
    }
  };

  const handleConfirm = async (id: number) => {
    if (confirming !== null) return;
    setConfirming(id);
    try {
      await commissionService.confirm(id);
      addToast('Оплата комиссии подтверждена', 'success');
      await Promise.all([load(), refetchSellers()]);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Не удалось подтвердить оплату';
      addToast(msg, 'error');
    } finally {
      setConfirming(null);
    }
  };

  const handleReject = async (id: number) => {
    if (rejecting !== null) return;
    setRejecting(id);
    try {
      await commissionService.reject(id);
      addToast('Заявка отклонена', 'success');
      await load();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Не удалось отклонить заявку';
      addToast(msg, 'error');
    } finally {
      setRejecting(null);
    }
  };

  const handleSaveRate = async (id: number) => {
    if (savingRate !== null) return;
    const raw = rateDrafts[id] ?? '';
    const percent = Number(raw.replace(',', '.'));

    if (
      !Number.isFinite(percent) ||
      percent < MIN_COMMISSION_PERCENT ||
      percent > MAX_COMMISSION_PERCENT
    ) {
      addToast(
        `Ставка должна быть от ${MIN_COMMISSION_PERCENT} до ${MAX_COMMISSION_PERCENT}%`,
        'error'
      );
      return;
    }

    setSavingRate(id);
    try {
      await commissionService.setRate(id, percent);
      setRateDrafts((prev) => ({
        ...prev,
        [id]: String(Math.round(percent * 100) / 100),
      }));
      addToast('Ставка обновлена', 'success');
      await refetchSellers();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Не удалось сохранить ставку';
      addToast(msg, 'error');
    } finally {
      setSavingRate(null);
    }
  };

  const renderPayment = (p: CommissionPayment, showSeller: boolean) => (
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
      <span style={{ color: 'var(--text-dim)', minWidth: 0 }}>
        {formatDate(p.created_at)}
        {showSeller && p.sellers?.name ? ` · ${p.sellers.name}` : ''}
        {p.comment ? ` · ${p.comment}` : ''}
      </span>
      <span style={{ color: 'var(--muted)' }}>{formatPrice(p.amount)}</span>
      <span style={{ color: STATUS_COLOR[p.status] }}>
        {STATUS_LABEL[p.status]}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Продавец: ставка, баланс, оплата */}
      {!isAdmin && (
        <div style={cardStyle}>
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
            <Percent size={14} /> Комиссия продавца
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
                color: 'var(--accent)',
              }}
            >
              Комиссия {rate}%
            </span>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>
              с каждого заказа
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
            Абонентской платы нет: платформа получает только процент с
            проданных заказов. Ставку устанавливает администратор.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: 'Начислено',
                value: formatPrice(myBalance?.accrued ?? 0),
              },
              {
                label: 'Оплачено',
                value: formatPrice(myBalance?.paid ?? 0),
              },
              {
                label: 'Долг',
                value: formatPrice(debt),
                accent: debt > 0,
              },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    marginBottom: 4,
                  }}
                >
                  {m.label}
                </div>
                <div
                  className="price-num"
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: m.accent ? 'var(--danger)' : 'var(--text)',
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

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
              Реквизиты для перевода:
            </strong>
            <br />
            Перевод {COMMISSION.payDetails.method} на{' '}
            {COMMISSION.payDetails.phone}, получатель:{' '}
            {COMMISSION.payDetails.recipient}.
            <br />
            {COMMISSION.payDetails.comment}.
            {debt > 0 && (
              <>
                {' '}
                Переведите сумму долга и нажмите кнопку ниже — админ
                подтвердит платёж.
              </>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={amountValue}
              onChange={(e) => setAmount(e.target.value)}
              disabled={debt <= 0 || hasPendingRequest || sending}
              placeholder="Сумма, ₽"
              aria-label="Сумма перевода"
              style={{
                width: 150,
                padding: '13px 16px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={debt <= 0 || hasPendingRequest || sending}
              maxLength={500}
              placeholder="Комментарий (необязательно)"
              aria-label="Комментарий к платежу"
              style={{
                flex: 1,
                minWidth: 200,
                padding: '13px 16px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleRequest}
              disabled={
                sending ||
                loading ||
                debt <= 0 ||
                hasPendingRequest ||
                !sellerId
              }
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
                cursor:
                  sending || loading || debt <= 0 || hasPendingRequest
                    ? 'not-allowed'
                    : 'pointer',
                fontFamily: 'inherit',
                opacity:
                  sending || loading || debt <= 0 || hasPendingRequest ? 0.6 : 1,
              }}
            >
              {sending ? (
                <Loader2
                  size={16}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              ) : hasPendingRequest ? (
                <Clock size={16} />
              ) : (
                <Check size={16} />
              )}
              {hasPendingRequest ? 'Заявка на проверке' : 'Я перевёл — сообщить'}
            </button>
          </div>

          {debt <= 0 && !hasPendingRequest && (
            <div
              style={{
                marginTop: 16,
                fontSize: 13,
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={14} /> Долга нет — платить не нужно
            </div>
          )}

          {hasPendingRequest && (
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
              <Clock size={14} /> Заявка на проверке — ждём подтверждения
              админа
            </div>
          )}
        </div>
      )}

      {/* Админ: ставки и балансы продавцов */}
      {isAdmin && (
        <div style={cardStyle}>
          <h2 className="serif" style={{ fontSize: 24, marginBottom: 4 }}>
            Ставки и балансы
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Ставка по умолчанию — {COMMISSION.defaultPercent}%. Менять её может
            только администратор, допустимый диапазон —{' '}
            {MIN_COMMISSION_PERCENT}–{MAX_COMMISSION_PERCENT}%.
          </p>

          {loading && sellers.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Загрузка…
            </div>
          ) : sellers.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Продавцов пока нет
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 780 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'minmax(150px, 2fr) 80px repeat(3, minmax(90px, 1fr)) minmax(170px, 1.4fr)',
                    gap: 10,
                    padding: '0 8px 10px',
                    fontSize: 11,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 600,
                  }}
                >
                  <span>Магазин</span>
                  <span>Ставка</span>
                  <span>Начислено</span>
                  <span>Оплачено</span>
                  <span>Долг</span>
                  <span>Новая ставка</span>
                </div>

                {sellers.map((s) => {
                  const balance = balanceBySeller[s.id];
                  const sellerRate = Number(
                    s.commissionPercent ?? COMMISSION.defaultPercent
                  );
                  const isSaving = savingRate === s.id;

                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(150px, 2fr) 80px repeat(3, minmax(90px, 1fr)) minmax(170px, 1.4fr)',
                        gap: 10,
                        alignItems: 'center',
                        padding: '12px 8px',
                        borderTop: '1px solid var(--border)',
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={s.name}
                      >
                        {s.name}
                      </span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        {sellerRate}%
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {formatPrice(balance?.accrued ?? 0)}
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>
                        {formatPrice(balance?.paid ?? 0)}
                      </span>
                      <span
                        style={{
                          color:
                            (balance?.debt ?? 0) > 0
                              ? 'var(--danger)'
                              : 'var(--text-dim)',
                          fontWeight: (balance?.debt ?? 0) > 0 ? 700 : 400,
                        }}
                      >
                        {formatPrice(balance?.debt ?? 0)}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <input
                          type="number"
                          min={MIN_COMMISSION_PERCENT}
                          max={MAX_COMMISSION_PERCENT}
                          step="0.01"
                          value={rateDrafts[s.id] ?? String(sellerRate)}
                          onChange={(e) =>
                            setRateDrafts((prev) => ({
                              ...prev,
                              [s.id]: e.target.value,
                            }))
                          }
                          disabled={isSaving}
                          aria-label={`Ставка комиссии для ${s.name}`}
                          style={{
                            width: 74,
                            padding: '8px 10px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            color: 'var(--text)',
                            fontSize: 13,
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={() => handleSaveRate(s.id)}
                          disabled={savingRate !== null}
                          title="Сохранить ставку"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              savingRate !== null ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            opacity: savingRate !== null ? 0.5 : 1,
                          }}
                        >
                          {isSaving ? (
                            <Loader2
                              size={13}
                              style={{
                                animation: 'spin 1s linear infinite',
                              }}
                            />
                          ) : (
                            <Save size={13} />
                          )}
                          Сохранить
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Месячные счета */}
      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 6,
          }}
        >
          <h2 className="serif" style={{ fontSize: 24, margin: 0 }}>
            Счета по месяцам
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={handleRunBilling}
              disabled={billing}
              style={{
                padding: '10px 18px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: billing ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {billing ? 'Считаем…' : 'Сформировать за месяц'}
            </button>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Комиссия {rate}% считается по пятницам за предыдущие 7 дней.
          Оплатить — до конца следующей пятницы, иначе магазин уходит в паузу.
        </p>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Загрузка…</div>
        ) : invoices.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Счетов пока нет — появятся после первых продаж.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {invoices.map((inv) => {
              const isPaid = inv.status === 'paid';
              const overdue =
                !isPaid && new Date(inv.due_at).getTime() < Date.now();
              return (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    padding: '14px 16px',
                    background: 'var(--bg)',
                    border: `1px solid ${
                      overdue ? 'var(--danger)' : 'var(--border)'
                    }`,
                    borderRadius: 14,
                  }}
                >
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {invoiceDate(inv.period_start)} —{' '}
                      {invoiceDate(inv.period_end)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Оплатить до {invoiceDate(inv.due_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {formatPrice(inv.accrued)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isPaid
                        ? 'var(--success)'
                        : overdue
                        ? 'var(--danger)'
                        : 'var(--accent)',
                    }}
                  >
                    {isPaid ? 'Оплачен' : overdue ? 'Просрочен' : 'Ждёт оплаты'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Админ: заявки на подтверждение */}
      {isAdmin && (
        <div style={cardStyle}>
          <h2 className="serif" style={{ fontSize: 24, marginBottom: 4 }}>
            Заявки на подтверждение
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
            Подтверждение фиксирует оплату и уменьшает долг продавца.
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
                  <div style={{ fontSize: 13, minWidth: 0 }}>
                    <strong style={{ color: 'var(--text)' }}>
                      {p.sellers?.name ?? `Магазин #${p.seller_id}`}
                    </strong>
                    <span style={{ color: 'var(--muted)' }}>
                      {' '}
                      · {formatPrice(p.amount)} · {formatDate(p.created_at)}
                      {p.comment ? ` · ${p.comment}` : ''}
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
                      {confirming === p.id ? (
                        <Loader2
                          size={14}
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                      ) : (
                        <Check size={14} />
                      )}
                      Подтвердить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* История платежей */}
      <div style={cardStyle}>
        <h2 className="serif" style={{ fontSize: 24, marginBottom: 16 }}>
          {isAdmin ? 'История платежей' : 'Мои платежи'}
        </h2>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Загрузка…</div>
        ) : history.length === 0 ? (
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
            {history.map((p) => renderPayment(p, isAdmin))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCommission;
