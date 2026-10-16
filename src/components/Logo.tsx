import { motion } from 'framer-motion';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withSuffix?: boolean;
  animated?: boolean;
  color?: string;
}

const sizeMap = {
  sm: 16,
  md: 22,
  lg: 30,
  xl: 44,
};

const Logo = ({
  size = 'md',
  withSuffix = true,
  animated = false,
  color,
}: Props) => {
  const fontSize = sizeMap[size];

  const content = (
    <span
      style={{
        fontSize,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: color || 'var(--text)',
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        textDecoration: 'none',
        fontFamily: "'Space Grotesk', sans-serif",
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
        <span
          style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'var(--accent-blue)',
            boxShadow: '0 0 5px var(--accent-blue)',
          }}
        />
      </span>
      {withSuffix && (
        <span
          style={{
            fontSize: fontSize * 0.5,
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            marginLeft: fontSize * 0.15,
          }}
        >
          MART
        </span>
      )}
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'inline-flex' }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export default Logo;