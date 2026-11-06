import {
  Check,
  ArrowRight,
  Store,
  ShieldCheck,
  Percent,
  Wallet,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { navigate } from '../utils/navigate';
import { COMMISSION } from '../services/commission';

const FEATURES = [
  'Свой магазин на отдельном адресе /seller/…',
  'Неограниченно товаров, фото и категорий',
  'Заказы, статусы и история в кабинете',
  'Промокоды и скидки для покупателей',
  'Аналитика: выручка, заказы, топ товаров',
  'Отзывы и рейтинг магазина',
];

const ADVANTAGES = [
  {
    icon: Percent,
    title: 'Платишь только когда продаёшь',
    text: `Комиссия ${COMMISSION.defaultPercent}% начисляется с каждого проданного заказа. Нет продаж — нет начислений.`,
  },
  {
    icon: ShieldCheck,
    title: 'Без фиксированных списаний',
    text: 'Ни абонентской платы, ни платы за регистрацию, ни скрытых сборов за размещение магазина.',
  },
  {
    icon: Wallet,
    title: 'Деньги за товар — напрямую',
    text: 'Покупатель переводит стоимость заказа продавцу. Платформа не удерживает деньги за товар.',
  },
];

const FAQ = [
  {
    q: 'Сколько стоит регистрация и размещение магазина?',
    a: 'Ничего. Регистрация, магазин на отдельном адресе и все инструменты кабинета бесплатны.',
  },
  {
    q: 'Как считается комиссия?',
    a: `Комиссия — ${COMMISSION.defaultPercent}% от суммы заказа. Она фиксируется в момент оформления и видна в разделе «Комиссия» в кабинете.`,
  },
  {
    q: 'Как оплатить комиссию?',
    a: 'В кабинете показано, сколько начислено, сколько оплачено и каков долг. Переведите сумму долга по СБП и нажмите «Я перевёл — сообщить» — администратор подтвердит платёж.',
  },
  {
    q: 'Что будет, если заказов нет?',
    a: 'Комиссия не начисляется, списывать нечего. Фиксированных платежей и платы за простой нет.',
  },
  {
    q: 'Можно ли изменить ставку?',
    a: 'Базовую ставку устанавливает платформа. Индивидуальные условия можно обсудить с администратором.',
  },
];

const PricingPage = () => {
  usePageMeta({
    title: 'Комиссия для продавцов',
    description: `MØRA MART берёт ${COMMISSION.defaultPercent}% с каждого заказа. Без абонентской платы и без платы за регистрацию — продавцы платят только когда продают.`,
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
            Комиссия{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
              вместо подписки
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
            {COMMISSION.defaultPercent}% с каждого заказа, без абонентской
            платы и без платы за регистрацию. Покупатели переводят деньги за
            товар вам напрямую, а платформа получает только комиссию с
            проданных заказов.
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
                  {COMMISSION.defaultPercent}%
                </span>
                <span style={{ fontSize: 20, color: 'var(--muted)' }}>
                  с каждого заказа
                </span>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: 'var(--accent)',
                  marginBottom: 24,
                }}
              >
                Без абонентской платы и без платы за регистрацию.
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
                      style={{
                        color: 'var(--accent)',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
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
              {ADVANTAGES.map(({ icon: Icon, title, text }) => (
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

          {/* FAQ */}
          <div style={{ marginTop: 56 }}>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 900,
                marginBottom: 20,
              }}
            >
              Частые вопросы
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 14,
              }}
            >
              {FAQ.map(({ q, a }) => (
                <div
                  key={q}
                  style={{
                    padding: 20,
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {q}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {a}
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
