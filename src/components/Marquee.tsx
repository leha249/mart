import { motion } from 'framer-motion';

interface Props {
  items?: string[];
  speed?: number;
}

const Marquee = ({
  items = ['NEW ARRIVALS', 'WINTER 2025', 'DPR.MART', 'FREE SHIPPING'],
  speed = 30,
}: Props) => {
  const text = items.join('  ·  ');

  return (
    <div
      style={{
        overflow: 'hidden',
        padding: '48px 0',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        background: 'var(--bg)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {/* Левый градиент */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 200,
          background: 'linear-gradient(90deg, var(--bg), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      {/* Правый градиент */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 200,
          background: 'linear-gradient(-90deg, var(--bg), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          display: 'inline-flex',
          gap: 40,
        }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            style={{
              fontSize: 'clamp(40px, 8vw, 96px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'transparent',
              WebkitTextStroke: '1px var(--muted)',
              paddingRight: 40,
              lineHeight: 1,
            }}
          >
            {text}  ·  {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default Marquee;