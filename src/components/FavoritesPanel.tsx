import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../context/ProductsContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { formatPrice, pluralize } from '../utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
}

const FavoritesPanel = ({ open, onClose }: Props) => {
  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const { products } = useProducts();
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyLock(open);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const favoriteProducts = useMemo(
    () => products.filter((p) => favorites.includes(p.id)),
    [products, favorites]
  );

  const handleAddToCart = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    addToast(`${product.name} добавлен в корзину`, 'success');
  };

  const itemWord = pluralize(
    favoriteProducts.length,
    'товар',
    'товара',
    'товаров'
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="favorites-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />
          <motion.div
            key="favorites-panel"
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Избранное"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: 460,
              background: 'var(--bg-soft)',
              borderLeft: '1px solid var(--border)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Избранное
                </div>
                <div
                  className="price-num"
                  style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}
                >
                  {favoriteProducts.length} {itemWord}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Закрыть избранное"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  padding: 8,
                }}
              >
                <X size={22} />
              </motion.button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {favoriteProducts.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 20,
                    color: 'var(--muted)',
                  }}
                >
                  <Heart size={48} strokeWidth={1} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>
                      Список пуст
                    </div>
                    <div style={{ fontSize: 13 }}>
                      Добавляй товары, чтобы не потерять
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <AnimatePresence>
                    {favoriteProducts.map((item) => (
                      <motion.div
                        key={`fav-${item.id}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        style={{
                          display: 'flex',
                          gap: 16,
                          padding: 12,
                          border: '1px solid var(--border)',
                          borderRadius: 16,
                          background: 'var(--surface)',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: 80,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 10,
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                marginBottom: 4,
                              }}
                            >
                              {item.name}
                            </div>
                            <div
                              className="price-num"
                              style={{
                                fontSize: 13,
                                color: 'var(--accent)',
                                fontWeight: 700,
                              }}
                            >
                              {formatPrice(item.price)}
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'center',
                            }}
                          >
                            <button
                              onClick={() => handleAddToCart(item.id)}
                              style={{
                                flex: 1,
                                padding: '8px 14px',
                                background: 'var(--accent)',
                                color: '#000',
                                border: 'none',
                                borderRadius: 100,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}
                            >
                              <ShoppingBag size={14} /> В корзину
                            </button>
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              aria-label={`Убрать ${item.name} из избранного`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                padding: 4,
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FavoritesPanel;