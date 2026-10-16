import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useBodyLock } from '../hooks/useBodyLock';

const images = [
  'https://picsum.photos/seed/look1/1200/1600',
  'https://picsum.photos/seed/look2/1200/1600',
  'https://picsum.photos/seed/look3/1200/1600',
  'https://picsum.photos/seed/look4/1200/1600',
];

const Lookbook = () => {
  const [active, setActive] = useState<number | null>(null);

  useBodyLock(active !== null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowLeft')
        setActive((a) => (a === null ? null : (a - 1 + images.length) % images.length));
      if (e.key === 'ArrowRight')
        setActive((a) => (a === null ? null : (a + 1) % images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <section
      id="lookbook"
      style={{
        padding: '120px 0',
        background: 'var(--bg-soft)',
        scrollMarginTop: 80,
      }}
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 16,
            }}
          >
            • Lookbook SS25
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 900,
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            Моменты{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
              стиля
            </span>
          </h2>
        </motion.div>

        <div
          className="lookbook-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            gridAutoRows: 240,
          }}
        >
          {images.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActive(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActive(i);
              }}
              aria-label={`Открыть Look ${i + 1}`}
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                position: 'relative',
                gridColumn: i === 0 ? 'span 2' : i === 3 ? 'span 2' : 'span 1',
                gridRow: 'span 1',
                cursor: 'pointer',
              }}
              className="look-item"
            >
              <img
                src={src}
                alt={`Look ${i + 1}`}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="look-img"
              />
              <div
                className="look-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 24,
                  opacity: 0,
                  transition: 'opacity 0.35s',
                }}
              >
                <div
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                >
                  Look {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(12px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive(null);
              }}
              aria-label="Закрыть"
              style={{
                position: 'absolute',
                top: 32,
                right: 40,
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: 8,
              }}
            >
              <X size={28} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive((active - 1 + images.length) % images.length);
              }}
              aria-label="Предыдущее"
              style={{
                position: 'absolute',
                left: 40,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                padding: 12,
                borderRadius: '50%',
                display: 'flex',
                zIndex: 2,
              }}
            >
              <ArrowLeft size={20} />
            </button>

            <motion.img
              key={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              src={images[active]}
              alt={`Look ${active + 1}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: 16,
                objectFit: 'contain',
              }}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive((active + 1) % images.length);
              }}
              aria-label="Следующее"
              style={{
                position: 'absolute',
                right: 40,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                padding: 12,
                borderRadius: '50%',
                display: 'flex',
                zIndex: 2,
              }}
            >
              <ArrowRight size={20} />
            </button>

            <div
              style={{
                position: 'absolute',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                letterSpacing: '2px',
              }}
            >
              {active + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .look-item:hover .look-overlay { opacity: 1 !important; }
        .look-item:hover .look-img { transform: scale(1.08); }
        @media (max-width: 900px) {
          .lookbook-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lookbook-grid > div { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  );
};

export default Lookbook;