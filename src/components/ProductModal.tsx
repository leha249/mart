import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Share2,
  ZoomIn,
} from 'lucide-react';
import type { UIProduct } from '../types/database';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { formatPrice } from '../utils/format';
import { shareProduct } from '../utils/share';
import SizeChartModal from './SizeChartModal';
import ReviewsSection from './ReviewsSection';
import ReviewModal from './ReviewModal';
import Lightbox from './Lightbox';

interface Props {
  product: UIProduct | null;
  onClose: () => void;
}

const ProductModal = ({ product, onClose }: Props) => {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToast } = useToast();
  const { add: addToRecentlyViewed } = useRecentlyViewed();
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousProductIdRef = useRef<number | null>(null);

  useBodyLock(!!product && !sizeChartOpen && !reviewOpen && !lightboxOpen);
  useFocusTrap(
    !!product && !sizeChartOpen && !reviewOpen && !lightboxOpen,
    modalRef
  );

  // Сбрасываем состояние ТОЛЬКО при смене ID товара
  useEffect(() => {
    if (!product) {
      previousProductIdRef.current = null;
      return;
    }

    // Если ID изменился — сбрасываем всё
    if (previousProductIdRef.current !== product.id) {
      previousProductIdRef.current = product.id;
      setAdded(false);
      setSelectedSize(null);
      setActiveImage(0);
      setSizeChartOpen(false);
      setReviewOpen(false);
      setLightboxOpen(false);
      addToRecentlyViewed(product.id);
    }
  }, [product, addToRecentlyViewed]);

  useEffect(() => {
    if (!product) return;

    const onKey = (e: KeyboardEvent) => {
      if (sizeChartOpen || reviewOpen || lightboxOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && product.images.length > 1) {
        setActiveImage(
          (i) => (i - 1 + product.images.length) % product.images.length
        );
      }
      if (e.key === 'ArrowRight' && product.images.length > 1) {
        setActiveImage((i) => (i + 1) % product.images.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose, sizeChartOpen, reviewOpen, lightboxOpen]);

  const handleAdd = () => {
    if (!product || added) return;
    if (product.sizes.length > 0 && !selectedSize) {
      addToast('Выберите размер', 'error');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize ?? undefined,
    });
    setAdded(true);
    addToast(`${product.name} добавлен в корзину`, 'success');
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 900);
  };

  const handleShare = async () => {
    if (!product || sharing) return;
    setSharing(true);
    try {
      const result = await shareProduct(product);
      if (result.success && result.message) {
        addToast(result.message, 'success');
      } else if (result.method === 'failed') {
        addToast(result.message || 'Не удалось поделиться', 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  const needsSize = !!product && product.sizes.length > 0 && !selectedSize;
  const hasMultipleImages = !!product && product.images.length > 1;

  return (
    <>
      <AnimatePresence mode="wait">
        {product && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 250,
              overflowY: 'auto',
              padding: '40px 20px',
            }}
          >
            <motion.div
              key={`modal-${product.id}`}
              ref={modalRef}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={product.name}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 1000,
                margin: '0 auto',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
              }}
              className="product-modal"
            >
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  gap: 8,
                  zIndex: 4,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  disabled={sharing}
                  aria-label="Поделиться"
                  title="Поделиться"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'rgba(10,10,10,0.7)',
                    backdropFilter: 'blur(10px)',
                    color: 'var(--text)',
                    cursor: sharing ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Share2 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Закрыть"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'rgba(10,10,10,0.7)',
                    backdropFilter: 'blur(10px)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div
                className="product-modal-image"
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                }}
              >
                <div
                  onClick={() => setLightboxOpen(true)}
                  style={{
                    position: 'relative',
                    flex: 1,
                    overflow: 'hidden',
                    aspectRatio: '3/4',
                    cursor: 'zoom-in',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      src={product.images[activeImage]}
                      alt={product.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        position: 'absolute',
                        inset: 0,
                      }}
                    />
                  </AnimatePresence>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      padding: '6px 12px',
                      background: 'rgba(10,10,10,0.7)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 100,
                      color: '#fff',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      pointerEvents: 'none',
                      zIndex: 3,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                    className="zoom-hint"
                  >
                    <ZoomIn size={12} /> Увеличить
                  </div>

                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage(
                            (activeImage - 1 + product.images.length) %
                              product.images.length
                          );
                        }}
                        aria-label="Предыдущее фото"
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(10,10,10,0.6)',
                          backdropFilter: 'blur(10px)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage(
                            (activeImage + 1) % product.images.length
                          );
                        }}
                        aria-label="Следующее фото"
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(10,10,10,0.6)',
                          backdropFilter: 'blur(10px)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>

                      <div
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: 6,
                          padding: '6px 10px',
                          background: 'rgba(10,10,10,0.6)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 100,
                          zIndex: 2,
                        }}
                      >
                        {product.images.map((_, i) => (
                          <button
                            key={`dot-${i}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImage(i);
                            }}
                            aria-label={`Фото ${i + 1}`}
                            style={{
                              width: i === activeImage ? 18 : 6,
                              height: 6,
                              borderRadius: 100,
                              border: 'none',
                              background:
                                i === activeImage
                                  ? 'var(--accent)'
                                  : 'rgba(255,255,255,0.4)',
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'all 0.25s',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}

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
                            : 'var(--accent)',
                        color: product.tag === 'HOT' ? '#fff' : '#000',
                        padding: '6px 12px',
                        borderRadius: 100,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        zIndex: 2,
                      }}
                    >
                      {product.tag}
                    </div>
                  )}
                </div>

                {hasMultipleImages && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      padding: 12,
                      background: 'var(--bg-soft)',
                      borderTop: '1px solid var(--border)',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {product.images.map((img, i) => (
                      <button
                        key={`thumb-${i}`}
                        onClick={() => setActiveImage(i)}
                        aria-label={`Фото ${i + 1}`}
                        style={{
                          width: 56,
                          height: 70,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor:
                            i === activeImage
                              ? 'var(--accent)'
                              : 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          background: 'var(--surface)',
                          flexShrink: 0,
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <img
                          src={img}
                          alt={`Миниатюра ${i + 1}`}
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

              <div
                style={{
                  padding: 40,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                className="product-modal-content"
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingRight: 100,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {product.category}
                  </span>
                  {product.rating > 0 && (
                    <span
                      className="price-num"
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Star
                        size={12}
                        fill="var(--accent)"
                        stroke="var(--accent)"
                      />
                      {product.rating} · {product.reviews} отзывов
                    </span>
                  )}
                </div>

                <h2
                  className="serif"
                  style={{
                    fontSize: 'clamp(24px, 3vw, 36px)',
                    fontWeight: 900,
                    letterSpacing: '-1px',
                    marginBottom: 16,
                    lineHeight: 1.1,
                  }}
                >
                  {product.name}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <span
                    className="price-num"
                    style={{
                      fontSize: 'clamp(22px, 2.5vw, 28px)',
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span
                      className="price-num"
                      style={{
                        fontSize: 16,
                        color: 'var(--muted)',
                        textDecoration: 'line-through',
                      }}
                    >
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: 14,
                      lineHeight: 1.7,
                      marginBottom: 24,
                    }}
                  >
                    {product.description}
                  </p>
                )}

                {product.sizes.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        marginBottom: 10,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Размер</span>
                      <button
                        onClick={() => setSizeChartOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          textTransform: 'none',
                          letterSpacing: 0,
                          padding: 0,
                        }}
                      >
                        <Ruler size={11} /> Таблица размеров
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor:
                              selectedSize === size
                                ? 'var(--accent)'
                                : 'var(--border)',
                            background:
                              selectedSize === size
                                ? 'var(--accent)'
                                : 'transparent',
                            color:
                              selectedSize === size ? '#000' : 'var(--text)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {[
                    { icon: Truck, text: 'Бесплатная доставка от 5 000 ₽' },
                    { icon: RotateCcw, text: 'Возврат в течение 30 дней' },
                    { icon: ShieldCheck, text: 'Гарантия качества' },
                  ].map((item, i) => (
                    <div
                      key={`feature-${i}`}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        fontSize: 13,
                      }}
                    >
                      <item.icon
                        size={16}
                        color="var(--accent)"
                        style={{ flexShrink: 0 }}
                      />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <motion.button
                    whileHover={{ scale: added ? 1 : 1.02 }}
                    whileTap={{ scale: added ? 1 : 0.98 }}
                    onClick={handleAdd}
                    disabled={added || !product.inStock}
                    style={{
                      flex: 1,
                      padding: '18px',
                      background: !product.inStock
                        ? 'var(--muted)'
                        : added
                        ? 'var(--success)'
                        : needsSize
                        ? 'var(--surface-hi)'
                        : 'var(--accent)',
                      color: needsSize ? 'var(--muted)' : '#000',
                      border: needsSize ? '1px solid var(--border)' : 'none',
                      borderRadius: 100,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor:
                        added || !product.inStock ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      transition: 'all 0.25s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {!product.inStock ? (
                      'Нет в наличии'
                    ) : added ? (
                      <>
                        <Check size={18} /> Добавлено
                      </>
                    ) : needsSize ? (
                      'Выберите размер'
                    ) : (
                      'Добавить в корзину'
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleFavorite(product.id)}
                    aria-label="В избранное"
                    style={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: isFavorite(product.id)
                        ? 'var(--danger)'
                        : 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart
                      size={20}
                      fill={isFavorite(product.id) ? 'var(--danger)' : 'none'}
                    />
                  </motion.button>
                </div>

                <ReviewsSection
                  productId={product.id}
                  onWriteReview={() => setReviewOpen(true)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {product && (
        <>
          <SizeChartModal
            open={sizeChartOpen}
            category={product.category}
            onClose={() => setSizeChartOpen(false)}
          />
          <ReviewModal
            open={reviewOpen}
            productId={product.id}
            onClose={() => setReviewOpen(false)}
          />
          <Lightbox
            images={product.images}
            initialIndex={activeImage}
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      )}

      <style>{`
        @media (max-width: 800px) {
          .product-modal { grid-template-columns: 1fr !important; }
          .product-modal-image { min-height: 0 !important; }
          .product-modal-content { padding: 28px 24px !important; }
        }
        @media (max-width: 480px) {
          .product-modal-content { padding: 24px 20px !important; }
        }
        div[style*="cursor: zoom-in"]:hover .zoom-hint { opacity: 1 !important; }
      `}</style>
    </>
  );
};

export default ProductModal;