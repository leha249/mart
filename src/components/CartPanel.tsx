import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Check,
  Tag,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePromo } from '../context/PromoContext';
import { useToast } from '../context/ToastContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { formatPrice, pluralize } from '../utils/format';
import { ordersService } from '../services/orders';
import { incrementPromocodeUsage } from '../utils/promocodes';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CartPanel = ({ open, onClose }: Props) => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } =
    useCart();
  const promo = usePromo();
  const { addToast } = useToast();
  const [orderSent, setOrderSent] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyLock(open);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) {
      setShowCheckout(false);
      setOrderSent(false);
    }
  }, [open]);

  useEffect(() => {
    if (items.length === 0 && promo.applied) {
      promo.clearCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const promoDiscount = promo.applied ? promo.discount : 0;
  const finalTotal = Math.max(0, totalPrice - promoDiscount);

  const validateCheckout = (): string | null => {
    if (!name.trim()) return 'Введите имя';
    if (!phone.trim()) return 'Введите телефон';
    if (phone.trim().length < 5) return 'Телефон слишком короткий';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Некорректный email';
    }
    return null;
  };

  const handleCheckout = async () => {
    if (submitting || orderSent) return;

    const err = validateCheckout();
    if (err) {
      addToast(err, 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Группируем товары по seller_id
      const grouped = new Map<number | null, typeof items>();
      items.forEach((item) => {
        const key = item.seller_id ?? null;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(item);
      });

      // 2. Для каждой группы — создаём отдельный заказ
      const createdOrders: {
        id: number;
        sellerId: number | null;
        total: number;
        itemsCount: number;
      }[] = [];

      let totalDiscountRemaining = promoDiscount;

      for (const [sellerId, groupItems] of grouped.entries()) {
        const groupTotal = groupItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );

        // Распределяем скидку пропорционально сумме группы
        const groupShare =
          totalPrice > 0 ? groupTotal / totalPrice : 0;
        const groupDiscount = Math.round(totalDiscountRemaining * groupShare);
        totalDiscountRemaining -= groupDiscount;

        const groupFinalTotal = Math.max(0, groupTotal - groupDiscount);

        const order = await ordersService.create({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || undefined,
          items: groupItems.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            image: i.image,
            quantity: i.quantity,
            size: i.size,
          })),
          total: groupFinalTotal,
          promo_code: promo.applied?.code,
          promo_discount: groupDiscount,
          seller_id: sellerId,
        });

        createdOrders.push({
          id: order.id,
          sellerId,
          total: groupFinalTotal,
          itemsCount: groupItems.reduce((s, i) => s + i.quantity, 0),
        });
      }

      // 3. Увеличиваем использование промокода (один раз, на общую сумму)
      if (promo.applied) {
        incrementPromocodeUsage(promo.applied.id);
      }

      // 4. Сохраняем телефоны/номера заказов для страницы "Спасибо"
      try {
        const orderInfo = createdOrders.map((o) => ({
          id: o.id,
          total: o.total,
          itemsCount: o.itemsCount,
        }));
        sessionStorage.setItem(
          'mora-last-orders',
          JSON.stringify({
            phone: phone.trim(),
            name: name.trim(),
            orders: orderInfo,
            createdAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn('Не удалось сохранить данные заказа:', e);
      }

      setOrderSent(true);
      addToast(
        createdOrders.length === 1
          ? 'Заказ оформлен!'
          : `Создано ${createdOrders.length} заказов`,
        'success'
      );

      setTimeout(() => {
        clearCart();
        promo.clearCode();
        setName('');
        setPhone('');
        setEmail('');
        setOrderSent(false);
        setShowCheckout(false);
        onClose();

        // 5. Редирект на страницу "Спасибо"
        window.history.pushState({}, '', '/order-success');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка оформления';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promo.code.trim()) return;
    const ok = await promo.applyCode(totalPrice);
    if (ok) {
      addToast(`Промокод применён: ${promo.applied?.discount_percent}%`, 'success');
    } else if (promo.error) {
      addToast(promo.error, 'error');
    }
  };

  const itemWord = pluralize(totalItems, 'товар', 'товара', 'товаров');

  // Сколько продавцов в корзине — для предупреждения при оформлении
  const uniqueSellers = new Set(items.map((i) => i.seller_id ?? null)).size;
  const willSplitInto = uniqueSellers > 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
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
            key="cart-panel"
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Корзина"
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
                  {showCheckout ? 'Оформление' : 'Корзина'}
                </div>
                <div
                  className="price-num"
                  style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}
                >
                  {totalItems} {itemWord}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {showCheckout && (
                  <button
                    onClick={() => setShowCheckout(false)}
                    disabled={submitting || orderSent}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      padding: 8,
                    }}
                  >
                    ← Назад
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Закрыть корзину"
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
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {items.length === 0 ? (
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
                  <ShoppingBag size={48} strokeWidth={1} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>
                      Корзина пуста
                    </div>
                    <div style={{ fontSize: 13 }}>
                      Добавь что-нибудь из каталога
                    </div>
                  </div>
                </div>
              ) : showCheckout ? (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      marginBottom: 8,
                    }}
                  >
                    Контакты для связи
                  </div>
                  <Field
                    label="Имя *"
                    value={name}
                    onChange={setName}
                    placeholder="Иван Иванов"
                    disabled={submitting || orderSent}
                  />
                  <Field
                    label="Телефон *"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+7 900 000-00-00"
                    type="tel"
                    disabled={submitting || orderSent}
                  />
                  <Field
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    type="email"
                    disabled={submitting || orderSent}
                  />

                  {willSplitInto && (
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(232,255,90,0.06)',
                        border: '1px solid rgba(232,255,90,0.2)',
                        borderRadius: 12,
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 4,
                          color: 'var(--accent)',
                        }}
                      >
                        В корзине товары от {uniqueSellers}{' '}
                        {uniqueSellers === 1 ? 'магазина' : 'магазинов'}
                      </div>
                      Будет создано {uniqueSellers} отдельных заказа. Каждый
                      продавец получит только свою часть.
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={`${item.id}-${item.size ?? 'nosize'}`}
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
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                marginBottom: 4,
                              }}
                            >
                              <span
                                className="price-num"
                                style={{
                                  fontSize: 13,
                                  color: 'var(--accent)',
                                  fontWeight: 700,
                                }}
                              >
                                {formatPrice(item.price)}
                              </span>
                              {item.size && (
                                <span
                                  style={{ fontSize: 11, color: 'var(--muted)' }}
                                >
                                  · {item.size}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                border: '1px solid var(--border)',
                                borderRadius: 100,
                                padding: '4px 12px',
                              }}
                            >
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                aria-label="Уменьшить"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  padding: 4,
                                }}
                              >
                                <Minus size={14} />
                              </button>
                              <span
                                className="price-num"
                                style={{
                                  fontSize: 14,
                                  minWidth: 16,
                                  textAlign: 'center',
                                }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                aria-label="Увеличить"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  padding: 4,
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label={`Удалить ${item.name}`}
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

                  <button
                    onClick={clearCart}
                    style={{
                      marginTop: 8,
                      padding: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontFamily: 'inherit',
                    }}
                  >
                    Очистить корзину
                  </button>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div
                style={{
                  padding: '20px 28px 24px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg)',
                }}
              >
                {!showCheckout && (
                  <div style={{ marginBottom: 20 }}>
                    {promo.applied ? (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          background: 'rgba(74,222,128,0.1)',
                          border: '1px solid rgba(74,222,128,0.3)',
                          borderRadius: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            color: 'var(--success)',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={14} />
                          {promo.applied.code} · −{promo.applied.discount_percent}%
                        </div>
                        <button
                          onClick={promo.clearCode}
                          aria-label="Убрать промокод"
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
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Tag
                              size={14}
                              color="var(--muted)"
                              style={{
                                position: 'absolute',
                                left: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Промокод"
                              value={promo.code}
                              onChange={(e) =>
                                promo.setCode(e.target.value.toUpperCase())
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleApplyPromo();
                                }
                              }}
                              disabled={promo.checking}
                              style={{
                                width: '100%',
                                padding: '12px 14px 12px 38px',
                                background: 'var(--surface)',
                                border: promo.error
                                  ? '1px solid var(--danger)'
                                  : '1px solid var(--border)',
                                borderRadius: 100,
                                color: 'var(--text)',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily: 'inherit',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                              }}
                            />
                          </div>
                          <button
                            onClick={handleApplyPromo}
                            disabled={promo.checking || !promo.code.trim()}
                            style={{
                              padding: '12px 20px',
                              borderRadius: 100,
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: promo.checking ? 'wait' : 'pointer',
                              fontFamily: 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                              opacity:
                                promo.checking || !promo.code.trim() ? 0.5 : 1,
                            }}
                          >
                            {promo.checking ? (
                              <Loader2
                                size={13}
                                style={{ animation: 'spin 1s linear infinite' }}
                              />
                            ) : (
                              'Применить'
                            )}
                          </button>
                        </div>
                        {promo.error && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--danger)',
                              marginTop: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <AlertCircle size={11} /> {promo.error}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: 'var(--muted)',
                    }}
                  >
                    <span>Товары:</span>
                    <span className="price-num">{formatPrice(totalPrice)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        color: 'var(--success)',
                      }}
                    >
                      <span>Скидка:</span>
                      <span className="price-num">
                        −{formatPrice(promoDiscount)}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 15,
                      marginTop: 8,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>Итого:</span>
                    <span
                      className="price-num"
                      style={{ fontWeight: 700, fontSize: 20 }}
                    >
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: orderSent ? 1 : 1.02 }}
                  whileTap={{ scale: orderSent ? 1 : 0.98 }}
                  onClick={
                    showCheckout ? handleCheckout : () => setShowCheckout(true)
                  }
                  disabled={submitting || orderSent}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: orderSent ? 'var(--success)' : 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 100,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: submitting || orderSent ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'background 0.3s',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {orderSent ? (
                    <>
                      <Check size={18} /> Заказ оформлен!
                    </>
                  ) : submitting ? (
                    'Отправка...'
                  ) : showCheckout ? (
                    willSplitInto
                      ? `Оформить (${uniqueSellers} заказа)`
                      : 'Подтвердить заказ'
                  ) : (
                    'Оформить заказ'
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label
      style={{
        fontSize: 11,
        color: 'var(--muted)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        padding: '12px 16px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
      }}
    />
  </div>
);

export default CartPanel;