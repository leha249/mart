import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Store, ArrowRight, Package } from 'lucide-react';
import { sellersService } from '../services/sellers';
import { productsService } from '../services/products';
import { useDebounce } from '../hooks/useDebounce';
import type { UISeller } from '../types/database';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';

interface SellerWithCount extends UISeller {
  productsCount: number;
}

const SellersPage = () => {
  const [sellers, setSellers] = useState<SellerWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const searchDebounced = useDebounce(searchInput, 250);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goToSeller = (slug: string) => {
    window.history.pushState({}, '', `/seller/${slug}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    document.title = 'Магазины — MØRA MART';

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

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
        if (mounted) {
          setError(
            e instanceof Error ? e.message : 'Не удалось загрузить магазины'
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      document.title = 'MØRA MART';
    };
  }, []);

  const filtered = useMemo(() => {
    if (!searchDebounced.trim()) return sellers;
    const q = searchDebounced.toLowerCase();
    return sellers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [sellers, searchDebounced]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 60, textAlign: 'center' }}
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
              • Магазины платформы
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(40px, 6vw, 80px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
                marginBottom: 24,
              }}
            >
              Откройте для себя{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                новые магазины
              </span>
            </h1>
            <p
              style={{
                fontSize: 16,
                color: 'var(--muted)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              Каждый продавец — со своим стилем, характером и коллекцией.
              Выбирайте то, что откликается.
            </p>
          </motion.div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 480,
              }}
            >
              <Search
                size={16}
                color="var(--muted)"
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Поиск по названию магазина..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 40px 14px 42px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 100,
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  aria-label="Очистить"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
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
              )}
            </div>
          </div>

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

          {!loading && error && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: 'var(--danger)',
                fontSize: 14,
              }}
            >
              Ошибка загрузки: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
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
              <Store
                size={56}
                strokeWidth={1}
                style={{ color: 'var(--muted)', marginBottom: 20 }}
              />
              <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
                {searchInput.trim() ? 'Магазины не найдены' : 'Пока нет магазинов'}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                {searchInput.trim()
                  ? 'Попробуйте изменить запрос'
                  : 'Загляните сюда позже — магазины появятся совсем скоро'}
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
                На главную
              </button>
            </motion.div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div
              className="sellers-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {filtered.map((seller, i) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.05, 0.5),
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => goToSeller(seller.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goToSeller(seller.slug);
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
                  className="seller-card"
                >
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
                        {seller.productsCount}{' '}
                        {seller.productsCount === 1
                          ? 'товар'
                          : seller.productsCount < 5
                          ? 'товара'
                          : 'товаров'}
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
      </main>

      <Footer />
      <ToastContainer />

      <style>{`
        .seller-card:hover {
          transform: translateY(-6px);
          border-color: var(--border-hi);
        }
      `}</style>
    </div>
  );
};

export default SellersPage;