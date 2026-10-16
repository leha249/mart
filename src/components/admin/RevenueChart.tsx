import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/format';
import type { RevenueDay } from '../../services/analytics';

interface Props {
  data: RevenueDay[];
  height?: number;
}

const RevenueChart = ({ data, height = 240 }: Props) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 800;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + innerH - (d.revenue / maxRevenue) * innerH,
      ...d,
    }));

    // Path для линии
    let linePath = '';
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cx = (prev.x + curr.x) / 2;
        linePath += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
      }
    }

    // Area path (заливка под линией)
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${
            padding.top + innerH
          } L ${points[0].x} ${padding.top + innerH} Z`
        : '';

    return { points, linePath, areaPath, width, height, padding, maxRevenue, innerH };
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
        Нет данных за выбранный период
      </div>
    );
  }

  const { points, linePath, areaPath, width, padding, maxRevenue, innerH } =
    chart;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxRevenue / yTicks) * i)
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
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Сетка */}
        {yLabels.map((label, i) => {
          const y = padding.top + innerH - (i / yTicks) * innerH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={i === 0 ? '0' : '3 3'}
                opacity={i === 0 ? 1 : 0.5}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fontSize={10}
                fill="var(--muted)"
                textAnchor="end"
              >
                {label >= 1000 ? `${Math.round(label / 1000)}k` : label} ₽
              </text>
            </g>
          );
        })}

        {/* Area */}
        <motion.path
          d={areaPath}
          fill="url(#revenueArea)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Points */}
        {points.map((p, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 6 : 4}
              fill="var(--bg)"
              stroke="var(--accent)"
              strokeWidth={2}
              style={{ transition: 'r 0.15s' }}
            />
            {/* Невидимая область для легкого hover */}
            <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          const step = Math.ceil(points.length / 6);
          if (i % step !== 0 && i !== points.length - 1) return null;
          const date = new Date(p.day);
          return (
            <text
              key={i}
              x={p.x}
              y={height - 12}
              fontSize={10}
              fill="var(--muted)"
              textAnchor="middle"
            >
              {date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </text>
          );
        })}

        {/* Tooltip */}
        {hoverIndex !== null && points[hoverIndex] && (
          <g>
            <line
              x1={points[hoverIndex].x}
              y1={padding.top}
              x2={points[hoverIndex].x}
              y2={padding.top + innerH}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.4}
            />
          </g>
        )}
      </svg>

      {/* Tooltip HTML поверх SVG */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hoverIndex].x / width) * 100}%`,
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
            {new Date(points[hoverIndex].day).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
          </div>
          <div style={{ color: 'var(--accent)' }}>
            {formatPrice(points[hoverIndex].revenue)}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>
            {points[hoverIndex].orders_count}{' '}
            {points[hoverIndex].orders_count === 1 ? 'заказ' : 'заказов'}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;