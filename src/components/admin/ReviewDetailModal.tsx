import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, Trash2, X as XIcon } from 'lucide-react';
import type { Review } from '../../types/database';
import { useBodyLock } from '../../hooks/useBodyLock';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { formatDate } from '../../utils/format';

interface Props {
  review: Review | null;
  productName?: string;
  onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const ReviewDetailModal = ({
  review,
  productName,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useBodyLock(!!review);
  useFocusTrap(!!review, modalRef);

  useEffect(() => {
    if (!review) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [review, onClose]);

  return (
    <AnimatePresence>
      {review && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 700,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: '100%',
              position: 'relative',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Закрыть"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Отзыв
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {review.author_name}
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      fill={review.rating >= n ? 'var(--accent)' : 'none'}
                      stroke={
                        review.rating >= n ? 'var(--accent)' : 'var(--muted)'
                      }
                    />
                  ))}
                </div>
                <span>·</span>
                <span>{formatDate(review.created_at)}</span>
              </div>
            </div>

            {productName && (
              <div
                style={{
                  padding: 12,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--muted)' }}>Товар:</span>{' '}
                <strong>{productName}</strong>
              </div>
            )}

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'var(--text-dim)',
                marginBottom: 24,
                padding: 16,
                background: 'var(--surface)',
                borderRadius: 12,
              }}
            >
              {review.text}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!review.approved && (
                <button
                  onClick={async () => {
                    await onApprove(review.id);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--success)',
                    color: '#000',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Check size={15} strokeWidth={3} /> Одобрить
                </button>
              )}

              <button
                onClick={async () => {
                  await onReject(review.id);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <XIcon size={15} /> Отклонить
              </button>

              <button
                onClick={async () => {
                  await onDelete(review.id);
                  onClose();
                }}
                aria-label="Удалить"
                style={{
                  padding: '12px 20px',
                  borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--danger)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewDetailModal;