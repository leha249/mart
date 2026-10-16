import { motion } from 'framer-motion';
import { Eye, User, Phone, Package } from 'lucide-react';
import type { Order } from '../../types/database';
import { formatPrice, pluralize } from '../../utils/format';
import StatusBadge from './StatusBadge';

interface Props {
  orders: Order[];
  loading: boolean;
  onOpen: (order: Order) => void;
  search: string;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffH < 24) return `${diffH} ч. назад`;
  if (diffD < 7) return `${diffD} дн. назад`;

  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const OrdersTable = ({ orders, loading, onOpen, search }: Props) => {
  const highlight = (text: string) => {
    if (!search.trim()) return text;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark
          style={{
            background: 'var(--accent)',
            color: '#000',
            padding: '0 2px',
            borderRadius: 2,
          }}
        >
          {text.slice(idx, idx + search.length)}
        </mark>
        {text.slice(idx + search.length)}
      </>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 14,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ marginTop: 12 }}>Загрузка заказов...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <Package size={40} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.5 }} />
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          {search ? 'Ничего не найдено' : 'Пока нет заказов'}
        </div>
        <div style={{ fontSize: 13 }}>
          {search
            ? 'Попробуйте изменить запрос'
            : 'Когда покупатели оформят заказы, они появятся здесь'}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="orders-table-desktop" style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
            minWidth: 800,
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--bg-soft)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {[
                { label: 'Заказ', width: 80 },
                { label: 'Покупатель', width: 'auto' },
                { label: 'Товары', width: 90 },
                { label: 'Сумма', width: 130 },
                { label: 'Статус', width: 140 },
                { label: 'Дата', width: 130 },
                { label: '', width: 60 },
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '14px 16px',
                    textAlign: i === 6 ? 'right' : 'left',
                    fontSize: 11,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    width: h.width,
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr
                key={o.id}
                onClick={() => onOpen(o)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background:
                    i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')
                }
              >
                <td style={{ padding: '14px 16px' }}>
                  <span
                    className="price-num"
                    style={{ fontWeight: 700, color: 'var(--accent)' }}
                  >
                    №{o.id}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <User size={12} color="var(--muted)" />
                      {highlight(o.customer_name)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Phone size={11} />
                      {highlight(o.customer_phone)}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    className="price-num"
                    style={{ fontSize: 13, color: 'var(--muted)' }}
                  >
                    {o.items.length}{' '}
                    {pluralize(o.items.length, 'поз.', 'поз.', 'поз.')}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    className="price-num"
                    style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {formatPrice(o.total)}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <StatusBadge status={o.status} size="sm" />
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    fontSize: 12,
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(o.created_at)}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(o);
                    }}
                    aria-label="Открыть"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Eye size={14} />
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="orders-table-mobile" style={{ display: 'none' }}>
        {orders.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onOpen(o)}
            style={{
              padding: 16,
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                className="price-num"
                style={{ fontWeight: 700, color: 'var(--accent)' }}
              >
                №{o.id}
              </span>
              <StatusBadge status={o.status} size="sm" />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {highlight(o.customer_name)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {highlight(o.customer_phone)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--muted)' }}>
                {o.items.length} поз. · {formatDate(o.created_at)}
              </span>
              <span className="price-num" style={{ fontWeight: 700 }}>
                {formatPrice(o.total)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .orders-table-desktop { display: none !important; }
          .orders-table-mobile { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default OrdersTable;