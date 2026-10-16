import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil,
  Trash2,
  Copy,
  Check,
  Power,
  Tag,
  Calendar,
  Hash,
} from 'lucide-react';
import type { Promocode } from '../../types/database';
import { formatPrice } from '../../utils/format';

interface Props {
  promocodes: Promocode[];
  loading: boolean;
  onEdit: (p: Promocode) => void;
  onDelete: (id: number) => void;
  onToggleActive: (p: Promocode) => void;
  search: string;
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const PromocodesTable = ({
  promocodes,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  search,
}: Props) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (p: Promocode) => {
    try {
      await navigator.clipboard.writeText(p.code);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

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
        Загрузка промокодов...
      </div>
    );
  }

  if (promocodes.length === 0) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <Tag
          size={40}
          strokeWidth={1}
          style={{ marginBottom: 16, opacity: 0.5 }}
        />
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          {search ? 'Ничего не найдено' : 'Пока нет промокодов'}
        </div>
        <div style={{ fontSize: 13 }}>
          {search
            ? 'Попробуйте изменить запрос'
            : 'Создайте первый промокод для скидок'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
          minWidth: 720,
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
              'Код',
              'Скидка',
              'Мин. сумма',
              'Использования',
              'Срок',
              'Статус',
              '',
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
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {promocodes.map((p, i) => {
            const isExpired =
              p.expires_at && new Date(p.expires_at) < new Date();
            const limitReached =
              p.max_uses !== null && p.used_count >= p.max_uses;
            const isInactive = !p.active || isExpired || limitReached;

            return (
              <tr
                key={p.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background:
                    i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  opacity: isInactive ? 0.55 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <code
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '4px 10px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--accent)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {highlight(p.code)}
                    </code>
                    <button
                      onClick={() => handleCopy(p)}
                      aria-label="Скопировать код"
                      style={{
                        background: 'none',
                        border: 'none',
                        color:
                          copiedId === p.id
                            ? 'var(--success)'
                            : 'var(--muted)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      {copiedId === p.id ? (
                        <Check size={13} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <span
                    className="price-num"
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    −{p.discount_percent}%
                  </span>
                </td>

                <td
                  className="price-num"
                  style={{ padding: '14px 16px', color: 'var(--muted)' }}
                >
                  {p.min_total > 0 ? formatPrice(p.min_total) : '—'}
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <div
                    className="price-num"
                    style={{
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Hash size={11} color="var(--muted)" />
                    <span style={{ fontWeight: 600 }}>{p.used_count}</span>
                    {p.max_uses !== null && (
                      <span style={{ color: 'var(--muted)' }}>
                        / {p.max_uses}
                      </span>
                    )}
                  </div>
                </td>

                <td
                  style={{
                    padding: '14px 16px',
                    fontSize: 12,
                    color: isExpired ? 'var(--danger)' : 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Calendar size={11} />
                    {formatDate(p.expires_at)}
                  </span>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  {isExpired ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: 'rgba(255,77,77,0.15)',
                        color: 'var(--danger)',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      ИСТЁК
                    </span>
                  ) : limitReached ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: 'rgba(255,77,77,0.15)',
                        color: 'var(--danger)',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      ЛИМИТ
                    </span>
                  ) : p.active ? (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: 'rgba(74,222,128,0.15)',
                        color: 'var(--success)',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      АКТИВЕН
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: 'rgba(138,138,138,0.15)',
                        color: 'var(--muted)',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                      }}
                    >
                      ВЫКЛЮЧЕН
                    </span>
                  )}
                </td>

                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onToggleActive(p)}
                      aria-label={p.active ? 'Выключить' : 'Включить'}
                      title={p.active ? 'Выключить' : 'Включить'}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: p.active ? 'var(--success)' : 'var(--muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Power size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(p)}
                      aria-label="Редактировать"
                      title="Редактировать"
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Pencil size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(p.id)}
                      aria-label="Удалить"
                      title="Удалить"
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PromocodesTable;