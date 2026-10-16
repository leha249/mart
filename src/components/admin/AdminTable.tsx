import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { UIProduct } from '../../types/database';
import { formatPrice } from '../../utils/format';

type SortKey = 'name' | 'price' | 'category' | 'created';
type SortDir = 'asc' | 'desc';

interface Props {
  products: UIProduct[];
  loading: boolean;
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (p: UIProduct) => void;
  onDelete: (id: number) => void;
  onDuplicate: (p: UIProduct) => void;
  onToggleStock: (p: UIProduct) => void;
  search: string;
}

const AdminTable = ({
  products,
  loading,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStock,
  search,
}: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'created':
        default:
          cmp = a.id - b.id;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [products, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const allSelected =
    sorted.length > 0 && sorted.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0;

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
        <div style={{ marginTop: 12 }}>Загрузка товаров...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
        {search ? (
          <>
            По запросу «<span style={{ color: 'var(--text)' }}>{search}</span>»
            ничего не найдено
          </>
        ) : (
          'Пока нет товаров — добавь первый!'
        )}
      </div>
    );
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

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
          <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '12px 16px', width: 40 }}>
              <button
                type="button"
                onClick={onToggleSelectAll}
                aria-label={allSelected ? 'Снять выделение' : 'Выделить все'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: allSelected || someSelected ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                }}
              >
                {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
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
                width: 70,
              }}
            >
              Фото
            </th>

            {[
              { key: 'name' as const, label: 'Название' },
              { key: 'category' as const, label: 'Категория' },
              { key: 'price' as const, label: 'Цена' },
            ].map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
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
                  {col.label} <SortIcon col={col.key} />
                </div>
              </th>
            ))}

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
              Наличие
            </th>

            <th style={{ width: 150 }} />
          </tr>
        </thead>

        <tbody>
          {sorted.map((p, i) => {
            const isSelected = selected.has(p.id);
            return (
              <tr
                key={p.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: isSelected
                    ? 'rgba(232,255,90,0.04)'
                    : i % 2 === 0
                    ? 'transparent'
                    : 'rgba(255,255,255,0.01)',
                  transition: 'background 0.2s',
                }}
              >
                <td style={{ padding: 12 }}>
                  <button
                    type="button"
                    onClick={() => onToggleSelect(p.id)}
                    aria-label={isSelected ? 'Снять выделение' : 'Выделить'}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isSelected ? 'var(--accent)' : 'var(--muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0,
                    }}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </td>

                <td style={{ padding: 12 }}>
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    style={{
                      width: 44,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: 8,
                      display: 'block',
                      opacity: p.inStock ? 1 : 0.5,
                    }}
                  />
                </td>

                <td style={{ padding: 12, maxWidth: 220 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {highlightMatch(p.name, search)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {p.tag && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background:
                            p.tag === 'HOT'
                              ? 'var(--danger)'
                              : p.tag === 'SALE'
                              ? '#ff8c42'
                              : 'var(--accent)',
                          color: p.tag === 'HOT' ? '#fff' : '#000',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {p.tag}
                      </span>
                    )}
                    {p.rating > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        ★ {p.rating} · {p.reviews}
                      </span>
                    )}
                  </div>
                </td>

                <td style={{ padding: 12, color: 'var(--muted)' }}>
                  {highlightMatch(p.category, search)}
                </td>

                <td style={{ padding: 12 }}>
                  <div
                    className="price-num"
                    style={{ fontWeight: 700, color: 'var(--accent)' }}
                  >
                    {formatPrice(p.price)}
                  </div>
                  {p.oldPrice && (
                    <div
                      className="price-num"
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        textDecoration: 'line-through',
                      }}
                    >
                      {formatPrice(p.oldPrice)}
                    </div>
                  )}
                </td>

                <td style={{ padding: 12 }}>
                  <button
                    type="button"
                    onClick={() => onToggleStock(p)}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 100,
                      border: 'none',
                      background: p.inStock
                        ? 'rgba(74,222,128,0.15)'
                        : 'rgba(255,77,77,0.15)',
                      color: p.inStock ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {p.inStock ? <Eye size={12} /> : <EyeOff size={12} />}
                    {p.inStock ? 'В наличии' : 'Нет'}
                  </button>
                </td>

                <td style={{ padding: 12, textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <ActionBtn
                      onClick={() => onDuplicate(p)}
                      label="Дублировать"
                      icon={<Copy size={14} />}
                    />
                    <ActionBtn
                      onClick={() => onEdit(p)}
                      label="Редактировать"
                      icon={<Pencil size={14} />}
                    />
                    <ActionBtn
                      onClick={() => onDelete(p.id)}
                      label="Удалить"
                      icon={<Trash2 size={14} />}
                      danger
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
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

export default AdminTable;