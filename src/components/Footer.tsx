import { motion } from 'framer-motion';
import { Send, Play, Mail, Camera } from 'lucide-react';
import Logo from './Logo';

const noop = (e: React.MouseEvent) => e.preventDefault();

const Footer = () => {
  return (
    <footer
      id="footer"
      style={{
        borderTop: '1px solid var(--border)',
        padding: '80px 0 40px',
        background: 'var(--bg-soft)',
      }}
    >
      <div className="container">
        {/* Верхняя часть: Лого + описание + соцсети */}
        <div
          className="footer-top"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 40,
            marginBottom: 60,
          }}
        >
          <div style={{ maxWidth: 400 }}>
            <div style={{ marginBottom: 24 }}>
              <Logo size="lg" withSuffix />
            </div>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 15,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Осознанная мода для тех, кто ценит качество, стиль и природу.
              Платформа независимых магазинов.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              {[Camera, Send, Play, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  onClick={noop}
                  whileHover={{ scale: 1.1, y: -3 }}
                  aria-label={
                    ['Instagram', 'Telegram', 'YouTube', 'Email'][i]
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text)',
                    transition: 'border-color 0.2s',
                  }}
                  className="social-btn"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Контакты */}
          <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 16,
                }}
              >
                Связаться с нами
              </div>
              <a
                href="mailto:hello@moramart.ru"
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                hello@moramart.ru
              </a>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                Пн–Пт, 10:00–19:00
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя часть: копирайт + документы */}
        <div
          style={{
            paddingTop: 40,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
            fontSize: 13,
            color: 'var(--muted)',
          }}
        >
          <div>© 2025 MØRA MART. Все права защищены.</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a
              href="#"
              onClick={noop}
              style={{
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              className="footer-link"
            >
              Политика конфиденциальности
            </a>
            <a
              href="#"
              onClick={noop}
              style={{
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              className="footer-link"
            >
              Условия
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .social-btn:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
        }
        .footer-link:hover {
          color: var(--text) !important;
        }
        @media (max-width: 768px) {
          .footer-top {
            flex-direction: column !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;