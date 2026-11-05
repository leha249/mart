import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { formatPrice, formatDate } from '../utils/format';
import type { Order, OrderStatus } from '../types/database';
import { ORDER_STATUS_LABELS } from '../types/database';
import { navigate } from '../utils/navigate';
import { trackingUrl, carrierLabel } from '../utils/tracking';
import { usePageMeta } from '../hooks/usePageMeta';
import { ordersService, orderTokens } from '../services/orders';

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  new: <Clock size={16} />,
  processing: <Package size={16} />,
  shipped: <Truck size={16} />,
  delivered: <CheckCircle2 size={16} />,
  cancelled: <XCircle size={16} />,
};

const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  new: {
    bg: 'rgba(232,255,90,0.12)',
    text: '#c8e03d',
    border: 'rgba(232,255,90,0.3)',
  },
  processing: {
    bg: 'rgba(96,165,250,0.12)',
    text: '#60a5fa',
    border: 'rgba(96,165,250,0.3)',
  },
  shipped: {
    bg: 'rgba(167,139,250,0.12)',
    text: '#a78bfa',
    border: 'rgba(167,139,250,0.3)',
  },
  delivered: {
    bg: 'rgba(74,222,128,0.12)',
    text: 'var(--success)',
    border: 'rgba(74,222,128,0.3)',
  },
  cancelled: {
    bg: 'rgba(255,77,77,0.12)',
    text: 'var(--danger)',
    border: 'rgba(255,77,77,0.3)',
  },
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  usePageMeta({
    title: 'Мои заказы',
    description:
      'Заказы, оформленные на этом устройстве: статусы, состав, трек-номер и оплата.',
  });

  // Заказы берём по токенам, сохранённым на этом устройстве:
  // доступ к таблице заказов по телефону для анонима закрыт.
  const loadOrders = useCallback(async () => {
    const tokens = orderTokens.list();
    if (tokens.length === 0) {
      setOrders([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await ordersService.getByTokens(tokens);
      setOrders(rows);
    } catch (e) {
      console.error('[MyOrdersPage] load orders error:', e);
      setError('Не удалось загрузить заказы. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Загружаем асинхронно, чтобы не блокировать первый рендер
    (async () => {
      await loadOrders();
    })();
  }, [loadOrders]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goHome = () => {
    navigate('/');
  };

  const goToCatalog = () => {
    navigate('/catalog');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 40 }}
          >
            <button
              onClick={goHome}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'inherit',
                padding: 0,
                marginBottom: 24,
              }}
            >
              <ArrowLeft size={14} /> На главную
            </button>

            <div
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • История заказов
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              Мои{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                заказы
              </span>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: 'var(--muted)',
                maxWidth: 520,
                lineHeight: 1.65,
              }}
            >
              Здесь собраны заказы, оформленные на этом устройстве: статусы,
              состав, трек-номер и оплата.
            </p>
          </motion.div>

          {/* Панель обновления */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '16px 24px',
              marginBottom: 32,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}
            >
              Список хранится в этом браузере и подгружается автоматически.
            </div>
            <button
              onClick={() => void loadOrders()}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw
                size={14}
                style={
                  loading
                    ? { animation: 'spin 1s linear infinite' }
                    : undefined
                }
              />
              Обновить
            </button>
          </motion.div>

          {/* Загрузка */}
          {loading && (
            <div
              style={{
                padding: 80,
                textAlign: 'center',
                color: 'var(--muted)',
              }}
            >
              <Loader2
                size={28}
                style={{
                  animation: 'spin 1s linear infinite',
                  display: 'inline-block',
                }}
              />
              <div style={{ marginTop: 12, fontSize: 14 }}>
                Загрузка заказов...
              </div>
            </div>
          )}

          {/* Ошибка */}
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 40,
                textAlign: 'center',
                background: 'rgba(255,77,77,0.06)',
                border: '1px solid rgba(255,77,77,0.25)',
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
              <button
                onClick={() => void loadOrders()}
                style={{
                  padding: '12px 24px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#000',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={14} /> Повторить
              </button>
            </motion.div>
          )}

          {/* Пусто: нет токенов или заказов */}
          {!loading && !error && orders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
              }}
            >
              <Package
                size={56}
                strokeWidth={1}
                style={{ color: 'var(--muted)', marginBottom: 20 }}
              />
              <h2 style={{ fontSize: 20, marginBottom: 10, fontWeight: 700 }}>
                Заказов пока нет
              </h2>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  lineHeight: 1.7,
                  maxWidth: 560,
                  margin: '0 auto 24px',
                }}
              >
                Заказы хранятся на этом устройстве. Если вы оформляли заказ с
                другого устройства или очистили данные браузера — напишите нам,
                поможем восстановить доступ
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <a
                  href="/contacts"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contacts');
                  }}
                  style={{
                    padding: '14px 28px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                  }}
                >
                  <MessageCircle size={16} /> Написать нам
                </a>
                <button
                  onClick={goToCatalog}
                  style={{
                    padding: '14px 28px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  В каталог
                </button>
              </div>
            </motion.div>
          )}

          {/* Результаты */}
          <AnimatePresence mode="wait">
            {!loading && !error && orders.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--muted)',
                    }}
                  >
                    Найдено{' '}
                    <strong style={{ color: 'var(--accent)' }}>
                      {orders.length}
                    </strong>{' '}
                    {orders.length === 1
                      ? 'заказ'
                      : orders.length < 5
                      ? 'заказа'
                      : 'заказов'}
                  </div>
                </div>

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {orders.map((order, i) => {
                    const sc = STATUS_COLORS[order.status];
                    const isExpanded = expanded.has(order.id);
                    const itemsCount = order.items.reduce(
                      (s, item) => s + item.quantity,
                      0
                    );

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 16,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Заголовок заказа */}
                        <div
                          onClick={() => toggleExpand(order.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleExpand(order.id);
                            }
                          }}
                          style={{
                            padding: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                            transition: 'background 0.2s',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: sc.bg,
                                color: sc.text,
                                border: `1px solid ${sc.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {STATUS_ICONS[order.status]}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  marginBottom: 2,
                                }}
                              >
                                Заказ №{order.id}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--muted)',
                                  display: 'flex',
                                  gap: 12,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span>{formatDate(order.created_at)}</span>
                                <span>
                                  {itemsCount}{' '}
                                  {itemsCount === 1
                                    ? 'товар'
                                    : itemsCount < 5
                                    ? 'товара'
                                    : 'товаров'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                padding: '4px 10px',
                                borderRadius: 100,
                                background: sc.bg,
                                color: sc.text,
                                border: `1px solid ${sc.border}`,
                                fontWeight: 700,
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>

                            {order.payment_status === 'paid' && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '4px 10px',
                                  borderRadius: 100,
                                  background: 'rgba(74,222,128,0.12)',
                                  color: 'var(--success)',
                                  border: '1px solid rgba(74,222,128,0.35)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Оплачен
                              </span>
                            )}
                            {order.payment_status === 'refunded' && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '4px 10px',
                                  borderRadius: 100,
                                  background: 'rgba(255,77,77,0.12)',
                                  color: 'var(--danger)',
                                  border: '1px solid rgba(255,77,77,0.35)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Возврат
                              </span>
                            )}

                            <span
                              className="price-num"
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: 'var(--accent)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatPrice(order.total)}
                            </span>

                            {order.tracking_number && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'var(--muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {trackingUrl(
                                  order.carrier,
                                  order.tracking_number
                                ) ? (
                                  <a
                                    href={
                                      trackingUrl(
                                        order.carrier,
                                        order.tracking_number
                                      )!
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: 'var(--accent)',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    {carrierLabel(order.carrier)}:{' '}
                                    {order.tracking_number}
                                  </a>
                                ) : (
                                  <>
                                    Трек: {order.tracking_number}
                                  </>
                                )}
                              </span>
                            )}

                            <div
                              style={{
                                color: 'var(--muted)',
                                display: 'flex',
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Детали заказа */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div
                                style={{
                                  padding: '0 20px 20px',
                                  borderTop: '1px solid var(--border)',
                                  paddingTop: 20,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--muted)',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    marginBottom: 12,
                                  }}
                                >
                                  Состав заказа
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                  }}
                                >
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={`${item.id}-${item.size ?? 'no'}-${idx}`}
                                      style={{
                                        display: 'flex',
                                        gap: 12,
                                        alignItems: 'center',
                                      }}
                                    >
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{
                                          width: 48,
                                          height: 60,
                                          borderRadius: 8,
                                          objectFit: 'cover',
                                          flexShrink: 0,
                                        }}
                                      />
                                      <div
                                        style={{
                                          flex: 1,
                                          minWidth: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            marginBottom: 2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {item.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 12,
                                            color: 'var(--muted)',
                                          }}
                                        >
                                          {item.quantity} ×{' '}
                                          {formatPrice(item.price)}
                                          {item.size && ` · ${item.size}`}
                                        </div>
                                      </div>
                                      <div
                                        className="price-num"
                                        style={{
                                          fontSize: 14,
                                          fontWeight: 700,
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {formatPrice(
                                          item.price * item.quantity
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 32,
                    textAlign: 'center',
                  }}
                >
                  <button
                    onClick={goToCatalog}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 100,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Продолжить покупки
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MyOrdersPage;
