import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Package, Home, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';
import { formatPrice } from '../utils/format';

interface OrderInfo {
  id: number;
  total: number;
  itemsCount: number;
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

  useEffect(() => {
    document.title = 'Заказ оформлен — MØRA MART';

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

    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  const goHome = () => {
    sessionStorage.removeItem('mora-last-orders');
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goToMyOrders = () => {
    window.history.pushState({}, '', '/my-orders');
    window.dispatchEvent(new PopStateEvent('popstate'));
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
        <ToastContainer />
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
              {data.orders.map((order, i) => (
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
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                </motion.div>
              ))}
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
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                fontSize: 13,
                color: 'var(--muted)',
                lineHeight: 1.6,
              }}
            >
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
      <ToastContainer />
    </div>
  );
};

export default OrderSuccess;