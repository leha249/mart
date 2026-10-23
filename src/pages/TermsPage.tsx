import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';

const TermsPage = () => {
  useEffect(() => {
    document.title = 'Условия использования — MØRA MART';
    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={goHome}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'inherit',
                padding: 0,
                marginBottom: 32,
              }}
            >
              <ArrowLeft size={14} /> На главную
            </button>

            <div
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • Документы
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
              Условия{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                использования
              </span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--muted)',
                marginBottom: 40,
              }}
            >
              Последнее обновление: 17 октября 2026 г.
            </p>

            <div
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: 'var(--text-dim)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <p>
                Используя платформу{' '}
                <strong style={{ color: 'var(--text)' }}>MØRA MART</strong>, вы
                соглашаетесь с настоящими Условиями. Пожалуйста, прочтите их
                внимательно.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                1. О платформе
              </h2>
              <p>
                MØRA MART — платформа, объединяющая независимых продавцов
                одежды. Платформа не является продавцом и не несёт
                ответственности за качество товаров — это ответственность
                конкретного продавца.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                2. Оформление заказа
              </h2>
              <p>
                При оформлении заказа вы подтверждаете, что предоставленная
                информация достоверна. После оформления продавец свяжется с вами
                для подтверждения деталей.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                3. Цены и оплата
              </h2>
              <p>
                Цены указаны в рублях. Платформа не обрабатывает платежи — оплата
                происходит напрямую между покупателем и продавцом по договорённости.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                4. Ответственность продавца
              </h2>
              <p>
                Продавец несёт ответственность за:
              </p>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Достоверность описания товара</li>
                <li>Качество и оригинальность товара</li>
                <li>Соблюдение сроков и условий продажи</li>
                <li>Взаимодействие с покупателем</li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                5. Отзывы
              </h2>
              <p>
                Отзывы проходят модерацию. Мы оставляем за собой право удалять
                отзывы, содержащие оскорбления, спам или не соответствующие
                действительности.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                6. Блокировка аккаунтов
              </h2>
              <p>
                Мы можем заблокировать продавца или магазин за нарушение правил
                платформы, мошенничество или жалобы покупателей.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                7. Контакты
              </h2>
              <p>
                По всем вопросам:{' '}
                <a
                  href="mailto:hello@moramart.ru"
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  hello@moramart.ru
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
};

export default TermsPage;