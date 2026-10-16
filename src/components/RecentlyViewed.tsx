import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { formatPrice } from '../utils/format';
import type { UIProduct } from '../types/database';
import { optimizeImageUrl } from '../utils/imageLoader';

interface Props {
  onProductClick: (p: UIProduct) => void;
}

const RecentlyViewed = ({ onProductClick }: Props) => {
  const { ids } = useRecentlyViewed();
  const { products } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const viewed = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => map.get(id)).filter(Boolean) as UIProduct[];
  }, [ids, products]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setCanScrollLeft(el.scrollLeft > 5);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
        ticking = false;
      });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [viewed.length]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  if (viewed.length < 3) return null;

  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            <Clock size={14} />
            Недавно смотрели
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Назад"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                opacity: canScrollLeft ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Вперёд"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                opacity: canScrollRight ? 1 : 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory',
            paddingBottom: 8,
          }}
        >
          {viewed.map((p) => (
            <motion.button
              key={`recent-${p.id}`}
              onClick={() => onProductClick(p)}
              whileHover={{ y: -4 }}
              style={{
                flexShrink: 0,
                width: 160,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                scrollSnapAlign: 'start',
              }}
            >
              <div
                style={{
                  aspectRatio: '3/4',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  marginBottom: 10,
                }}
              >
                <img
                  src={optimizeImageUrl(p.image, 300)}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  width={300}
                  height={400}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--text)',
                }}
              >
                {p.name}
              </div>
              <div
                className="price-num"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {formatPrice(p.price)}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <style>{`
        div[style*="overflow-x: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
};

export default memo(RecentlyViewed);