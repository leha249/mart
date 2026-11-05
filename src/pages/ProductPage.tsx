import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Check,
  Star,
  Share2,
  Ruler,
  ZoomIn,
  Store,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Package,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import Lightbox from '../components/Lightbox';
import SizeChartModal from '../components/SizeChartModal';
import ReviewsSection from '../components/ReviewsSection';
import ReviewModal from '../components/ReviewModal';
import Skeleton from '../components/Skeleton';
import { useProducts } from '../context/ProductsContext';
import { useSellers } from '../context/SellersContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { usePageMeta, useJsonLd } from '../hooks/usePageMeta';
import { navigate } from '../utils/navigate';
import { formatPrice } from '../utils/format';
import { shareProduct } from '../utils/share';
import type { UIProduct } from '../types/database';

interface Props {
  slug: string;
}

const ProductPage = ({ slug }: Props) => {
  const { products, loading } = useProducts();
  const { sellers } = useSellers();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { add: addToRecentlyViewed } = useRecentlyViewed();
  const { addToast } = useToast();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [added, setAdded] = useState(false);

  /** Ищем товар по слагу; запасной вариант — по числовому id в начале слага. */
  const product: UIProduct | null = useMemo(() => {
    if (!slug) return null;
    const exact = products.find((p) => p.slug === slug);
    if (exact) return exact;

    const idMatch = slug.match(/^(\d+)/);
    if (idMatch) {
      const byId = products.find((p) => p.id === Number(idMatch[1]));
      if (byId) return byId;
    }
    return null;
  }, [products, slug]);

  // Запоминаем просмотренный товар для блока «Вы смотрели»
  useEffect(() => {
    if (product) addToRecentlyViewed(product.id);
  }, [product, addToRecentlyViewed]);

  const seller = useMemo(
    () => sellers.find((s) => s.id === product?.sellerId) ?? null,
    [sellers, product]
  );

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) =>
          p.id !== product.id &&
          p.inStock &&
          (p.category === product.category ||
            (product.subcategory && p.subcategory === product.subcategory))
      )
      .slice(0, 4);
  }, [products, product]);

  const favorite = product ? isFavorite(product.id) : false;

  usePageMeta({
    title: product
      ? `${product.name} — купить за ${formatPrice(product.price)}`
      : 'Товар не найден',
    description:
      product?.description?.slice(0, 160) ||
      (product
        ? `${product.name} в MØRA MART. ${product.category}${
            product.subcategory ? ` · ${product.subcategory}` : ''
          }. Доставка по России.`
        : 'Товар не найден на MØRA MART.'),
    image: product?.image,
    type: 'product',
    noindex: !product,
  });

  useJsonLd(
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images.filter(Boolean),
          category: product.subcategory
            ? `${product.category} / ${product.subcategory}`
            : product.category,
          brand: { '@type': 'Brand', name: 'MØRA MART' },
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'RUB',
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: `${window.location.origin}/product/${product.slug}`,
            seller: { '@type': 'Organization', name: seller?.name ?? 'MØRA MART' },
          },
          ...(product.reviews > 0
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: product.rating,
                  reviewCount: product.reviews,
                },
              }
            : {}),
        }
      : null
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <main className="container" style={{ paddingTop: 140 }}>
          <Skeleton height={420} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <main
          className="container"
          style={{
            paddingTop: 160,
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 72, marginBottom: 12 }}>Ø</div>
          <h1 className="serif" style={{ fontSize: 32, marginBottom: 12 }}>
            Товар не найден
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 28 }}>
            Возможно, его сняли с продажи или ссылка устарела.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              padding: '14px 28px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Перейти в каталог
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images.length ? product.images : [product.image];
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0;

  const handleAdd = () => {
    if (!product.inStock) {
      addToast('Товара нет в наличии', 'error');
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      addToast('Выберите размер', 'error');
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller_id: product.sellerId,
      ...(selectedSize ? { size: selectedSize } : {}),
    });
    setAdded(true);
    addToast('Добавлено в корзину', 'success');
    setTimeout(() => setAdded(false), 1600);
  };

  const handleShare = async () => {
    const res = await shareProduct(product);
    if (res.method === 'clipboard') addToast('Ссылка скопирована', 'success');
    else if (res.method === 'failed') addToast('Не удалось поделиться', 'error');
  };

  const crumbs = [
    { label: 'Главная', path: '/' },
    { label: 'Каталог', path: '/catalog' },
    ...(product.category
      ? [{ label: product.category, path: `/catalog?category=${encodeURIComponent(product.category)}` }]
      : []),
  ];

  return (
    <div id="top" style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 96 }}>
        {/* Хлебные крошки */}
        <nav
          className="container"
          aria-label="Хлебные крошки"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            fontSize: 12,
            color: 'var(--muted)',
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          {crumbs.map((c) => (
            <span key={c.path} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => navigate(c.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                }}
              >
                {c.label}
              </button>
              <ChevronRight size={12} />
            </span>
          ))}
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>
            {product.name}
          </span>
        </nav>

        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
            gap: 56,
            paddingTop: 16,
            paddingBottom: 72,
            alignItems: 'start',
          }}
          id="product-grid"
        >
          {/* Галерея */}
          <div>
            <div
              style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                background: 'var(--surface)',
                aspectRatio: '4 / 5',
              }}
            >
              <img
                src={images[activeImage]}
                alt={`${product.name} — фото ${activeImage + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {product.tag && (
                <span
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background:
                      product.tag === 'SALE'
                        ? 'var(--danger)'
                        : 'var(--accent)',
                    color:
                      product.tag === 'SALE' ? '#fff' : 'var(--accent-contrast)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  {product.tag}
                </span>
              )}
              <button
                onClick={() => setLightboxOpen(true)}
                aria-label="Открыть фото"
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid var(--border-hi)',
                  background: 'rgba(10,10,10,0.6)',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {images.length > 1 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Фото ${i + 1}`}
                    style={{
                      padding: 0,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border:
                        i === activeImage
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border)',
                      background: 'transparent',
                      cursor: 'pointer',
                      aspectRatio: '1',
                    }}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация */}
          <div>
            {product.subcategory && (
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 10,
                }}
              >
                {product.category} · {product.subcategory}
              </div>
            )}

            <h1
              className="serif"
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              {product.name}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 22,
                flexWrap: 'wrap',
              }}
            >
              {product.reviews > 0 && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    color: 'var(--muted)',
                  }}
                >
                  <Star size={14} fill="var(--accent)" stroke="var(--accent)" />
                  {product.rating.toFixed(1)}
                  <span style={{ opacity: 0.7 }}>
                    ({product.reviews}{' '}
                    {product.reviews === 1 ? 'отзыв' : 'отзывов'})
                  </span>
                </span>
              )}
              {product.purchases > 0 && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    color: 'var(--muted)',
                  }}
                >
                  <Package size={14} /> Купили {product.purchases} раз
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 26,
              }}
            >
              <span
                className="price-num"
                style={{ fontSize: 34, fontWeight: 700 }}
              >
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <>
                  <span
                    style={{
                      fontSize: 17,
                      color: 'var(--muted)',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatPrice(product.oldPrice)}
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,77,77,0.15)',
                      color: 'var(--danger)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    −{discount}%
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  marginBottom: 26,
                  whiteSpace: 'pre-line',
                }}
              >
                {product.description}
              </p>
            )}

            {/* Размеры */}
            {product.sizes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Размер
                  </span>
                  <button
                    onClick={() => setSizeChartOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    <Ruler size={13} /> Таблица размеров
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        minWidth: 52,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border:
                          selectedSize === size
                            ? '1px solid var(--accent)'
                            : '1px solid var(--border)',
                        background:
                          selectedSize === size
                            ? 'rgba(232,255,90,0.12)'
                            : 'transparent',
                        color: 'var(--text)',
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 26 }}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleAdd}
                disabled={!product.inStock}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: product.inStock
                    ? 'var(--accent)'
                    : 'var(--surface-hi)',
                  color: product.inStock
                    ? 'var(--accent-contrast)'
                    : 'var(--muted)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: product.inStock ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {added ? (
                  <>
                    <Check size={16} /> В корзине
                  </>
                ) : product.inStock ? (
                  'Добавить в корзину'
                ) : (
                  'Нет в наличии'
                )}
              </motion.button>

              <button
                onClick={() => toggleFavorite(product.id)}
                aria-label="В избранное"
                style={{
                  width: 52,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: favorite ? 'rgba(232,255,90,0.1)' : 'transparent',
                  color: favorite ? 'var(--accent)' : 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={18} fill={favorite ? 'var(--accent)' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Поделиться"
                style={{
                  width: 52,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Продавец */}
            {seller && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {seller.logo ? (
                      <img
                        src={seller.logo}
                        alt={seller.name}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--surface-hi)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                        }}
                      >
                        <Store size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Продавец
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {seller.name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/seller/${seller.slug}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 14px',
                      borderRadius: 999,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text)',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    В магазин <ChevronRight size={13} />
                  </button>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                    fontSize: 11.5,
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                  }}
                >
                  Товар продаёт {seller.name}. MØRA MART — информационный
                  посредник и не является стороной сделки. Доставку, возврат и
                  гарантию обеспечивает продавец.
                </div>
              </div>
            )}

            {/* Преимущества */}
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { icon: Truck, text: 'Доставка по России — от 3 дней' },
                { icon: RotateCcw, text: 'Возврат в течение 14 дней' },
                { icon: ShieldCheck, text: 'Безопасная оплата при получении' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12.5,
                    color: 'var(--muted)',
                  }}
                >
                  <Icon size={15} style={{ color: 'var(--accent)' }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Отзывы */}
        <section className="container" style={{ paddingBottom: 72 }}>
          <h2
            className="serif"
            style={{ fontSize: 26, marginBottom: 20, marginTop: 0 }}
          >
            Отзывы
          </h2>
          <ReviewsSection
            productId={product.id}
            onWriteReview={() => setReviewOpen(true)}
          />
        </section>

        {/* Похожие */}
        {related.length > 0 && (
          <section className="container" style={{ paddingBottom: 96 }}>
            <h2
              className="serif"
              style={{ fontSize: 26, marginBottom: 20, marginTop: 0 }}
            >
              Похожие товары
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {related.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug}`)}
                  style={{
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '4 / 5',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--surface)',
                      marginBottom: 8,
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {formatPrice(p.price)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="container" style={{ paddingBottom: 64 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Назад
          </button>
        </div>
      </main>

      <Footer />

      <Lightbox
        images={images}
        initialIndex={activeImage}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
      <SizeChartModal
        category={product.category}
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
      />
      <ReviewModal
        productId={product.id}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
};

export default ProductPage;
