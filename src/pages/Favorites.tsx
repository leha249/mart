import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import { optimizeImageUrl } from '../utils/imageLoader';

const FavoritesPage = () => {
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const { products, loading } = useProducts();
  const { addItem } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Избранное — MØRA MART';
    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  const favoriteProducts = useMemo(
    () => products.filter((p) => favorites.includes(p.id)),
    [products, favorites]
  );

  const handleAddAllToCart = () => {
    let count = 0;
    favoriteProducts.forEach((p) => {
      if (p.sizes.length === 0 && p.inStock) {
        addItem({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
        });
        count++;
      }
    });
    if (count > 0) {
      addToast(`Добавлено в корзину: ${count}`, 'success');
    } else {
      addToast('Все товары требуют выбора размера', 'info');
    }
  };

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '100px 0 60px',
      }}
    >
      <div className="container">
        <button
          onClick={goHome}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'inherit',
            padding: 0,
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} /> На главную
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 40,
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              • Избранное
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(32px, 5vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <Heart size={44} fill="var(--danger)" stroke="var(--danger)" />
              <span>
                {favoriteProducts.length}{' '}
                <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                  {favoriteProducts.length === 1
                    ? 'товар'
                    : favoriteProducts.length < 5
                    ? 'товара'
                    : 'товаров'}
                </span>
              </span>
            </h1>
          </div>

          {favoriteProducts.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleAddAllToCart}
                style={{
                  padding: '12px 20px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#000',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ShoppingBag size={15} /> Добавить все
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Очистить избранное?')) {
                    clearFavorites();
                  }
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: 100,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Trash2 size={15} /> Очистить
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--muted)',
            }}
          >
            Загрузка...
          </div>
        ) : favoriteProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '100px 20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
            }}
          >
            <Heart
              size={56}
              strokeWidth={1}
              style={{
                color: 'var(--muted)',
                marginBottom: 20,
              }}
            />
            <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
              Здесь пока пусто
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              Добавляйте товары кликом на ❤️, чтобы не потерять
            </p>
            <button
              onClick={goHome}
              style={{
                padding: '14px 28px',
                borderRadius: 100,
                border: 'none',
                background: 'var(--accent)',
                color: '#000',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              В каталог
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="products-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}
          >
            <AnimatePresence mode="popLayout">
              {favoriteProducts.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'relative',
                    borderRadius: 20,
                    overflow: 'hidden',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '3/4',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={optimizeImageUrl(p.image, 600)}
                      alt={p.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      aria-label="Убрать из избранного"
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(10,10,10,0.7)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Heart size={16} fill="var(--danger)" />
                    </button>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--muted)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      {p.category}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          flex: 1,
                        }}
                      >
                        {p.name}
                      </h3>
                      <span
                        className="price-num"
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatPrice(p.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (p.sizes.length > 0) {
                          window.history.pushState({}, '', '/');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                          setTimeout(() => {
                            const event = new CustomEvent('open-product', {
                              detail: p,
                            });
                            window.dispatchEvent(event);
                          }, 100);
                        } else {
                          addItem({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: p.image,
                          });
                          addToast('Добавлено в корзину', 'success');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: 12,
                        borderRadius: 100,
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <ShoppingBag size={14} />
                      {p.sizes.length > 0 ? 'Выбрать размер' : 'В корзину'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .products-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .products-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default FavoritesPage;