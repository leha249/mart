import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Политика конфиденциальности — MØRA MART';
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
              Политика{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                конфиденциальности
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
                Настоящая Политика конфиденциальности описывает, как платформа{' '}
                <strong style={{ color: 'var(--text)' }}>MØRA MART</strong>{' '}
                собирает, использует и защищает вашу персональную информацию.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                1. Какие данные мы собираем
              </h2>
              <p>
                При оформлении заказа мы запрашиваем имя, телефон и, по желанию,
                email. Эти данные используются только для связи с вами по
                вопросам заказа и не передаются третьим лицам.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                2. Как мы используем данные
              </h2>
              <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Для обработки и подтверждения заказов</li>
                <li>Для связи с вами по вопросам заказа</li>
                <li>Для улучшения работы платформы</li>
              </ul>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                3. Cookies и локальное хранилище
              </h2>
              <p>
                Платформа использует localStorage для сохранения содержимого
                корзины, избранного и истории поиска. Эти данные хранятся
                локально в вашем браузере и не передаются на сервер.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                4. Защита данных
              </h2>
              <p>
                Мы используем шифрование (HTTPS) и защищённое хранилище
                Supabase. Доступ к персональным данным имеют только продавцы, чьи
                товары вы заказали, и администрация платформы.
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                5. Ваши права
              </h2>
              <p>
                Вы можете запросить удаление ваших данных, написав на{' '}
                <a
                  href="mailto:privacy@moramart.ru"
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  privacy@moramart.ru
                </a>
                .
              </p>

              <h2
                className="serif"
                style={{ fontSize: 24, fontWeight: 900, marginTop: 16 }}
              >
                6. Изменения
              </h2>
              <p>
                Мы можем обновлять эту политику. Актуальная версия всегда
                доступна на этой странице.
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

export default PrivacyPage;