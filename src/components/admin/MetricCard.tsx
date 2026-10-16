import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  prevValue?: number;
  icon?: React.ReactNode;
  accent?: boolean;
  suffix?: string;
  sparkline?: React.ReactNode;
}

const MetricCard = ({
  label,
  value,
  prevValue,
  icon,
  accent,
  suffix,
  sparkline,
}: Props) => {
  const currentNum =
    typeof value === 'number' ? value : parseFloat(String(value));
  const hasComparison = prevValue !== undefined && prevValue !== null;
  const change =
    hasComparison && prevValue !== 0
      ? ((currentNum - prevValue) / prevValue) * 100
      : 0;
  const isUp = change > 0.5;
  const isDown = change < -0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {accent && (
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(232,255,90,0.15), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: accent ? 'rgba(232,255,90,0.12)' : 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent ? 'var(--accent)' : 'var(--muted)',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span
            className="price-num"
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: '-0.5px',
              color: accent ? 'var(--accent)' : 'var(--text)',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          {suffix && (
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>
              {suffix}
            </span>
          )}
        </div>

        {sparkline && <div style={{ flexShrink: 0 }}>{sparkline}</div>}
      </div>

      {hasComparison && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 8px',
              borderRadius: 100,
              background: isUp
                ? 'rgba(74,222,128,0.15)'
                : isDown
                ? 'rgba(255,77,77,0.15)'
                : 'rgba(255,255,255,0.05)',
              color: isUp
                ? 'var(--success)'
                : isDown
                ? 'var(--danger)'
                : 'var(--muted)',
              fontWeight: 700,
            }}
          >
            {isUp ? (
              <ArrowUp size={11} />
            ) : isDown ? (
              <ArrowDown size={11} />
            ) : (
              <Minus size={11} />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span style={{ color: 'var(--muted)' }}>vs прошлый период</span>
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;