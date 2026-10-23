import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';

const AboutPage = () => {
  useEffect(() => {
    document.title = 'О платформе — MØRA MART';
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
              • О платформе
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(40px, 6vw, 80px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
                marginBottom: 40,
              }}
            >
              Маркетплейс одежды{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                со своим характером
              </span>
            </h1>

            <div
              style={{
                fontSize: 17,
                lineHeight: 1.8,
                color: 'var(--text-dim)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <p>
                <strong style={{ color: 'var(--text)' }}>MØRA MART</strong> —
                это платформа, где независимые продавцы представляют свои
                коллекции. Мы объединяем магазины с разным стилем и характером
                в одном пространстве, чтобы вы могли найти именно то, что
                откликается.
              </p>

              <p>
                Каждый продавец на платформе — отдельный магазин со своей
                философией, категориями и подходами к работе. Покупатель
                выбирает не просто товар, а конкретного продавца и его
                эстетику.
              </p>

              <h2
                className="serif"
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  marginTop: 24,
                  marginBottom: 8,
                }}
              >
                Что для нас важно
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 24,
                  marginTop: 16,
                }}
              >
                {[
                  {
                    title: 'Осознанность',
                    text: 'Мы поддерживаем продавцов, которые ценят качество материалов, устойчивость и осознанное потребление.',
                  },
                  {
                    title: 'Качество',
                    text: 'На платформе — только проверенные продавцы. Мы следим за репутацией магазинов и отзывами покупателей.',
                  },
                  {
                    title: 'Уникальность',
                    text: 'Каждый продавец — со своим стилем. Мы ценим индивидуальность и не пытаемся сделать всех «одинаково красивыми».',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      padding: 24,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--muted)',
                        lineHeight: 1.6,
                      }}
                    >
                      {item.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              <h2
                className="serif"
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  marginTop: 24,
                  marginBottom: 8,
                }}
              >
                Хотите стать продавцом?
              </h2>
              <p>
                Платформа открыта для новых магазинов. Если у вас есть коллекция
                и вы хотите продавать её на MØRA MART — напишите нам:{' '}
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
                . Мы рассмотрим вашу заявку и поможем с размещением.
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

export default AboutPage;