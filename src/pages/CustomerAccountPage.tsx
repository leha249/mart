import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  LogOut,
  Package,
  Phone,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { formatPrice, formatDate } from '../utils/format';
import type { OrderStatus, OrderItem } from '../types/database';
import { ORDER_STATUS_LABELS } from '../types/database';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

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

const CustomerAccountPage = () => {
  const { session, signOut, setCustomerName } = useCustomer();
  const { addToast } = useToast();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(session?.name ?? '');

  // Редирект, если не вошёл
  useEffect(() => {
    if (!session) {
      navigate('/login-customer');
    }
  }, [session]);

  usePageMeta({ title: 'Личный кабинет — MØRA MART' });

  // Загружаем заказы
  useEffect(() => {
    if (!session) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc(
          'get_orders_by_phone',
          { phone_input: session.phone }
        );

        if (rpcError) throw rpcError;

        if (mounted) setOrders((data ?? []) as OrderRow[]);
      } catch (e) {
        console.error('[CustomerAccountPage] load orders:', e);
        if (mounted) {
          // Пользователю — понятный текст, детали остаются в консоли
          setError('Не удалось загрузить заказы. Попробуйте обновить страницу.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  const goHome = () => {
    navigate('/');
  };

  const goToCatalog = () => {
    navigate('/catalog');
  };

  const handleSignOut = () => {
    if (!window.confirm('Выйти из кабинета?')) return;
    signOut();
    addToast('Вы вышли из кабинета', 'info');
    navigate('/');
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      addToast('Введите имя', 'error');
      return;
    }
    setCustomerName(trimmed);
    setEditName(false);
    addToast('Имя сохранено', 'success');
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!session) return null;

  const formatPhone = (phone: string): string => {
    if (phone.length === 11) {
      return `+${phone[0]} ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(
        7,
        9
      )}-${phone.slice(9)}`;
    }
    return phone;
  };

  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                marginBottom: 32,
              }}
            >
              <ArrowLeft size={14} /> На главную
            </button>

            {/* Заголовок */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 32,
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    marginBottom: 12,
                  }}
                >
                  • Личный кабинет
                </div>
                <h1
                  className="serif"
                  style={{
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    fontWeight: 900,
                    letterSpacing: '-1.5px',
                    lineHeight: 1,
                  }}
                >
                  Мои{' '}
                  <span
                    style={{ fontStyle: 'italic', color: 'var(--accent)' }}
                  >
                    заказы
                  </span>
                </h1>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '12px 20px',
                  borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <LogOut size={14} /> Выйти
              </button>
            </div>

            {/* Профиль + статистика */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: 16,
                marginBottom: 32,
              }}
              className="account-top-grid"
            >
              {/* Профиль */}
              <div
                style={{
                  padding: 24,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontSize: 22,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {session.name
                      ? session.name.charAt(0).toUpperCase()
                      : <User size={24} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editName ? (
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Ваше имя"
                          maxLength={50}
                          autoFocus
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: '8px 12px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            color: 'var(--text)',
                            fontSize: 14,
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={handleSaveName}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#000',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Сохранить
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {session.name || 'Покупатель'}
                        </div>
                        <button
                          onClick={() => setEditName(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          {session.name ? 'Изменить имя' : 'Указать имя'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    color: 'var(--muted)',
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <Phone size={16} />
                  {formatPhone(session.phone)}
                  <ShieldCheck
                    size={14}
                    color="var(--success)"
                    style={{ marginLeft: 'auto' }}
                  />
                </div>
              </div>

              {/* Статистика */}
              <div
                style={{
                  padding: 24,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Всего заказов
                  </div>
                  <div
                    className="price-num"
                    style={{ fontSize: 28, fontWeight: 900 }}
                  >
                    {orders.length}
                  </div>
                </div>
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Потрачено
                  </div>
                  <div
                    className="price-num"
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {formatPrice(totalSpent)}
                  </div>
                </div>
              </div>
            </div>

            {/* Заказы */}
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

            {!loading && error && (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  background: 'rgba(255,77,77,0.06)',
                  border: '1px solid rgba(255,77,77,0.25)',
                  borderRadius: 16,
                  color: 'var(--danger)',
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            {!loading && !error && orders.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '80px 20px',
                  textAlign: 'center',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                }}
              >
                <ShoppingBag
                  size={56}
                  strokeWidth={1}
                  style={{ color: 'var(--muted)', marginBottom: 20 }}
                />
                <h2
                  style={{
                    fontSize: 20,
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  Заказов пока нет
                </h2>
                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: 14,
                    marginBottom: 24,
                  }}
                >
                  Как только оформите заказ — он появится здесь
                </p>
                <button
                  onClick={goToCatalog}
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
                  }}
                >
                  В каталог
                </button>
              </motion.div>
            )}

            {!loading && !error && orders.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {orders.map((order) => {
                  const sc = STATUS_COLORS[order.status];
                  const isExpanded = expanded.has(order.id);
                  const itemsCount = order.items.reduce(
                    (s, item) => s + item.quantity,
                    0
                  );

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        overflow: 'hidden',
                      }}
                    >
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
                          <div style={{ color: 'var(--muted)', display: 'flex' }}>
                            {isExpanded ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          style={{
                            padding: '20px 20px 24px',
                            borderTop: '1px solid var(--border)',
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
                                <div style={{ flex: 1, minWidth: 0 }}>
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
                                  {formatPrice(item.price * item.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 700px) {
          .account-top-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerAccountPage;
