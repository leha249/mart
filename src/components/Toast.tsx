import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import type { Toast as ToastType } from '../context/ToastContext';

interface Props {
  toast: ToastType;
  onClose: () => void;
}

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--accent)',
};

const Toast = ({ toast, onClose }: Props) => {
  const Icon = icons[toast.type];
  const color = colors[toast.type];
  const x = useMotionValue(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    timeoutRef.current = window.setTimeout(onClose, 2800);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [paused, onClose]);

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 200, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.05, right: 0.6 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80) onClose();
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        x,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        minWidth: 260,
        maxWidth: 360,
        boxShadow: 'var(--shadow-md)',
        pointerEvents: 'auto',
        touchAction: 'pan-y',
        cursor: 'grab',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <Icon size={16} color="#000" strokeWidth={3} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        aria-label="Закрыть уведомление"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

export default Toast;