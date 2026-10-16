import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  sublabel?: string;
}

interface Props {
  data: DataPoint[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
  labelFormatter?: (label: string) => string;
}

const BarChart = ({
  data,
  height = 220,
  color = 'var(--accent)',
  valueFormatter = (v) => String(v),
  labelFormatter = (l) => l,
}: Props) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 16, bottom: 36, left: 52 };
    const width = 800;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const barGap = 4;
    const barWidth = Math.max(
      4,
      (innerW - barGap * (data.length - 1)) / data.length
    );

    const bars = data.map((d, i) => ({
      x: padding.left + i * (barWidth + barGap),
      y: padding.top + innerH - (d.value / maxValue) * innerH,
      height: (d.value / maxValue) * innerH,
      width: barWidth,
      ...d,
    }));

    return { bars, width, height, padding, maxValue, innerH, innerW };
  }, [data, height]);

  if (!chart || data.length === 0) {
    return (
      <div
        style={{
          height,
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

  const { bars, width, padding, maxValue, innerH } = chart;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxValue / yTicks) * i)
  );

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          height: 'auto',
          minWidth: 600,
          display: 'block',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {yLabels.map((label, i) => {
          const y = padding.top + innerH - (i / yTicks) * innerH;
          return (
            <g key={`ylab-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border)"
                strokeDasharray={i === 0 ? '0' : '3 3'}
                opacity={i === 0 ? 1 : 0.4}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fontSize={10}
                fill="var(--muted)"
                textAnchor="end"
              >
                {label >= 1000 ? `${Math.round(label / 1000)}k` : label}
              </text>
            </g>
          );
        })}

        {bars.map((bar, i) => {
          const isHovered = hoverIndex === i;
          return (
            <g
              key={`bar-${i}`}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <motion.rect
                x={bar.x}
                width={bar.width}
                initial={{ y: padding.top + innerH, height: 0 }}
                animate={{
                  y: bar.y,
                  height: Math.max(bar.height, 2),
                }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.02,
                  ease: [0.22, 1, 0.36, 1],
                }}
                rx={4}
                fill={color}
                opacity={isHovered ? 1 : 0.7}
                style={{ transition: 'opacity 0.2s' }}
              />
              <rect
                x={bar.x - 2}
                y={padding.top}
                width={bar.width + 4}
                height={innerH}
                fill="transparent"
              />
            </g>
          );
        })}

        {bars.map((bar, i) => {
          const step = Math.ceil(bars.length / 8);
          if (i % step !== 0 && i !== bars.length - 1) return null;
          return (
            <text
              key={`xlab-${i}`}
              x={bar.x + bar.width / 2}
              y={height - 12}
              fontSize={10}
              fill="var(--muted)"
              textAnchor="middle"
            >
              {labelFormatter(bar.label)}
            </text>
          );
        })}
      </svg>

      {hoverIndex !== null && bars[hoverIndex] && (
        <div
          style={{
            position: 'absolute',
            left: `${(bars[hoverIndex].x / width) * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {bars[hoverIndex].sublabel || bars[hoverIndex].label}
          </div>
          <div style={{ color: 'var(--accent)', fontWeight: 700 }}>
            {valueFormatter(bars[hoverIndex].value)}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarChart;