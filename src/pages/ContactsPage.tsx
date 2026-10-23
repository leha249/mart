import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Send, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';

const ContactsPage = () => {
  useEffect(() => {
    document.title = 'Контакты — MØRA MART';
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
        <div className="container" style={{ maxWidth: 700 }}>
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
              • Контакты
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(40px, 6vw, 80px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1,
                marginBottom: 32,
              }}
            >
              Связаться{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                с нами
              </span>
            </h1>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--text-dim)',
                marginBottom: 48,
              }}
            >
              Если у вас есть вопрос, предложение или проблема с заказом —
              напишите нам. Мы отвечаем в течение 1 рабочего дня.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {[
                {
                  icon: Mail,
                  title: 'Email',
                  value: 'hello@moramart.ru',
                  href: 'mailto:hello@moramart.ru',
                  note: 'Общие вопросы, сотрудничество',
                },
                {
                  icon: Send,
                  title: 'Telegram',
                  value: '@moramart',
                  href: 'https://t.me/moramart',
                  note: 'Быстрая связь',
                },
                {
                  icon: MessageCircle,
                  title: 'Поддержка',
                  value: 'support@moramart.ru',
                  href: 'mailto:support@moramart.ru',
                  note: 'Проблемы с заказами',
                },
              ].map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    item.href.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    padding: 24,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    textDecoration: 'none',
                    color: 'var(--text)',
                    transition: 'border-color 0.2s',
                  }}
                  className="contact-card"
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {item.value}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        marginTop: 4,
                      }}
                    >
                      {item.note}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            <div
              style={{
                marginTop: 48,
                padding: 24,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                fontSize: 14,
                color: 'var(--muted)',
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: 'var(--text)' }}>
                Юридический адрес:
              </strong>
              <br />
              МØRA MART — платформа независимых магазинов
              <br />
              Работаем онлайн, по всей России
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
      <ToastContainer />

      <style>{`
        .contact-card:hover {
          border-color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
};

export default ContactsPage;