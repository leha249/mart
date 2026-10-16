import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { priceFormatter } from '../utils/constants';

export interface PriceRange {
  min: number;
  max: number;
}

interface Props {
  priceRange: PriceRange;
  absoluteMin: number;
  absoluteMax: number;
  onChange: (range: PriceRange) => void;
  onReset: () => void;
}

const CategoryFilter = ({
  priceRange,
  absoluteMin,
  absoluteMax,
  onChange,
  onReset,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [localRange, setLocalRange] = useState(priceRange);

  useEffect(() => {
    setLocalRange(priceRange);
  }, [priceRange]);

  const isActive =
    priceRange.min !== absoluteMin || priceRange.max !== absoluteMax;

  const apply = () => {
    // Auto-swap если min > max
    let { min, max } = localRange;
    if (min > max) {
      [min, max] = [max, min];
    }
    onChange({ min, max });
    setOpen(false);
  };

  const handleMinChange = (v: number) => {
    // Если новый min > текущий max — автоматически поднимаем max
    setLocalRange((prev) => {
      const newMax = v > prev.max ? v : prev.max;
      return { min: v, max: newMax };
    });
  };

  const handleMaxChange = (v: number) => {
    // Если новый max < текущий min — автоматически опускаем min
    setLocalRange((prev) => {
      const newMin = v < prev.min ? v : prev.min;
      return { min: newMin, max: v };
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '10px 18px',
          borderRadius: 100,
          border: '1px solid',
          borderColor: isActive ? 'var(--accent)' : 'var(--border)',
          background: isActive ? 'var(--accent)' : 'transparent',
          color: isActive ? '#000' : 'var(--text)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <SlidersHorizontal size={14} />
        Фильтр по цене
        {isActive && (
          <span
            style={{
              minWidth: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--danger)',
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10,
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 320,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                zIndex: 20,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Диапазон цен
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <PriceInput
                  value={localRange.min}
                  min={absoluteMin}
                  max={absoluteMax}
                  onChange={handleMinChange}
                />
                <span style={{ color: 'var(--muted)' }}>—</span>
                <PriceInput
                  value={localRange.max}
                  min={absoluteMin}
                  max={absoluteMax}
                  onChange={handleMaxChange}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    marginBottom: 8,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {priceFormatter.format(localRange.min)} ₽ —{' '}
                  {priceFormatter.format(localRange.max)} ₽
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setLocalRange({ min: absoluteMin, max: absoluteMax });
                    onReset();
                    setOpen(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Сбросить
                </button>
                <button
                  onClick={apply}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Применить
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface PriceInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

const PriceInput = ({ value, min, max, onChange }: PriceInputProps) => (
  <input
    type="number"
    value={value}
    min={min}
    max={max}
    onChange={(e) => {
      const v = Number(e.target.value);
      if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
    }}
    style={{
      flex: 1,
      padding: '10px 14px',
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      color: 'var(--text)',
      fontSize: 14,
      outline: 'none',
      fontFamily: 'inherit',
      fontVariantNumeric: 'tabular-nums',
      minWidth: 0,
    }}
  />
);

export default CategoryFilter;