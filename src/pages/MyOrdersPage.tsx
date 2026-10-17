import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ArrowLeft,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';
import { supabase } from '../lib/supabase';
import { formatPrice, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';
import type { OrderStatus, OrderItem } from '../types/database';
import { ORDER_STATUS_LABELS } from '../types/database';

interface OrderRow {
  id: number;
  created_at: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  seller_id: number | null;
}

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
  const { addToast } = useToast();

  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Загружаем сохранённый телефон
  useEffect(() => {
    document.title = 'Мои заказы — MØRA MART';

    try {
      const savedPhone = localStorage.getItem('mora-my-orders-phone');
      if (savedPhone) setPhone(savedPhone);

      const lastOrders = sessionStorage.getItem('mora-last-orders');
      if (lastOrders) {
        const parsed = JSON.parse(lastOrders);
        if (parsed.phone && !savedPhone) {
          setPhone(parsed.phone);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved phone:', e);
    }

    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  const handleSearch = async () => {
    const cleaned = phone.trim();
    if (!cleaned) {
      setError('Введите номер телефона');
      return;
    }

    setLoading(true);
    setError(null);
    setOrders(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_orders_by_phone',
        { phone_input: cleaned }
      );

      if (rpcError) throw rpcError;

      const rows = (data ?? []) as OrderRow[];
      setOrders(rows);

      // Сохраняем телефон для следующих визитов
      try {
        localStorage.setItem('mora-my-orders-phone', cleaned);
      } catch {}

      if (rows.length === 0) {
        setError('По этому номеру заказы не найдены');
      }
    } catch (e) {
      console.error('[MyOrdersPage] search error:', e);
      const msg =
        e instanceof Error ? e.message : 'Ошибка поиска заказов';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goToCatalog = () => {
    window.history.pushState({}, '', '/catalog');
    window.dispatchEvent(new PopStateEvent('popstate'));
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
              Введите номер телефона, который указывали при оформлении, чтобы
              найти свои заказы.
            </p>
          </motion.div>

          {/* Поиск */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 24,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 200,
                }}
              >
                <Phone
                  size={16}
                  color="var(--muted)"
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="+7 900 000-00-00"
                  disabled={loading}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 42px',
                    background: 'var(--bg)',
                    border: error
                      ? '1px solid var(--danger)'
                      : '1px solid var(--border)',
                    borderRadius: 100,
                    color: 'var(--text)',
                    fontSize: 15,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !phone.trim()}
                style={{
                  padding: '14px 28px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#000',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  opacity: loading || !phone.trim() ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Найти
                  </>
                )}
              </button>
            </div>

            {error && !loading && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: 'rgba(255,77,77,0.08)',
                  border: '1px solid rgba(255,77,77,0.25)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}
          </motion.div>

          {/* Результаты */}
          <AnimatePresence mode="wait">
            {orders !== null && orders.length > 0 && (
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
      <ToastContainer />

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