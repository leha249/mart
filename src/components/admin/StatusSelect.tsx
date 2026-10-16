import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import type { OrderStatus } from '../../types/database';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/database';

interface Props {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
}

const ALL_STATUSES: OrderStatus[] = [
  'new',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const StatusSelect = ({ value, onChange, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colors = ORDER_STATUS_COLORS[value];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Изменить статус"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 100,
          border: '1px solid var(--border)',
          background: colors.bg,
          color: colors.text,
          fontSize: 13,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.text,
          }}
        />
        {ORDER_STATUS_LABELS[value]}
        {!disabled && (
          <ChevronDown
            size={13}
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 200,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 6,
              zIndex: 100,
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            {ALL_STATUSES.map((s) => {
              const c = ORDER_STATUS_COLORS[s];
              const isActive = s === value;
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    if (s !== value) onChange(s);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: c.text,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{ORDER_STATUS_LABELS[s]}</span>
                  {isActive && <Check size={14} color={c.text} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusSelect;