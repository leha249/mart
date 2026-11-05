import { motion } from 'framer-motion';
import { ArrowLeft, Compass, Search, Home } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { navigate } from '../utils/navigate';

const NotFoundPage = () => {
  usePageMeta({
    title: 'Страница не найдена — 404',
    description:
      'Такой страницы на MØRA MART нет. Перейдите в каталог или к списку магазинов.',
    noindex: true,
  });

  return (
    <div id="top" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main
        className="container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingTop: 140,
          paddingBottom: 120,
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 560 }}
        >
          <div
            className="serif"
            style={{
              fontSize: 'clamp(96px, 18vw, 160px)',
              lineHeight: 1,
              color: 'var(--accent)',
              opacity: 0.9,
              marginBottom: 28,
            }}
          >
            404
          </div>

          <h1 className="serif" style={{ fontSize: 34, marginBottom: 14 }}>
            Такой страницы нет
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14.5,
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            Адрес могли изменить, товар — снять с продажи, а магазин —
            переименовать. Загляните в каталог: там всё на месте.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => navigate('/catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 26px',
                borderRadius: 999,
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Compass size={16} /> В каталог
            </button>

            <button
              onClick={() => navigate('/sellers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 26px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Search size={16} /> Магазины
            </button>

            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 26px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Home size={16} /> На главную
            </button>
          </div>

          <button
            onClick={() => window.history.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 28,
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 12.5,
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Вернуться назад
          </button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
