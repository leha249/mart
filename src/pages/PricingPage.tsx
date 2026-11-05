import { Check, ArrowRight, Store, ShieldCheck, Percent } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { navigate } from '../utils/navigate';
import { SUBSCRIPTION } from '../services/subscriptions';

const FEATURES = [
  'Свой магазин на отдельном адресе /seller/…',
  'Неограниченно товаров, фото и категорий',
  'Заказы, статусы и история в кабинете',
  'Промокоды и скидки для покупателей',
  'Аналитика: выручка, заказы, топ товаров',
  'Отзывы и рейтинг магазина',
];

const PricingPage = () => {
  usePageMeta({
    title: 'Тарифы для продавцов',
    description: `Подписка продавца MØRA MART — ${SUBSCRIPTION.priceMonth} ${SUBSCRIPTION.currency} в месяц. Первые ${SUBSCRIPTION.trialDays} дней бесплатно. Покупатели не платят платформе ничего.`,
  });

  return (
    <div id="top" style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 130, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 16,
            }}
          >
            • Для продавцов
          </div>

          <h1
            className="serif"
            style={{
              fontSize: 'clamp(34px, 6vw, 64px)',
              fontWeight: 900,
              letterSpacing: '-2px',
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            Подписка{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
              вместо комиссии
            </span>
          </h1>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: 'var(--text-dim)',
              maxWidth: 640,
              marginBottom: 48,
            }}
          >
            Покупатели не платят платформе ни копейки: деньги за товар они
            переводят вам напрямую. Вы платите только за место на витрине —{' '}
            {SUBSCRIPTION.priceMonth} {SUBSCRIPTION.currency} в месяц.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: 24,
              alignItems: 'start',
            }}
            className="pricing-grid"
          >
            {/* Тариф */}
            <div
              style={{
                padding: 32,
                borderRadius: 24,
                border: '1px solid var(--accent)',
                background: 'rgba(232,255,90,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--muted)',
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                <Store size={14} /> Магазин на платформе
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  className="price-num"
                  style={{ fontSize: 52, fontWeight: 700 }}
                >
                  {SUBSCRIPTION.priceMonth}
                </span>
                <span style={{ fontSize: 20, color: 'var(--muted)' }}>
                  {SUBSCRIPTION.currency}/мес
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 24 }}>
                Первые {SUBSCRIPTION.trialDays} дней бесплатно. Без комиссии с
                продаж.
              </p>

              <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
                {FEATURES.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      fontSize: 13.5,
                      color: 'var(--text-dim)',
                      lineHeight: 1.5,
                    }}
                  >
                    <Check
                      size={16}
                      style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}
                    />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/register-seller')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '16px 24px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Открыть магазин <ArrowRight size={16} />
              </button>
            </div>

            {/* Как это работает */}
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                {
                  icon: Percent,
                  title: 'Без комиссии с продаж',
                  text: 'Сколько продали — столько и ваше. Платформа не берёт процент с заказов.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Оплата товара — напрямую',
                  text: 'Покупатель переводит деньги продавцу (СБП или при получении). Платформа в расчётах не участвует.',
                },
                {
                  icon: Store,
                  title: 'Одна подписка — весь кабинет',
                  text: 'Товары, заказы, промокоды, аналитика и отзывы включены в тариф.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  style={{
                    padding: 22,
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                      color: 'var(--accent)',
                    }}
                  >
                    <Icon size={16} />
                    <strong style={{ color: 'var(--text)', fontSize: 14 }}>
                      {title}
                    </strong>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default PricingPage;
