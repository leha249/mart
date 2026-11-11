import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Package, Home, Phone, CreditCard } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { formatPrice } from '../utils/format';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import { sellersService } from '../services/sellers';
import QRCode from 'qrcode';

interface OrderInfo {
  id: number;
  total: number;
  itemsCount: number;
  sellerId?: number | null;
}

/** Куда платить конкретному продавцу — данные из sellers_public. */
interface SellerPay {
  name: string;
  payUrl?: string;
  payNote?: string;
}

interface LastOrdersData {
  phone: string;
  name: string;
  orders: OrderInfo[];
  createdAt: string;
}

const OrderSuccess = () => {
  const [data, setData] = useState<LastOrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<Record<number, SellerPay>>({});
  /** dataURL QR-кода на оплату по каждому продавцу */
  const [qr, setQr] = useState<Record<number, string>>({});

  usePageMeta({
    title: 'Заказ оформлен',
    description: 'Спасибо за заказ на MØRA MART.',
    noindex: true,
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('mora-last-orders');
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch (e) {
      console.error('[OrderSuccess] parse error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Кому платить: подтягиваем ссылки на оплату продавцов из заказа
  useEffect(() => {
    const ids = [
      ...new Set(
        (data?.orders ?? [])
          .map((o) => o.sellerId)
          .filter((id): id is number => typeof id === 'number')
      ),
    ];
    if (ids.length === 0) return;

    let alive = true;

    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const seller = await sellersService.getById(id);
            if (!seller) return [id, null] as const;
            return [
              id,
              {
                name: seller.name,
                payUrl: seller.payUrl,
                payNote: seller.payNote,
              } as SellerPay,
            ] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      if (!alive) return;
      const map: Record<number, SellerPay> = {};
      for (const [id, seller] of entries) {
        if (seller) map[id] = seller;
      }
      setSellers(map);

      // QR на оплату: генерируется локально из ссылки продавца,
      // никаких внешних сервисов и утечек ссылки наружу.
      const codes: Record<number, string> = {};
      for (const [id, seller] of Object.entries(map)) {
        if (!seller.payUrl) continue;
        try {
          codes[Number(id)] = await QRCode.toDataURL(seller.payUrl, {
            width: 240,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#0a0a0a', light: '#ffffff' },
          });
        } catch (e) {
          console.warn('[OrderSuccess] QR generation failed:', e);
        }
      }
      if (alive) setQr(codes);
    })();

    return () => {
      alive = false;
    };
  }, [data]);

  const goHome = () => {
    sessionStorage.removeItem('mora-last-orders');
    navigate('/');
  };

  const goToMyOrders = () => {
    navigate('/my-orders');
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
        }}
      >
        Загрузка...
      </div>
    );
  }

  if (!data || !data.orders || data.orders.length === 0) {
    return (
      <>
        <ScrollProgress />
        <Cursor />
        <Navbar />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 20px 80px',
            textAlign: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
            }}
          >
            <Package size={36} strokeWidth={1.5} />
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-1px',
            }}
          >
            Нет информации о заказе
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 15,
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            Возможно, страница устарела. Перейдите на главную или посмотрите
            свои заказы.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={goHome}
              style={{
                padding: '14px 28px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Home size={16} /> На главную
            </button>
            <button
              onClick={goToMyOrders}
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Мои заказы <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const totalSum = data.orders.reduce((s, o) => s + o.total, 0);

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          {/* Успех */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              textAlign: 'center',
              marginBottom: 48,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
              }}
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: '#000',
                boxShadow: '0 8px 32px rgba(74,222,128,0.3)',
              }}
            >
              <Check size={48} strokeWidth={3} />
            </motion.div>

            <div
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • Спасибо за заказ
            </div>

            <h1
              className="serif"
              style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              Заказ{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                оформлен
              </span>
            </h1>

            <p
              style={{
                fontSize: 15,
                color: 'var(--muted)',
                maxWidth: 480,
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              {data.name}, спасибо! Мы свяжемся с вами по телефону{' '}
              <strong style={{ color: 'var(--text)' }}>{data.phone}</strong> для
              подтверждения.
            </p>
          </motion.div>

          {/* Список заказов */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 28,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {data.orders.length === 1
                  ? 'Ваш заказ'
                  : `Ваши заказы (${data.orders.length})`}
              </h2>
              {data.orders.length > 1 && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    padding: '6px 12px',
                    background: 'rgba(232,255,90,0.08)',
                    border: '1px solid rgba(232,255,90,0.2)',
                    borderRadius: 100,
                  }}
                >
                  От разных продавцов
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {data.orders.map((order, i) => {
                const seller = order.sellerId
                  ? sellers[order.sellerId]
                  : undefined;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    style={{
                      padding: 16,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          #{order.id}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            Заказ №{order.id}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {order.itemsCount}{' '}
                            {order.itemsCount === 1
                              ? 'товар'
                              : order.itemsCount < 5
                              ? 'товара'
                              : 'товаров'}
                          </div>
                        </div>
                      </div>
                      <div
                        className="price-num"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        {formatPrice(order.total)}
                      </div>
                    </div>

                    {order.sellerId && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          paddingTop: 12,
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12.5,
                            color: 'var(--muted)',
                            lineHeight: 1.5,
                          }}
                        >
                          Оплата напрямую продавцу
                          {seller ? (
                            <>
                              {' '}
                              <strong style={{ color: 'var(--text)' }}>
                                {seller.name}
                              </strong>
                              {seller.payNote ? ` · ${seller.payNote}` : ''}
                            </>
                          ) : null}
                        </div>
                        {seller?.payUrl ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 14,
                              flexWrap: 'wrap',
                            }}
                          >
                            <a
                              href={seller.payUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '10px 20px',
                                borderRadius: 100,
                                border: 'none',
                                background: 'var(--accent)',
                                color: 'var(--accent-contrast)',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                textDecoration: 'none',
                              }}
                            >
                              <CreditCard size={15} /> Оплатить{' '}
                              {formatPrice(order.total)}
                            </a>

                            {order.sellerId && qr[order.sellerId] && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                }}
                              >
                                <img
                                  src={qr[order.sellerId]}
                                  alt={`QR-код для оплаты заказа №${order.id}`}
                                  width={78}
                                  height={78}
                                  style={{
                                    borderRadius: 8,
                                    background: '#fff',
                                    padding: 4,
                                    display: 'block',
                                  }}
                                />
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--muted)',
                                    lineHeight: 1.4,
                                    maxWidth: 120,
                                  }}
                                >
                                  Или отсканируйте камерой телефона
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                            Способ оплаты уточнит продавец
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {data.orders.length > 1 && (
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                  Итого:
                </span>
                <span
                  className="price-num"
                  style={{ fontSize: 20, fontWeight: 700 }}
                >
                  {formatPrice(totalSum)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Что дальше */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              padding: 20,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 14,
                fontSize: 13,
                color: 'var(--muted)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Phone
                  size={16}
                  color="var(--accent)"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  Каждый продавец свяжется с вами по телефону{' '}
                  <strong style={{ color: 'var(--text)' }}>{data.phone}</strong>{' '}
                  для подтверждения заказа и уточнения деталей доставки.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CreditCard
                  size={16}
                  color="var(--accent)"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  Деньги за заказ вы переводите продавцу напрямую — платформа
                  их не принимает и не хранит. Чек об оплате выдаёт продавец
                  (самозанятый — через приложение «Мой налог»).
                </div>
              </div>
            </div>
          </motion.div>

          {/* Кнопки */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={goHome}
              style={{
                padding: '14px 28px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Home size={16} /> На главную
            </button>
            <button
              onClick={goToMyOrders}
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Мои заказы <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
