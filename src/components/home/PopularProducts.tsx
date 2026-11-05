import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Plus, Heart, Star } from 'lucide-react';
import { productsService } from '../../services/products';
import { sellersService } from '../../services/sellers';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useToast } from '../../context/ToastContext';
import { useCategories } from '../../context/CategoriesContext';
import { formatPrice } from '../../utils/format';
import { optimizeImageUrl } from '../../utils/imageLoader';
import type { UIProduct } from '../../types/database';
import { mapProductToUI } from '../../types/database';
import { navigate } from '../../utils/navigate';

interface SellerInfo {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  accentColor?: string;
}

interface ProductWithSeller extends UIProduct {
  seller?: SellerInfo;
}

interface Props {
  limit?: number;
  onProductClick?: (p: UIProduct) => void;
  onGoToCatalog?: () => void;
}

const OTHER_CATEGORY = '__other__';

const normalizeCategory = (s: string) => s.trim().toLowerCase();

const PopularProducts = ({
  limit = 8,
  onProductClick,
  onGoToCatalog,
}: Props) => {
  const [allProducts, setAllProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToast } = useToast();
  const { categories } = useCategories();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Грузим с запасом — чтобы фильтр по категории не оставлял пустую сетку
        const topProducts = await productsService.getPopular(limit * 2);
        const uiProducts = topProducts.map(mapProductToUI);

        const sellerIds = Array.from(
          new Set(
            uiProducts
              .map((p) => p.sellerId)
              .filter((id): id is number => id !== null)
          )
        );

        const sellersMap = new Map<number, SellerInfo>();
        if (sellerIds.length > 0) {
          const allSellers = await sellersService.getActive();
          allSellers.forEach((s) => {
            if (sellerIds.includes(s.id)) {
              sellersMap.set(s.id, {
                id: s.id,
                name: s.name,
                slug: s.slug,
                logo: s.logo,
                accentColor: s.accentColor,
              });
            }
          });
        }

        const withSellers: ProductWithSeller[] = uiProducts
          .filter((p) => p.sellerId !== null && sellersMap.has(p.sellerId))
          .map((p) => ({
            ...p,
            seller: p.sellerId ? sellersMap.get(p.sellerId) : undefined,
          }));

        if (mounted) setAllProducts(withSellers);
      } catch (e) {
        console.error('[PopularProducts] load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [limit]);

  // Множество нормализованных имён категорий из БД — для «Другое»
  const knownCategoryKeys = useMemo(() => {
    return new Set(categories.map((c) => normalizeCategory(c.name)));
  }, [categories]);

  // Табы: Все + все категории из БД + Другое
  const tabs = useMemo(() => {
    const list: { key: string | null; label: string }[] = [
      { key: null, label: 'Все' },
    ];
    categories.forEach((c) => {
      list.push({ key: normalizeCategory(c.name), label: c.name });
    });
    list.push({ key: OTHER_CATEGORY, label: 'Другое' });
    return list;
  }, [categories]);

  // Фильтрация + обрезка до limit
  const visibleProducts = useMemo(() => {
    let filtered = allProducts;

    if (activeCategory !== null) {
      if (activeCategory === OTHER_CATEGORY) {
        filtered = allProducts.filter(
          (p) => !knownCategoryKeys.has(normalizeCategory(p.category))
        );
      } else {
        filtered = allProducts.filter(
          (p) => normalizeCategory(p.category) === activeCategory
        );
      }
    }

    return filtered.slice(0, limit);
  }, [allProducts, activeCategory, knownCategoryKeys, limit]);

  const handleGoToSeller = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/seller/${slug}`);
  };

  const handleGoToCatalog = () => {
    if (onGoToCatalog) {
      onGoToCatalog();
    } else {
      navigate('/catalog');
    }
  };

  const handleAdd = (p: ProductWithSeller, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.sizes.length > 0) {
      onProductClick?.(p);
      return;
    }
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      seller_id: p.sellerId,
    });
    addToast(`${p.name} добавлен в корзину`, 'success');
  };

  const handleFav = (p: ProductWithSeller, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(p.id);
    addToast(
      isFavorite(p.id) ? 'Удалено из избранного' : 'Добавлено в избранное',
      isFavorite(p.id) ? 'info' : 'success'
    );
  };

  if (!loading && allProducts.length === 0) {
    return null;
  }

  return (
    <section
      id="popular"
      style={{
        padding: '120px 0',
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • Популярное
            </div>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
              }}
            >
              Что{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                покупают
              </span>
            </h2>
          </motion.div>

          {!loading && allProducts.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={handleGoToCatalog}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 28px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              Все товары
              <ArrowUpRight size={16} />
            </motion.button>
          )}
        </div>

        {/* Табы категорий */}
        {!loading && allProducts.length > 0 && (
          <div
            className="popular-tabs"
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 40,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: 4,
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key ?? '__all__'}
                  onClick={() => setActiveCategory(tab.key)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 100,
                    border: '1px solid',
                    borderColor: isActive
                      ? 'var(--accent)'
                      : 'var(--border)',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#000' : 'var(--text)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
            }}
            className="popular-grid-skeleton"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ aspectRatio: '3/4', borderRadius: 20 }}
              />
            ))}
          </div>
        )}

        {!loading && visibleProducts.length === 0 && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 14,
              border: '1px dashed var(--border)',
              borderRadius: 20,
            }}
          >
            В этой категории пока нет популярных товаров
          </div>
        )}

        {!loading && visibleProducts.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeCategory ?? '__all__'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="popular-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
              }}
            >
              {visibleProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    delay: Math.min(i * 0.05, 0.5),
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => onProductClick?.(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onProductClick?.(p);
                    }
                  }}
                  style={{
                    position: 'relative',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  className="popular-card"
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '3/4',
                      overflow: 'hidden',
                      background: 'var(--surface-hi)',
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
                        transition: 'transform 0.6s',
                      }}
                      className="popular-card-img"
                    />

                    {p.tag && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background:
                            p.tag === 'HOT'
                              ? 'var(--danger)'
                              : p.tag === 'SALE'
                              ? '#ff8c42'
                              : 'var(--accent)',
                          color: p.tag === 'HOT' ? '#fff' : '#000',
                          padding: '4px 10px',
                          borderRadius: 100,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '1px',
                          zIndex: 2,
                        }}
                      >
                        {p.tag}
                      </div>
                    )}

                    {p.seller && (
                      <button
                        onClick={(e) => handleGoToSeller(p.seller!.slug, e)}
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: 'rgba(10,10,10,0.75)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 100,
                          padding: '4px 10px 4px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          zIndex: 2,
                          transition: 'background 0.2s',
                        }}
                        title={`Перейти в ${p.seller.name}`}
                        aria-label={`Магазин: ${p.seller.name}`}
                      >
                        {p.seller.logo ? (
                          <img
                            src={p.seller.logo}
                            alt={p.seller.name}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background:
                                p.seller.accentColor || 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                              fontSize: 10,
                              fontWeight: 900,
                            }}
                          >
                            {p.seller.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#fff',
                            maxWidth: 90,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.seller.name}
                        </span>
                      </button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleFav(p, e)}
                      aria-label={
                        isFavorite(p.id)
                          ? 'Убрать из избранного'
                          : 'Добавить в избранное'
                      }
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(10,10,10,0.7)',
                        backdropFilter: 'blur(10px)',
                        color: isFavorite(p.id)
                          ? 'var(--danger)'
                          : 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                    >
                      <Heart
                        size={16}
                        fill={isFavorite(p.id) ? 'var(--danger)' : 'none'}
                      />
                    </motion.button>

                    <button
                      onClick={(e) => handleAdd(p, e)}
                      disabled={!p.inStock}
                      aria-label={`Добавить ${p.name} в корзину`}
                      className="popular-add-btn"
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        right: 60,
                        padding: '10px 14px',
                        borderRadius: 100,
                        border: 'none',
                        background: !p.inStock
                          ? 'var(--muted)'
                          : 'var(--accent)',
                        color: '#000',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: p.inStock ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontFamily: 'inherit',
                        zIndex: 2,
                        opacity: 0,
                        transform: 'translateY(8px)',
                        transition: 'opacity 0.25s, transform 0.25s',
                      }}
                    >
                      <Plus size={14} />
                      {!p.inStock
                        ? 'Нет в наличии'
                        : p.sizes.length > 0
                        ? 'Выбрать размер'
                        : 'В корзину'}
                    </button>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
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
                          fontSize: 10,
                          color: 'var(--muted)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.category}
                      </span>
                      {p.rating > 0 && (
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
                          <Star
                            size={11}
                            fill="var(--accent)"
                            stroke="var(--accent)"
                          />
                          {p.rating}
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {p.name}
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
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        {formatPrice(p.price)}
                      </span>
                      {p.oldPrice && (
                        <span
                          className="price-num"
                          style={{
                            fontSize: 12,
                            color: 'var(--muted)',
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatPrice(p.oldPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style>{`
        .popular-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-hi);
        }
        .popular-card:hover .popular-card-img {
          transform: scale(1.06);
        }
        .popular-card:hover .popular-add-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .popular-tabs::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 1100px) {
          .popular-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 800px) {
          .popular-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .popular-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default PopularProducts;