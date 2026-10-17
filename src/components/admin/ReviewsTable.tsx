import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Trash2,
  Star,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import type { Review } from '../../types/database';
import { formatDate } from '../../utils/format';

interface Props {
  reviews: Review[];
  loading: boolean;
  productsMap: Record<number, { name: string; image: string }>;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  search: string;
  /** Продавец видит отзывы только в режиме просмотра */
  readonly?: boolean;
}

const ReviewsTable = ({
  reviews,
  loading,
  productsMap,
  onApprove,
  onReject,
  onDelete,
  search,
  readonly = false,
}: Props) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handle = async (
    id: number,
    action: (id: number) => Promise<void>
  ) => {
    if (processing !== null) return;
    setProcessing(id);
    try {
      await action(id);
    } finally {
      setProcessing(null);
    }
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
        <Loader2
          size={24}
          style={{
            animation: 'spin 1s linear infinite',
            display: 'inline-block',
          }}
        />
        <div style={{ marginTop: 12 }}>Загрузка отзывов...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div
        style={{
          padding: 80,
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <MessageSquare
          size={40}
          strokeWidth={1}
          style={{ marginBottom: 16, opacity: 0.5 }}
        />
        <div style={{ fontSize: 16, marginBottom: 8 }}>
          {search
            ? 'Ничего не найдено'
            : readonly
            ? 'Отзывов на ваши товары пока нет'
            : 'Отзывов пока нет'}
        </div>
        <div style={{ fontSize: 13 }}>
          {search
            ? 'Попробуйте изменить запрос'
            : readonly
            ? 'Одобренные отзывы покупателей появятся здесь'
            : 'Отзывы от покупателей появятся здесь'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {reviews.map((review, i) => {
          const product = productsMap[review.product_id];
          const isExpanded = expanded.has(review.id);
          const isProcessing = processing === review.id;

          return (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              style={{
                padding: 16,
                borderBottom: '1px solid var(--border)',
                background:
                  i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                {product && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: 56,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 8,
                      flexShrink: 0,
                      opacity: 0.9,
                    }}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                          {highlight(review.author_name)}
                        </span>
                        <div
                          style={{ display: 'flex', gap: 1 }}
                          aria-label={`Оценка ${review.rating} из 5`}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              fill={
                                review.rating >= n ? 'var(--accent)' : 'none'
                              }
                              stroke={
                                review.rating >= n
                                  ? 'var(--accent)'
                                  : 'var(--muted)'
                              }
                            />
                          ))}
                        </div>
                        {review.approved ? (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 100,
                              background: 'rgba(74,222,128,0.15)',
                              color: 'var(--success)',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                            }}
                          >
                            ОДОБРЕН
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 100,
                              background: 'rgba(232,255,90,0.15)',
                              color: '#c8e03d',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                            }}
                          >
                            ЖДЁТ МОДЕРАЦИИ
                          </span>
                        )}
                      </div>

                      {product && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--muted)',
                            marginBottom: 6,
                          }}
                        >
                          Товар:{' '}
                          <strong style={{ color: 'var(--text-dim)' }}>
                            {product.name}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDate(review.created_at)}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: 'var(--text-dim)',
                      marginBottom: isExpanded ? 12 : 0,
                      maxHeight: isExpanded ? 'none' : 60,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {highlight(review.text)}
                  </div>

                  {review.text.length > 200 && (
                    <button
                      onClick={() => toggleExpand(review.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        padding: 0,
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={12} /> Свернуть
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} /> Читать полностью
                        </>
                      )}
                    </button>
                  )}

                  {readonly ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 14,
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      <Eye size={12} />
                      Только просмотр — модерация отзывов за админом
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 14,
                        flexWrap: 'wrap',
                      }}
                    >
                      {!review.approved && (
                        <motion.button
                          whileHover={{ scale: isProcessing ? 1 : 1.03 }}
                          whileTap={{ scale: isProcessing ? 1 : 0.97 }}
                          onClick={() => handle(review.id, onApprove)}
                          disabled={isProcessing}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 100,
                            border: 'none',
                            background: 'var(--success)',
                            color: '#000',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isProcessing ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isProcessing ? (
                            <Loader2
                              size={12}
                              style={{ animation: 'spin 1s linear infinite' }}
                            />
                          ) : (
                            <Check size={12} strokeWidth={3} />
                          )}
                          Одобрить
                        </motion.button>
                      )}

                      <button
                        onClick={() => handle(review.id, onReject)}
                        disabled={isProcessing}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 100,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isProcessing ? 'wait' : 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <X size={12} />
                        Отклонить
                      </button>

                      <button
                        onClick={() => setConfirmDelete(review.id)}
                        disabled={isProcessing}
                        aria-label="Удалить отзыв"
                        style={{
                          padding: '8px 14px',
                          borderRadius: 100,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--danger)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isProcessing ? 'wait' : 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Trash2 size={12} />
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {confirmDelete !== null && !readonly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
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
                maxWidth: 400,
                width: '100%',
                textAlign: 'center',
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
              <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
                Удалить отзыв?
              </h3>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Действие нельзя отменить
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
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
                    const id = confirmDelete;
                    setConfirmDelete(null);
                    handle(id, onDelete);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ReviewsTable;