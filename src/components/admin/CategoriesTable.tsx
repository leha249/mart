import { motion } from 'framer-motion';
import { Pencil, Trash2, Package, FolderOpen } from 'lucide-react';
import type { Category } from '../../types/database';

interface Props {
  categories: Category[];
  loading: boolean;
  productsCount: Record<string, number>;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  search: string;
}

const CategoriesTable = ({
  categories,
  loading,
  productsCount,
  onEdit,
  onDelete,
  search,
}: Props) => {
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
        <div style={{ marginTop: 12 }}>Загрузка категорий...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <FolderOpen
          size={40}
          strokeWidth={1}
          style={{ marginBottom: 16, opacity: 0.5 }}
        />
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          {search ? 'Ничего не найдено' : 'Пока нет категорий'}
        </div>
        <div style={{ fontSize: 13 }}>
          {search
            ? 'Попробуйте изменить запрос'
            : 'Создайте первую категорию для группировки товаров'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="categories-table-desktop" style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
            minWidth: 600,
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
                { label: 'Название', width: 'auto' },
                { label: 'Slug', width: 200 },
                { label: 'Товаров', width: 100 },
                { label: 'Сортировка', width: 120 },
                { label: '', width: 100 },
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '14px 16px',
                    textAlign: i === 4 ? 'right' : 'left',
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
            {categories.map((c, i) => {
              const count = productsCount[c.name] || 0;
              return (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background:
                      i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      'rgba(255,255,255,0.03)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')
                  }
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {highlight(c.name)}
                    </div>
                    {c.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <code
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        background: 'var(--bg-soft)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        color: 'var(--muted)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {c.slug}
                    </code>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: count > 0 ? 'var(--text)' : 'var(--muted)',
                      }}
                    >
                      <Package size={12} />
                      <span className="price-num">{count}</span>
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontSize: 13,
                      color: 'var(--muted)',
                    }}
                    className="price-num"
                  >
                    {c.sort_order}
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
                        onClick={() => onEdit(c)}
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
                        onClick={() => onDelete(c.id)}
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

      <div className="categories-table-mobile" style={{ display: 'none' }}>
        {categories.map((c, i) => {
          const count = productsCount[c.name] || 0;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                padding: 16,
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {highlight(c.name)}
                  </div>
                  <code
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {c.slug}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onEdit(c)}
                    aria-label="Редактировать"
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    aria-label="Удалить"
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Package size={11} /> {count} товаров
                </span>
                <span>Порядок: {c.sort_order}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .categories-table-desktop { display: none !important; }
          .categories-table-mobile { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default CategoriesTable;