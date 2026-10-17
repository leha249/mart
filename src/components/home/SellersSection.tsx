import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Store, ArrowRight, Package, ArrowUpRight } from 'lucide-react';
import { sellersService } from '../../services/sellers';
import { productsService } from '../../services/products';
import type { UISeller } from '../../types/database';

interface SellerWithCount extends UISeller {
  productsCount: number;
}

interface Props {
  limit?: number;
  onGoToSellers?: () => void;
  onGoToSeller?: (slug: string) => void;
}

const SellersSection = ({
  limit = 6,
  onGoToSellers,
  onGoToSeller,
}: Props) => {
  const [sellers, setSellers] = useState<SellerWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const activeSellers = await sellersService.getActive();

        const withCounts = await Promise.all(
          activeSellers.map(async (s) => {
            try {
              const products = await productsService.getAll(s.id);
              return { ...s, productsCount: products.length };
            } catch {
              return { ...s, productsCount: 0 };
            }
          })
        );

        if (mounted) setSellers(withCounts);
      } catch (e) {
        console.error('[SellersSection] load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const displayed = sellers.slice(0, limit);
  const hasMore = sellers.length > limit;

  const handleGoToSeller = (slug: string) => {
    if (onGoToSeller) {
      onGoToSeller(slug);
    } else {
      window.history.pushState({}, '', `/seller/${slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleGoToSellers = () => {
    if (onGoToSellers) {
      onGoToSellers();
    } else {
      window.history.pushState({}, '', '/sellers');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Пусто — ничего не рендерим (или показываем заглушку)
  if (!loading && sellers.length === 0) {
    return (
      <section
        id="sellers"
        style={{ padding: '120px 0', scrollMarginTop: 80 }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Store
              size={56}
              strokeWidth={1}
              style={{ color: 'var(--muted)', marginBottom: 20 }}
            />
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                letterSpacing: '-1px',
                marginBottom: 12,
              }}
            >
              Магазины скоро появятся
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              Загляните сюда позже — продавцы уже готовят первые коллекции
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="sellers"
      style={{
        padding: '120px 0',
        scrollMarginTop: 80,
        background: 'var(--bg-soft)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container">
        {/* Заголовок */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 48,
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
              • Магазины
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
              Выбирайте{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                по духу
              </span>
            </h2>
          </motion.div>

          {hasMore && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={handleGoToSellers}
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
              Все магазины
              <ArrowUpRight size={16} />
            </motion.button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ aspectRatio: '4/5', borderRadius: 20 }}
              />
            ))}
          </div>
        )}

        {/* Сетка магазинов */}
        {!loading && displayed.length > 0 && (
          <div
            className="home-sellers-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {displayed.map((seller, i) => (
              <motion.div
                key={seller.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  delay: Math.min(i * 0.05, 0.5),
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => handleGoToSeller(seller.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleGoToSeller(seller.slug);
                  }
                }}
                style={{
                  position: 'relative',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition:
                    'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s',
                }}
                className="home-seller-card"
              >
                {/* Обложка */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    overflow: 'hidden',
                    background: 'var(--surface-hi)',
                  }}
                >
                  {seller.cover ? (
                    <img
                      src={seller.cover}
                      alt={seller.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : seller.heroImage ? (
                    <img
                      src={seller.heroImage}
                      alt={seller.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${seller.accentColor || '#e8ff5a'}22, transparent)`,
                        color: 'var(--muted)',
                      }}
                    >
                      <Store size={40} strokeWidth={1} />
                    </div>
                  )}
                </div>

                {/* Лого на границе */}
                <div
                  style={{
                    position: 'relative',
                    padding: '0 20px',
                    marginTop: -32,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: 'var(--bg)',
                      border: '2px solid var(--surface)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                  >
                    {seller.logo ? (
                      <img
                        src={seller.logo}
                        alt={seller.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background:
                            seller.accentColor || 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: 24,
                          fontWeight: 900,
                        }}
                      >
                        {seller.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Контент */}
                <div style={{ padding: '16px 20px 20px' }}>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '-0.3px',
                      marginBottom: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {seller.name}
                  </h3>

                  {seller.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        lineHeight: 1.5,
                        marginBottom: 14,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {seller.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}
                    >
                      <Package size={13} />
                      {seller.productsCount === 0
                        ? 'Скоро коллекция'
                        : `${seller.productsCount} ${
                            seller.productsCount === 1
                              ? 'товар'
                              : seller.productsCount < 5
                              ? 'товара'
                              : 'товаров'
                          }`}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        color: seller.accentColor || 'var(--accent)',
                      }}
                    >
                      В магазин
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .home-seller-card:hover {
          transform: translateY(-6px);
          border-color: var(--border-hi);
        }
        @media (max-width: 600px) {
          .home-sellers-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default SellersSection;