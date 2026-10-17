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
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(232,255,90,0.08), transparent 70%)',
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
            'radial-gradient(circle, rgba(200,224,61,0.1), transparent 70%)',
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
            Новая коллекция 2025
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 80, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: 0.35,
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              marginBottom: 40,
            }}
          >
            Одежда
            <br />
            для тех, кто
            <br />
            <span
              className="serif"
              style={{
                fontStyle: 'italic',
                color: 'var(--accent)',
                fontWeight: 400,
              }}
            >
              чувствует себя собой
            </span>
          </motion.h1>

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
            Осознанный подход к дизайну. Натуральные ткани, минимализм
            и внимание к деталям — для тех, кто ценит себя.
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
              Смотреть коллекцию
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
              src="https://picsum.photos/seed/morahero/900/1200"
              alt="MØRA MART"
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
              <div style={{ fontSize: 13, fontWeight: 600 }}>Эко-материалы</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                100% органический хлопок
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