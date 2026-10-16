import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  User,
  Copy,
  Check,
  Printer,
  Trash2,
  Calendar,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types/database';
import { ORDER_STATUS_LABELS } from '../../types/database';
import { useBodyLock } from '../../hooks/useBodyLock';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { formatPrice } from '../../utils/format';
import StatusSelect from './StatusSelect';

interface Props {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: OrderStatus) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OrderModal = ({ order, onClose, onUpdateStatus, onDelete }: Props) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useBodyLock(!!order);
  useFocusTrap(!!order, modalRef);

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, onClose]);

  const copy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {}
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      await onUpdateStatus(order.id, status);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order || deleting) return;
    const ok = window.confirm(
      `Удалить заказ №${order.id}? Действие нельзя отменить.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await onDelete(order.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    if (!order) return;
    const w = window.open('', '_blank');
    if (!w) return;

    const itemsHtml = order.items
      .map(
        (i) => `
        <tr>
          <td>${i.name}${i.size ? ` (${i.size})` : ''}</td>
          <td style="text-align:center">${i.quantity}</td>
          <td style="text-align:right">${formatPrice(i.price)}</td>
          <td style="text-align:right">${formatPrice(i.price * i.quantity)}</td>
        </tr>`
      )
      .join('');

    w.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Заказ №${order.id}</title><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: system-ui, sans-serif; padding: 40px; color:#000; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
      .section { margin-bottom: 24px; }
      .section h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; }
      td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
      .total { text-align: right; font-size: 20px; font-weight: 900; margin-top: 24px; padding-top: 16px; border-top: 2px solid #000; }
      .footer { margin-top: 60px; text-align: center; color: #666; font-size: 12px; }
    </style></head><body>
      <h1>MØRA MART — Заказ №${order.id}</h1>
      <div class="meta">${formatDate(order.created_at)} · Статус: ${ORDER_STATUS_LABELS[order.status]}</div>
      <div class="section">
        <h2>Покупатель</h2>
        <div><strong>${order.customer_name}</strong></div>
        <div>${order.customer_phone}</div>
        ${order.customer_email ? `<div>${order.customer_email}</div>` : ''}
      </div>
      <div class="section">
        <h2>Товары</h2>
        <table><thead><tr><th>Наименование</th><th style="text-align:center">Кол-во</th><th style="text-align:right">Цена</th><th style="text-align:right">Сумма</th></tr></thead>
        <tbody>${itemsHtml}</tbody></table>
        <div class="total">Итого: ${formatPrice(order.total)}</div>
      </div>
      <div class="footer">Спасибо за покупку в MØRA MART 🖤</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  return (
    <AnimatePresence mode="wait">
      {order && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 500,
            overflowY: 'auto',
            padding: 20,
          }}
        >
          <motion.div
            key={`order-${order.id}`}
            ref={modalRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={`Заказ №${order.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 720,
              margin: '40px auto',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              overflow: 'hidden',
            }}
            className="order-modal"
          >
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Заказ
                </div>
                <div
                  className="price-num"
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: '-1px',
                    marginBottom: 6,
                  }}
                >
                  №{order.id}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  <Calendar size={12} />
                  {formatDate(order.created_at)}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <StatusSelect
                  value={order.status}
                  onChange={handleStatusChange}
                  disabled={updating}
                />
                <button
                  onClick={handlePrint}
                  aria-label="Печать"
                  title="Печать"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Printer size={15} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label="Удалить"
                  title="Удалить"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--danger)',
                    cursor: deleting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Покупатель
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ContactRow
                  icon={<User size={16} />}
                  label="Имя"
                  value={order.customer_name}
                  onCopy={() => copy(order.customer_name, 'name')}
                  copied={copiedField === 'name'}
                />
                <ContactRow
                  icon={<Phone size={16} />}
                  label="Телефон"
                  value={order.customer_phone}
                  href={`tel:${order.customer_phone}`}
                  onCopy={() => copy(order.customer_phone, 'phone')}
                  copied={copiedField === 'phone'}
                />
                {order.customer_email && (
                  <ContactRow
                    icon={<Mail size={16} />}
                    label="Email"
                    value={order.customer_email}
                    href={`mailto:${order.customer_email}`}
                    onCopy={() => copy(order.customer_email!, 'email')}
                    copied={copiedField === 'email'}
                  />
                )}
              </div>
            </div>

            <div style={{ padding: '0 28px 24px' }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Товары ({order.items.length})
              </div>

              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {order.items.map((item, i) => (
                  <div
                    key={`${item.id}-${i}`}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: 14,
                      borderBottom:
                        i < order.items.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: 52,
                        height: 66,
                        objectFit: 'cover',
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 4,
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
                          display: 'flex',
                          gap: 8,
                        }}
                      >
                        <span className="price-num">
                          {formatPrice(item.price)}
                        </span>
                        {item.size && <span>· {item.size}</span>}
                        <span>· {item.quantity} шт.</span>
                      </div>
                    </div>
                    <div
                      className="price-num"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    >
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 4px 0',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Итого к оплате
                </span>
                <span
                  className="price-num"
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: 'var(--accent)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .order-modal { margin: 20px auto !important; }
        }
      `}</style>
    </AnimatePresence>
  );
};

interface ContactRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  onCopy: () => void;
  copied: boolean;
}

const ContactRow = ({ icon, label, value, href, onCopy, copied }: ContactRowProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>
        {label}
      </div>
      {href ? (
        <a
          href={href}
          style={{
            fontSize: 14,
            color: 'var(--text)',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {value}
        </a>
      ) : (
        <div style={{ fontSize: 14 }}>{value}</div>
      )}
    </div>
    <button
      onClick={onCopy}
      aria-label="Скопировать"
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: copied ? 'var(--success)' : 'var(--muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  </div>
);

export default OrderModal;