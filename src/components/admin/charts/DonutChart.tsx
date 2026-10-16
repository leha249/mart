import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { OrderStatus } from '../../../types/database';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../../../types/database';

interface Segment {
  status: OrderStatus;
  value: number;
}

interface Props {
  data: Segment[];
  size?: number;
  thickness?: number;
}

const DonutChart = ({ data, size = 200, thickness = 32 }: Props) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const filtered = data.filter((d) => d.value > 0);
    const total = filtered.reduce((s, d) => s + d.value, 0);

    if (total === 0) return null;

    const radius = (size - thickness) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;
    const segments = filtered.map((d, i) => {
      const fraction = d.value / total;
      const dashLength = fraction * circumference;
      const segment = {
        ...d,
        key: `segment-${d.status}-${i}`,
        fraction,
        dashLength,
        dashOffset: -currentOffset,
        circumference,
        radius,
        center,
      };
      currentOffset += dashLength;
      return segment;
    });

    return { segments, total, circumference, radius, center };
  }, [data, size, thickness]);

  if (!chart) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        Нет данных
      </div>
    );
  }

  const { segments, total, circumference, radius, center } = chart;
  const activeSegment = hoverIndex !== null ? segments[hoverIndex] : null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={thickness}
            opacity={0.3}
          />

          {segments.map((seg, i) => {
            const isHovered = hoverIndex === i;
            const colors = ORDER_STATUS_COLORS[seg.status];
            return (
              <motion.circle
                key={seg.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={colors.text}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeDasharray={`${seg.dashLength} ${circumference}`}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                initial={{
                  strokeDasharray: `0 ${circumference}`,
                }}
                animate={{
                  strokeDasharray: `${seg.dashLength} ${circumference}`,
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.2s',
                }}
              />
            );
          })}
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {activeSegment ? (
            <>
              <div
                className="price-num"
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  color: ORDER_STATUS_COLORS[activeSegment.status].text,
                }}
              >
                {activeSegment.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {ORDER_STATUS_LABELS[activeSegment.status]}
              </div>
            </>
          ) : (
            <>
              <div
                className="price-num"
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: '-1px',
                }}
              >
                {total}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Всего
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 140,
        }}
      >
        {segments.map((seg, i) => {
          const colors = ORDER_STATUS_COLORS[seg.status];
          const isHovered = hoverIndex === i;
          return (
            <div
              key={`legend-${seg.key}`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 8,
                background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: colors.text,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: 'var(--text-dim)',
                }}
              >
                {ORDER_STATUS_LABELS[seg.status]}
              </div>
              <div
                className="price-num"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {seg.value}
              </div>
              <div
                className="price-num"
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  minWidth: 40,
                  textAlign: 'right',
                }}
              >
                {(seg.fraction * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutChart;