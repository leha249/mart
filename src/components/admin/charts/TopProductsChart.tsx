import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { formatPrice } from '../../../utils/format';
import type { TopProduct } from '../../../services/analytics';

interface Props {
  products: TopProduct[];
}

const TopProductsChart = ({ products }: Props) => {
  if (products.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        Пока нет проданных товаров
      </div>
    );
  }

  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {products.map((p, i) => {
        const percent = (p.revenue / maxRevenue) * 100;
        const key = p.product_id ? `top-${p.product_id}` : `top-idx-${i}`;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 12,
              background: 'var(--bg)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                background:
                  i === 0
                    ? 'linear-gradient(90deg, rgba(232,255,90,0.12), transparent)'
                    : 'linear-gradient(90deg, rgba(232,255,90,0.05), transparent)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: i === 0 ? 'var(--accent)' : 'var(--surface)',
                color: i === 0 ? '#000' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 900,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {i === 0 ? <Award size={14} /> : i + 1}
            </div>

            <img
              src={p.product_image}
              alt={p.product_name}
              loading="lazy"
              style={{
                width: 44,
                height: 56,
                objectFit: 'cover',
                borderRadius: 8,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
              }}
            />

            <div
              style={{
                flex: 1,
                minWidth: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.product_name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                }}
              >
                Продано{' '}
                <strong style={{ color: 'var(--text)' }}>{p.sold_count}</strong>{' '}
                шт.
              </div>
            </div>

            <div
              className="price-num"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--accent)',
                textAlign: 'right',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {formatPrice(p.revenue)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default TopProductsChart;