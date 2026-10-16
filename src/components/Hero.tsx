import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const Hero = () => {
  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      {/* Свечение */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(212,247,255,0.1), transparent 70%)',
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
          background:
            'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)',
          bottom: '5%',
          left: '-15%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        className="container hero-container"
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
                background: 'var(--accent)',
                boxShadow: '0 0 12px var(--accent)',
              }}
            />
            New Collection 2025
          </motion.div>

          {/* Большое название бренда */}
          <motion.div
            initial={{ opacity: 0, y: 80, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: 0.35,
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              fontSize: 'clamp(72px, 14vw, 200px)',
              fontWeight: 700,
              letterSpacing: '-0.06em',
              lineHeight: 0.85,
              marginBottom: 40,
              wordBreak: 'break-word',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
            }}
          >
            DPR
            <span
              style={{
                color: 'var(--accent)',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              .
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5, ease: 'backOut' }}
                style={{
                  position: 'absolute',
                  bottom: '0.15em',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '0.1em',
                  height: '0.1em',
                  borderRadius: '50%',
                  background: 'var(--accent-blue)',
                  boxShadow: '0 0 16px var(--accent-blue)',
                }}
              />
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            style={{
              fontSize: 17,
              color: 'var(--muted)',
              maxWidth: 440,
              marginBottom: 44,
              lineHeight: 1.65,
            }}
          >
            Одежда, обувь и аксессуары. Новые поступления каждую неделю.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="hero-buttons"
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}
          >
            <motion.a
              href="#shop"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '20px 36px',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                borderRadius: 100,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Смотреть каталог
              <ArrowUpRight size={18} strokeWidth={2} />
            </motion.a>
            <motion.a
              href="#lookbook"
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
              Lookbook
            </motion.a>
          </motion.div>
        </div>

        {/* Фото справа */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="hero-image-wrap"
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
            <motion.img
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              src="https://picsum.photos/seed/dprhero/900/1200"
              alt="DPR.MART"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

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
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-contrast)',
                fontWeight: 700,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              ◆
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>New Season</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Обновление каждую неделю
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
          .hero-image-wrap { display: none; }
          .hero-container { grid-template-columns: 1fr !important; gap: 0 !important; }
        }
        @media (max-width: 500px) {
          .hero-buttons { flex-direction: column !important; }
          .hero-buttons > a { width: 100% !important; }
        }
      `}</style>
    </section>
  );
};

export default Hero;