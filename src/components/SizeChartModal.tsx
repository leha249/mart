import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { SizeChart } from '../types/database';

interface Props {
  category: string | null;
  open: boolean;
  onClose: () => void;
}

const SizeChartModal = ({ category, open, onClose }: Props) => {
  const [chart, setChart] = useState<SizeChart | null>(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useBodyLock(open);
  useFocusTrap(open, modalRef);

  useEffect(() => {
    if (!open || !category) return;
    setLoading(true);
    supabase
      .from('size_charts')
      .select('*')
      .eq('category', category)
      .maybeSingle()
      .then(({ data }) => {
        setChart(data);
        setLoading(false);
      });
  }, [open, category]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
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
            aria-label="Таблица размеров"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 640,
              margin: '40px auto',
              background: 'var(--bg-soft)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(232,255,90,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <Ruler size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    Размеры
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {category || 'Товар'}
                  </div>
                </div>
              </div>
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
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: 28 }}>
              {loading ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 14,
                  }}
                >
                  Загрузка...
                </div>
              ) : !chart ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 14,
                  }}
                >
                  Для категории «{category}» таблица размеров ещё не заполнена
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 14,
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: 'var(--surface)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          {chart.columns.map((col, i) => (
                            <th
                              key={i}
                              style={{
                                padding: '12px 14px',
                                textAlign: 'left',
                                fontSize: 11,
                                color: 'var(--muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chart.rows.map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom:
                                i < chart.rows.length - 1
                                  ? '1px solid var(--border)'
                                  : 'none',
                            }}
                          >
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="price-num"
                                style={{
                                  padding: '12px 14px',
                                  fontWeight: j === 0 ? 700 : 500,
                                  color: j === 0 ? 'var(--accent)' : 'var(--text)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {chart.note && (
                    <div
                      style={{
                        marginTop: 20,
                        padding: 14,
                        background: 'rgba(96,165,250,0.08)',
                        border: '1px solid rgba(96,165,250,0.25)',
                        borderRadius: 12,
                        fontSize: 13,
                        color: 'var(--text-dim)',
                        display: 'flex',
                        gap: 10,
                        lineHeight: 1.6,
                      }}
                    >
                      <Info
                        size={16}
                        color="#60a5fa"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      />
                      {chart.note}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SizeChartModal;