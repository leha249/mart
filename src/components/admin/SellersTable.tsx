import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Ban,
  Play,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Package,
  Store,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { UISeller, SellerStatus } from '../../types/database';

type SortKey = 'name' | 'created' | 'status';
type SortDir = 'asc' | 'desc';

interface Props {
  sellers: UISeller[];
  loading: boolean;
  productsCount: Record<number, number>;
  onEdit: (seller: UISeller) => void;
  onChangeStatus: (seller: UISeller, status: SellerStatus) => void;
  onDelete?: (seller: UISeller) => Promise<void>;
  search: string;
}

const STATUS_LABELS: Record<SellerStatus, string> = {
  active: 'Активен',
  paused: 'На паузе',
  blocked: 'Заблокирован',
};

const STATUS_COLORS: Record<
  SellerStatus,
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: 'rgba(74,222,128,0.12)',
    text: 'var(--success)',
    border: 'rgba(74,222,128,0.3)',
  },
  paused: {
    bg: 'rgba(232,255,90,0.12)',
    text: '#c8e03d',
    border: 'rgba(232,255,90,0.3)',
  },
  blocked: {
    bg: 'rgba(255,77,77,0.12)',
    text: 'var(--danger)',
    border: 'rgba(255,77,77,0.3)',
  },
};

const SellersTable = ({
  sellers,
  loading,
  productsCount,
  onEdit,
  onChangeStatus,
  onDelete,
  search,
}: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmChange, setConfirmChange] = useState<{
    seller: UISeller;
    newStatus: SellerStatus;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UISeller | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(() => {
    const list = [...sellers];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'created':
        default:
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [sellers, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
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
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const openDelete = (seller: UISeller) => {
    setDeleteTarget(seller);
    setDeleteConfirmText('');
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    if (deleteConfirmText.trim() !== deleteTarget.name) return;

    setDeleting(true);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
      setDeleteConfirmText('');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 60,
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
        <div style={{ marginTop: 12 }}>Загрузка продавцов...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
        <Store
          size={40}
          strokeWidth={1}
          style={{ marginBottom: 16, opacity: 0.5 }}
        />
        {search ? (
          <>
            По запросу «<span style={{ color: 'var(--text)' }}>{search}</span>»
            ничего не найдено
          </>
        ) : (
          <>
            Пока нет продавцов.
            <br />
            <span style={{ fontSize: 13 }}>
              Создайте пользователя в Supabase Authentication — он автоматически
              станет продавцом
            </span>
          </>
        )}
      </div>
    );
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
            minWidth: 900,
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--bg-soft)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <th
                onClick={() => toggleSort('name')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Магазин <SortIcon col="name" />
                </div>
              </th>

              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                Slug
              </th>

              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                }}
              >
                Контакты
              </th>

              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Товаров
                </div>
              </th>

              <th
                onClick={() => toggleSort('status')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Статус <SortIcon col="status" />
                </div>
              </th>

              <th style={{ width: 200 }} />
            </tr>
          </thead>

          <tbody>
            {sorted.map((s, i) => {
              const count = productsCount[s.id] || 0;
              const sc = STATUS_COLORS[s.status];

              return (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background:
                      i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    opacity: s.status === 'blocked' ? 0.6 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ padding: 12, maxWidth: 240 }}>
                    <div
                      style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                    >
                      {s.logo ? (
                        <img
                          src={s.logo}
                          alt={s.name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: 'var(--surface-hi)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--muted)',
                            flexShrink: 0,
                          }}
                        >
                          <Store size={16} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {highlightMatch(s.name, search)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          #{s.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: 12 }}>
                    <a
                      href={`/seller/${s.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      /{s.slug}
                      <ExternalLink size={11} />
                    </a>
                  </td>

                  <td style={{ padding: 12 }}>
                    {s.email && (
                      <div
                        style={{
                          fontSize: 12,
                          marginBottom: 2,
                          color: 'var(--text-dim)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 200,
                        }}
                      >
                        {s.email}
                      </div>
                    )}
                    {s.phone && (
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {s.phone}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: 12 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Package size={14} color="var(--muted)" />
                      {count}
                    </div>
                  </td>

                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 100,
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>

                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        justifyContent: 'flex-end',
                      }}
                    >
                      {s.status === 'active' && (
                        <ActionBtn
                          onClick={() =>
                            setConfirmChange({
                              seller: s,
                              newStatus: 'paused',
                            })
                          }
                          label="Поставить на паузу"
                          icon={<Ban size={14} />}
                        />
                      )}
                      {s.status === 'paused' && (
                        <ActionBtn
                          onClick={() =>
                            setConfirmChange({
                              seller: s,
                              newStatus: 'active',
                            })
                          }
                          label="Активировать"
                          icon={<Play size={14} />}
                        />
                      )}
                      {s.status === 'blocked' && (
                        <ActionBtn
                          onClick={() =>
                            setConfirmChange({
                              seller: s,
                              newStatus: 'active',
                            })
                          }
                          label="Разблокировать"
                          icon={<Play size={14} />}
                        />
                      )}

                      <ActionBtn
                        onClick={() => onEdit(s)}
                        label="Редактировать"
                        icon={<Pencil size={14} />}
                      />

                      {s.status !== 'blocked' && (
                        <ActionBtn
                          onClick={() =>
                            setConfirmChange({
                              seller: s,
                              newStatus: 'blocked',
                            })
                          }
                          label="Заблокировать"
                          icon={<Ban size={14} />}
                          danger
                        />
                      )}

                      {/* 🗑 Кнопка удаления — только если передан onDelete */}
                      {onDelete && (
                        <ActionBtn
                          onClick={() => openDelete(s)}
                          label="Удалить продавца навсегда"
                          icon={<Trash2 size={14} />}
                          danger
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Модалка: смена статуса */}
      <AnimatePresence>
        {confirmChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmChange(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 32,
                maxWidth: 420,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background:
                    confirmChange.newStatus === 'blocked'
                      ? 'rgba(255,77,77,0.15)'
                      : 'rgba(232,255,90,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color:
                    confirmChange.newStatus === 'blocked'
                      ? 'var(--danger)'
                      : 'var(--accent)',
                }}
              >
                {confirmChange.newStatus === 'blocked' ? (
                  <AlertTriangle size={24} />
                ) : (
                  <Play size={24} />
                )}
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
                {confirmChange.newStatus === 'blocked'
                  ? `Заблокировать «${confirmChange.seller.name}»?`
                  : confirmChange.newStatus === 'paused'
                  ? `Поставить «${confirmChange.seller.name}» на паузу?`
                  : `Активировать «${confirmChange.seller.name}»?`}
              </h3>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                {confirmChange.newStatus === 'blocked'
                  ? 'Магазин и все его товары станут недоступны покупателям. Продавец не сможет войти в кабинет.'
                  : confirmChange.newStatus === 'paused'
                  ? 'Товары магазина скроются из каталога, пока вы не активируете обратно.'
                  : 'Магазин и его товары снова станут доступны покупателям.'}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setConfirmChange(null)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    onChangeStatus(
                      confirmChange.seller,
                      confirmChange.newStatus
                    );
                    setConfirmChange(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: 'none',
                    background:
                      confirmChange.newStatus === 'blocked'
                        ? 'var(--danger)'
                        : 'var(--accent)',
                    color: confirmChange.newStatus === 'blocked' ? '#fff' : '#000',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Подтвердить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка: удаление */}
      <AnimatePresence>
        {deleteTarget && onDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDelete}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 750,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-soft)',
                border: '1px solid rgba(255,77,77,0.3)',
                borderRadius: 20,
                padding: 32,
                maxWidth: 480,
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(255,77,77,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--danger)',
                }}
              >
                <Trash2 size={24} />
              </div>

              <h3
                style={{
                  fontSize: 20,
                  marginBottom: 8,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Удалить «{deleteTarget.name}» навсегда?
              </h3>

              <div
                style={{
                  padding: 16,
                  background: 'rgba(255,77,77,0.08)',
                  border: '1px solid rgba(255,77,77,0.25)',
                  borderRadius: 12,
                  marginBottom: 20,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-dim)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--danger)' }}>
                  ⚠️ Это действие необратимо
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Все товары магазина будут удалены</li>
                  <li>Все заказы будут удалены навсегда</li>
                  <li>Все категории, промокоды, отзывы — тоже</li>
                  <li>Покупатели потеряют историю заказов у этого магазина</li>
                </ul>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Введите{' '}
                  <strong style={{ color: 'var(--danger)' }}>
                    {deleteTarget.name}
                  </strong>{' '}
                  для подтверждения:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  autoFocus
                  disabled={deleting}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={closeDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={
                    deleting ||
                    deleteConfirmText.trim() !== deleteTarget.name
                  }
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: deleting ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity:
                      deleting ||
                      deleteConfirmText.trim() !== deleteTarget.name
                        ? 0.5
                        : 1,
                  }}
                >
                  {deleting ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Удалить навсегда
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ActionBtn = ({
  onClick,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    aria-label={label}
    title={label}
    style={{
      padding: 8,
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: danger ? 'var(--danger)' : 'var(--text)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {icon}
  </motion.button>
);

export default SellersTable;