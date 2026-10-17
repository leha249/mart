import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Star, Package } from 'lucide-react';
import type { UIProduct } from '../../types/database';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import { optimizeImageUrl } from '../../utils/imageLoader';

interface CardProps {
  product: UIProduct;
  index: number;
  accent: string;
  onOpen: (p: UIProduct) => void;
}

const ProductCard = memo(({ product, index, accent, onOpen }: CardProps) => {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToast } = useToast();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const fav = isFavorite(product.id);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const optimizedImage = useMemo(
    () => optimizeImageUrl(product.image, 600),
    [product.image]
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sizes.length > 0) {
      onOpen(product);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller_id: product.sellerId,
    });
    setAdded(true);
    addToast(`${product.name} добавлен в корзину`, 'success');
    setTimeout(() => setAdded(false), 1200);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
    addToast(
      fav ? 'Удалено из избранного' : 'Добавлено в избранное',
      fav ? 'info' : 'success'
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        delay: Math.min(index * 0.04, 0.4),
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(product);
        }
      }}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition:
          'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s',
        borderColor: hovered ? 'var(--border-hi)' : 'var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        willChange: hovered ? 'transform' : 'auto',
        contain: 'layout style paint',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '3/4',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--surface-hi)',
        }}
      >
        <motion.img
          src={optimizedImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={600}
          height={800}
          animate={{ scale: hovered ? 1.08 : 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            willChange: hovered ? 'transform' : 'auto',
          }}
        />

        {product.tag && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              background:
                product.tag === 'HOT'
                  ? 'var(--danger)'
                  : product.tag === 'SALE'
                  ? '#ff8c42'
                  : accent,
              color: product.tag === 'HOT' ? '#fff' : '#000',
              padding: '6px 12px',
              borderRadius: 100,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            {product.tag}
            {discount > 0 && ` −${discount}%`}
          </div>
        )}

        {!product.inStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Нет в наличии
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFav}
          aria-label={fav ? 'Убрать из избранного' : 'Добавить в избранное'}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(10,10,10,0.6)',
            backdropFilter: 'blur(10px)',
            color: fav ? 'var(--danger)' : 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Heart size={16} fill={fav ? 'var(--danger)' : 'none'} />
        </motion.button>

        <motion.button
          onClick={handleAdd}
          disabled={!product.inStock}
          whileTap={{ scale: 0.95 }}
          animate={{
            opacity: hovered || added ? 1 : 0,
            y: hovered || added ? 0 : 20,
          }}
          transition={{ duration: 0.3 }}
          aria-label={`Добавить ${product.name} в корзину`}
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: !product.inStock
              ? 'var(--muted)'
              : added
              ? 'var(--success)'
              : accent,
            color: '#000',
            fontWeight: 700,
            fontSize: 13,
            cursor: product.inStock ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'inherit',
            zIndex: 2,
          }}
        >
          {!product.inStock ? (
            'Нет в наличии'
          ) : added ? (
            <>✓ Добавлено</>
          ) : (
            <>
              <Plus size={16} /> В корзину
            </>
          )}
        </motion.button>
      </div>

      <div
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {product.category}
          </span>
          {product.rating > 0 && (
            <span
              className="price-num"
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Star size={11} fill={accent} stroke={accent} />
              {product.rating}
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.2px',
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 'auto',
          }}
        >
          <span
            className="price-num"
            style={{ fontSize: 17, fontWeight: 700, color: accent }}
          >
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span
              className="price-num"
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'SellerProductCard';

interface Props {
  products: UIProduct[];
  categories: string[];
  accent: string;
  onProductClick: (p: UIProduct) => void;
  loading?: boolean;
}

const SellerCatalog = ({
  products,
  categories,
  accent,
  onProductClick,
  loading = false,
}: Props) => {
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>(
    'default'
  );

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['Все', ...Array.from(set).sort()];
  }, [products]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { Все: products.length };
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list =
      activeCategory === 'Все'
        ? products
        : products.filter((p) => p.category === activeCategory);

    if (sortBy === 'price-asc')
      list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc')
      list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, activeCategory, sortBy]);

  if (loading) {
    return (
      <section id="catalog" style={{ padding: '120px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}
            className="seller-catalog-skeleton"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  aspectRatio: '3/4',
                  borderRadius: 20,
                }}
              />
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .seller-catalog-skeleton { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </section>
    );
  }

  return (
    <section
      id="catalog"
      style={{
        padding: '120px 0',
        position: 'relative',
        scrollMarginTop: 80,
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • Каталог
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="serif"
              style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
              }}
            >
              Все{' '}
              <span style={{ fontStyle: 'italic', color: accent }}>
                товары
              </span>
            </motion.h2>
          </div>

          {!loading && filtered.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'default', label: 'По умолчанию' },
                { key: 'price-asc', label: 'Цена ↑' },
                { key: 'price-desc', label: 'Цена ↓' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key as typeof sortBy)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 100,
                    border: '1px solid',
                    borderColor:
                      sortBy === opt.key ? accent : 'var(--border)',
                    background:
                      sortBy === opt.key ? accent : 'transparent',
                    color: sortBy === opt.key ? '#000' : 'var(--muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!loading && allCategories.length > 1 && (
          <div
            className="seller-catalog-filters"
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {allCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <motion.button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={isActive}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 100,
                    border: '1px solid',
                    borderColor: isActive ? accent : 'var(--border)',
                    background: isActive ? accent : 'transparent',
                    color: isActive ? '#000' : 'var(--text)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition:
                      'background 0.25s, border-color 0.25s, color 0.25s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{cat}</span>
                  <span
                    className="price-num"
                    style={{
                      fontSize: 11,
                      opacity: isActive ? 0.7 : 0.5,
                      fontWeight: 500,
                    }}
                  >
                    {counts[cat] || 0}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {products.length === 0 ? (
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
            <Package
              size={56}
              strokeWidth={1}
              style={{ color: 'var(--muted)', marginBottom: 20 }}
            />
            <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
              В магазине пока нет товаров
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Загляните сюда позже — продавец уже готовит первую коллекцию
            </p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--muted)',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              В категории «{activeCategory}» пока ничего нет
            </div>
            <div style={{ fontSize: 13 }}>
              Попробуйте выбрать другую категорию
            </div>
          </motion.div>
        ) : (
          <div
            className="seller-catalog-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              minHeight: 200,
            }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  accent={accent}
                  onOpen={onProductClick}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .seller-catalog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .seller-catalog-grid { grid-template-columns: 1fr !important; }
          .seller-catalog-filters {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 16px;
            margin-left: -20px;
            margin-right: -20px;
            padding-left: 20px;
            padding-right: 20px;
            scrollbar-width: none;
          }
          .seller-catalog-filters::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </section>
  );
};

export default SellerCatalog;