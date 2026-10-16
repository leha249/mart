import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Loader2, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface Props {
  productId: number | null;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const ReviewModal = ({ productId, open, onClose, onSubmitted }: Props) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useBodyLock(open);
  useFocusTrap(open, modalRef);

  useEffect(() => {
    if (!open) {
      setName('');
      setRating(0);
      setHoverRating(0);
      setText('');
      setError('');
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Введите имя';
    if (name.trim().length < 2) return 'Имя слишком короткое';
    if (rating === 0) return 'Поставьте оценку';
    if (!text.trim()) return 'Напишите отзыв';
    if (text.trim().length < 10) return 'Минимум 10 символов';
    if (text.trim().length > 1000) return 'Максимум 1000 символов';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || sending) return;

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSending(true);
    setError('');

    try {
      const { error: dbError } = await supabase.from('reviews').insert({
        product_id: productId,
        author_name: name.trim(),
        rating,
        text: text.trim(),
        approved: false,
      });

      if (dbError) throw dbError;

      setDone(true);
      addToast('Спасибо! Отзыв отправлен на модерацию', 'success');
      onSubmitted?.();

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка отправки';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && productId !== null && (
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
            zIndex: 400,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Оставить отзыв"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            {done ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: '#000',
                  }}
                >
                  <Check size={28} strokeWidth={3} />
                </motion.div>
                <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
                  Спасибо за отзыв!
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Он появится на сайте после проверки модератором
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                    Оставить отзыв
                  </h3>
                  <button
                    onClick={onClose}
                    aria-label="Закрыть"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        Ваше имя *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Иван"
                        maxLength={50}
                        disabled={sending}
                        autoFocus
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

                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        Оценка *
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            disabled={sending}
                            aria-label={`${n} звёзд`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 4,
                              display: 'flex',
                            }}
                          >
                            <Star
                              size={28}
                              fill={
                                (hoverRating || rating) >= n
                                  ? 'var(--accent)'
                                  : 'none'
                              }
                              stroke={
                                (hoverRating || rating) >= n
                                  ? 'var(--accent)'
                                  : 'var(--muted)'
                              }
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: 'var(--muted)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          display: 'block',
                          marginBottom: 8,
                        }}
                      >
                        Отзыв *
                      </label>
                      <textarea
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Расскажите о качестве, посадке, материале..."
                        rows={4}
                        maxLength={1000}
                        disabled={sending}
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
                          resize: 'vertical',
                          minHeight: 100,
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          textAlign: 'right',
                          marginTop: 4,
                        }}
                        className="price-num"
                      >
                        {text.length}/1000
                      </div>
                    </div>

                    {error && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255,77,77,0.1)',
                          border: '1px solid rgba(255,77,77,0.3)',
                          borderRadius: 10,
                          color: 'var(--danger)',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <AlertCircle size={14} /> {error}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'flex-end',
                        marginTop: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        style={{
                          padding: '12px 20px',
                          borderRadius: 100,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text)',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: sending ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          opacity: sending ? 0.5 : 1,
                        }}
                      >
                        Отмена
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: sending ? 1 : 1.03 }}
                        whileTap={{ scale: sending ? 1 : 0.97 }}
                        disabled={sending}
                        style={{
                          padding: '12px 24px',
                          borderRadius: 100,
                          border: 'none',
                          background: 'var(--accent)',
                          color: '#000',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: sending ? 'wait' : 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          opacity: sending ? 0.7 : 1,
                        }}
                      >
                        {sending ? (
                          <>
                            <Loader2
                              size={14}
                              style={{ animation: 'spin 1s linear infinite' }}
                            />
                            Отправка...
                          </>
                        ) : (
                          'Отправить'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ReviewModal;