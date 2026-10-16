import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface Props {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

const Lightbox = ({ images, initialIndex = 0, open, onClose }: Props) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useBodyLock(open);
  useFocusTrap(open, containerRef);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1)
        setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight' && images.length > 1)
        setIndex((i) => (i + 1) % images.length);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.5, 3));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.5, 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (zoom > 1 || images.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) setIndex((i) => (i - 1 + images.length) % images.length);
      else setIndex((i) => (i + 1) % images.length);
    }
  };

  if (images.length === 0) return null;

  const hasMultiple = images.length > 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.97)',
            zIndex: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <X size={20} />
          </button>

          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              display: 'flex',
              gap: 8,
              zIndex: 5,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
              disabled={zoom <= 1}
              aria-label="Уменьшить"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: zoom <= 1 ? 0.4 : 1,
              }}
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.5, 3))}
              disabled={zoom >= 3}
              aria-label="Увеличить"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: zoom >= 3 ? 0.4 : 1,
              }}
            >
              <ZoomIn size={18} />
            </button>
            {zoom > 1 && (
              <div
                className="price-num"
                style={{
                  padding: '0 14px',
                  height: 44,
                  borderRadius: 100,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {zoom.toFixed(1)}×
              </div>
            )}
          </div>

          <motion.img
            key={index}
            src={images[index]}
            alt={`Фото ${index + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: zoom }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 12,
              userSelect: 'none',
              touchAction: zoom > 1 ? 'none' : 'pan-y',
              transition: 'transform 0.2s',
            }}
          />

          {/* Навигация показывается ТОЛЬКО если больше одной картинки */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + images.length) % images.length);
                }}
                aria-label="Предыдущее"
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % images.length);
                }}
                aria-label="Следующее"
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
              >
                <ChevronRight size={22} />
              </button>

              <div
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 6,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 100,
                  zIndex: 5,
                }}
              >
                {images.map((_, i) => (
                  <button
                    key={`lb-dot-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndex(i);
                    }}
                    aria-label={`Фото ${i + 1}`}
                    style={{
                      width: i === index ? 20 : 6,
                      height: 6,
                      borderRadius: 100,
                      border: 'none',
                      background:
                        i === index ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.25s',
                    }}
                  />
                ))}
              </div>

              <div
                className="price-num"
                style={{
                  position: 'absolute',
                  top: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  letterSpacing: '2px',
                  zIndex: 5,
                }}
              >
                {index + 1} / {images.length}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;