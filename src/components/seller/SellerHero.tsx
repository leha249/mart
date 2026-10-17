import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Store } from 'lucide-react';
import type { UISeller } from '../../types/database';

interface Props {
  seller: UISeller;
}

const SellerHero = ({ seller }: Props) => {
  // Дефолтные тексты MØRA — используются, если продавец ничего не заполнил
  const badge = seller.heroBadge || 'Магазин продавца';
  const title = seller.heroTitle || 'Одежда для тех, кто чувствует себя собой';
  const subtitle =
    seller.heroSubtitle ||
    'Осознанный подход к дизайну. Натуральные ткани, минимализм и внимание к деталям — для тех, кто ценит себя.';

  // Акцентный цвет продавца (или жёлтый MØRA по умолчанию)
  const accent = seller.accentColor || 'var(--accent)';
  const accentContrast = '#000';

  return (
    <section
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      {/* Свечения в цвете продавца */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}14, transparent 70%)`,
          top: '5%',
          right: '-15%',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}10, transparent 70%)`,
          bottom: '5%',
          left: '-15%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        className="container seller-hero-container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: 80,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          {/* Плашка */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: 100,
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 40,
              color: 'var(--muted)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accent,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
            {badge}
          </motion.div>

          {/* Заголовок */}
          <motion.h1
            initial={{ opacity: 0, y: 80, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: 0.35,
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              fontSize: 'clamp(42px, 7vw, 84px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: 32,
            }}
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            style={{
              fontSize: 17,
              color: 'var(--muted)',
              maxWidth: 480,
              marginBottom: 44,
              lineHeight: 1.65,
            }}
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="seller-hero-buttons"
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}
          >
            <motion.a
              href="#catalog"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '20px 36px',
                background: accent,
                color: accentContrast,
                borderRadius: 100,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Смотреть товары
              <ArrowUpRight size={18} strokeWidth={2} />
            </motion.a>
            <motion.a
              href="#about"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '20px 36px',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: 100,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              О магазине
            </motion.a>
          </motion.div>
        </div>

        {/* Фото продавца */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.5,
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="seller-hero-image-wrap"
          style={{ position: 'relative' }}
        >
          <div
            style={{
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              aspectRatio: '3/4',
              background: 'var(--surface)',
            }}
          >
            {seller.heroImage ? (
              <motion.img
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 1.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                src={seller.heroImage}
                alt={seller.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : seller.cover ? (
              <img
                src={seller.cover}
                alt={seller.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : seller.logo ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-hi)',
                  padding: 40,
                }}
              >
                <img
                  src={seller.logo}
                  alt={seller.name}
                  style={{
                    maxWidth: '70%',
                    maxHeight: '70%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-hi)',
                  color: 'var(--muted)',
                }}
              >
                <Store size={64} strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Бейдж с названием магазина */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            style={{
              position: 'absolute',
              bottom: 24,
              left: -24,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              padding: '16px 20px',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backdropFilter: 'blur(12px)',
              maxWidth: 280,
            }}
          >
            {seller.logo ? (
              <img
                src={seller.logo}
                alt={seller.name}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentContrast,
                  fontWeight: 700,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {seller.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {seller.description || 'Магазин на MØRA MART'}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        <ArrowDown size={14} /> Scroll
      </motion.div>

      <style>{`
        @media (max-width: 900px) {
          .seller-hero-image-wrap { display: none; }
          .seller-hero-container { grid-template-columns: 1fr !important; gap: 0 !important; }
        }
        @media (max-width: 500px) {
          .seller-hero-buttons { flex-direction: column !important; }
          .seller-hero-buttons > a { width: 100% !important; }
        }
      `}</style>
    </section>
  );
};

export default SellerHero;