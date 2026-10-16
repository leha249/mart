import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { useToast } from '../context/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        top: 100,
        right: 20,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;