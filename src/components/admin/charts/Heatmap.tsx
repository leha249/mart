import { Fragment, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
}

const DEFAULT_ROWS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DEFAULT_COLS = ['0', '3', '6', '9', '12', '15', '18', '21'];

const Heatmap = ({
  data,
  rowLabels = DEFAULT_ROWS,
  colLabels = DEFAULT_COLS,
}: Props) => {
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);

  const maxValue = useMemo(() => {
    let max = 1;
    data.forEach((row) => row.forEach((v) => (max = Math.max(max, v))));
    return max;
  }, [data]);

  const getColor = (value: number): string => {
    if (value === 0) return 'var(--border)';
    const intensity = Math.min(value / maxValue, 1);
    return `rgba(232, 255, 90, ${0.15 + intensity * 0.85})`;
  };

  return (
    <div style={{ overflowX: 'auto', padding: '4px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `40px repeat(${colLabels.length}, minmax(32px, 1fr))`,
          gap: 4,
          minWidth: 320,
        }}
      >
        {/* Заголовки колонок */}
        <div />
        {colLabels.map((label) => (
          <div
            key={`col-${label}`}
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              textAlign: 'center',
              paddingBottom: 4,
            }}
          >
            {label}
          </div>
        ))}

        {/* Строки */}
        {data.map((row, r) => (
          <Fragment key={`row-${r}`}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
              }}
            >
              {rowLabels[r] || r}
            </div>
            {row.map((value, c) => {
              const isHovered = hovered?.r === r && hovered?.c === c;
              return (
                <motion.div
                  key={`cell-${r}-${c}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: (r * row.length + c) * 0.01,
                    duration: 0.3,
                  }}
                  onMouseEnter={() => setHovered({ r, c })}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 6,
                    background: getColor(value),
                    border: isHovered
                      ? '2px solid var(--accent)'
                      : '1px solid transparent',
                    cursor: value > 0 ? 'pointer' : 'default',
                    position: 'relative',
                    transition: 'transform 0.15s',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    minHeight: 28,
                  }}
                  title={`${rowLabels[r]}, ${colLabels[c]}:00 — ${value} заказов`}
                >
                  {isHovered && value > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '6px 10px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <strong>{value}</strong> заказов
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--muted)',
                          marginTop: 2,
                        }}
                      >
                        {rowLabels[r]}, {colLabels[c]}:00
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Легенда */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>меньше</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[0.15, 0.35, 0.55, 0.75, 1].map((o, i) => (
            <div
              key={`legend-${i}`}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: `rgba(232, 255, 90, ${o})`,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>больше</span>
      </div>
    </div>
  );
};

export default Heatmap;