import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search as SearchIcon,
  ShoppingBag,
  History,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import type { UIProduct } from '../types/database';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useDebounce } from '../hooks/useDebounce';
import { formatPrice } from '../utils/format';
import { STORAGE_KEYS, LIMITS } from '../utils/constants';

const TOP_QUERIES = ['Пальто', 'Рубашка', 'Кеды', 'Сумка', 'Брюки'];

interface Props {
  open: boolean;
  onClose: () => void;
  onProductSelect?: (p: UIProduct) => void;
}

const SearchOverlay = ({ open, onClose, onProductSelect }: Props) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();
  const { addItem } = useCart();
  const { addToast } = useToast();

  useBodyLock(open);
  useFocusTrap(open, containerRef);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.searchHistory);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, LIMITS.maxSearchHistory));
      }
    } catch {}
  }, [open]);

  const saveToHistory = useCallback((term: string) => {
    const t = term.trim();
    if (!t || t.length < 2) return;
    setHistory((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, LIMITS.maxSearchHistory);
      try {
        localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeFromHistory = (term: string) => {
    setHistory((prev) => {
      const next = prev.filter((x) => x !== term);
      try {
        localStorage.setItem(STORAGE_KEYS.searchHistory, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.searchHistory);
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [debouncedQuery, products]);

  const handleAdd = (e: React.MouseEvent, p: UIProduct) => {
    e.stopPropagation();
    addItem({ id: p.id, name: p.name, price: p.price, image: p.image });
    addToast(`${p.name} добавлен в корзину`, 'success');
  };

  const handleProductClick = (p: UIProduct) => {
    saveToHistory(query);
    onClose();
    onProductSelect?.(p);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveToHistory(query);
  };

  const applyQuery = (q: string) => {
    setQuery(q);
    saveToHistory(q);
    inputRef.current?.focus();
  };

  const isSearching = query !== debouncedQuery;
  const showSuggestions = query.trim() === '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 300,
            padding: '80px 40px 40px',
            overflowY: 'auto',
          }}
        >
          <div ref={containerRef} style={{ minHeight: '100%' }}>
            <motion.button
              key="search-close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15 }}
              onClick={onClose}
              aria-label="Закрыть поиск"
              style={{
                position: 'fixed',
                top: 32,
                right: 40,
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: 8,
                zIndex: 2,
              }}
            >
              <X size={28} />
            </motion.button>

            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <form onSubmit={handleQuerySubmit}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 20,
                    marginBottom: 40,
                  }}
                >
                  <SearchIcon
                    size={24}
                    color="var(--muted)"
                    style={{ flexShrink: 0 }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ищите одежду, категории..."
                    aria-label="Поиск товаров"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text)',
                      fontSize: 'clamp(20px, 3vw, 28px)',
                      fontFamily: 'inherit',
                      fontWeight: 500,
                      minWidth: 0,
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      aria-label="Очистить"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </form>

              {showSuggestions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {history.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <History size={12} /> История
                        </span>
                        <button
                          onClick={clearHistory}
                          aria-label="Очистить историю"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 11,
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={11} /> Очистить
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        {history.map((h) => (
                          <div
                            key={`history-${h}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 100,
                              fontSize: 13,
                            }}
                          >
                            <button
                              onClick={() => applyQuery(h)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 13,
                                padding: 0,
                              }}
                            >
                              {h}
                            </button>
                            <button
                              onClick={() => removeFromHistory(h)}
                              aria-label={`Убрать ${h} из истории`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                              }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <TrendingUp size={12} /> Популярное
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {TOP_QUERIES.map((q, i) => (
                        <button
                          key={`top-${i}`}
                          onClick={() => applyQuery(q)}
                          style={{
                            padding: '8px 14px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 100,
                            color: 'var(--text)',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {query.trim() !== '' && !isSearching && results.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Ничего не найдено по запросу «{query}»
                </div>
              )}

              {isSearching && (
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Поиск...
                </div>
              )}

              {results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {results.map((p, i) => (
                    <motion.div
                      key={`result-${p.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => handleProductClick(p)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleProductClick(p);
                      }}
                      style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 16,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        flexWrap: 'wrap',
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        style={{
                          width: 60,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 10,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--muted)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                        >
                          {p.category}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                      </div>
                      <div
                        className="price-num"
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        {formatPrice(p.price)}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleAdd(e, p)}
                        aria-label={`Добавить ${p.name} в корзину`}
                        style={{
                          padding: '10px 20px',
                          background: 'var(--accent)',
                          color: '#000',
                          border: 'none',
                          borderRadius: 100,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <ShoppingBag size={14} /> В корзину
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;