import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Props {
  onDone: () => void;
}

const Preloader = ({ onDone }: Props) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    let cancelled = false;

    const preload = async () => {
      try {
        await Promise.race([
          supabase.from('products').select('id').limit(20),
          new Promise((r) => setTimeout(r, 1500)),
        ]);
      } catch {}
    };

    preload();

    const interval = setInterval(() => {
      p += Math.random() * 22 + 14;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        if (!cancelled) {
          setTimeout(() => {
            setVisible(false);
            setTimeout(onDone, 600);
          }, 250);
        }
      }
      setProgress(Math.min(p, 100));
    }, 90);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(52px, 11vw, 132px)',
              fontWeight: 700,
              letterSpacing: '-0.05em',
              display: 'flex',
              alignItems: 'baseline',
              lineHeight: 1,
            }}
          >
            {['M', 'Ø', 'R', 'A'].map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: 0.15 + i * 0.09,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: 'backOut' }}
              style={{
                color: 'var(--accent)',
                display: 'inline-block',
              }}
            >
              .
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              style={{
                fontSize: '0.34em',
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: 'var(--muted)',
                marginLeft: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              MART
            </motion.span>
          </div>

          <div
            style={{
              width: 240,
              height: 1,
              background: 'var(--border)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                height: '100%',
                background:
                  'linear-gradient(90deg, var(--accent) 0%, var(--accent-dark) 100%)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;