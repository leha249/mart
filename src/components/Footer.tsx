import { motion } from 'framer-motion';
import { Send, Play, Mail, Camera, ArrowUpRight } from 'lucide-react';
import Logo from './Logo';

const noop = (e: React.MouseEvent) => e.preventDefault();

const Footer = () => {
  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const navLinks = [
    { label: 'О платформе', path: '/about' },
    { label: 'Магазины', path: '/sellers' },
    { label: 'Каталог', path: '/catalog' },
    { label: 'Контакты', path: '/contacts' },
  ];

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
        {/* Верхняя часть */}
        <div
          className="footer-top"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1.5fr',
            gap: 60,
            marginBottom: 60,
          }}
        >
          {/* Лого + описание + соцсети */}
          <div style={{ maxWidth: 360 }}>
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

          {/* Навигация */}
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 20,
              }}
            >
              Платформа
            </div>
            <ul
              style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {navLinks.map((link) => (
                <li key={link.path}>
                  <motion.a
                    href={link.path}
                    onClick={go(link.path)}
                    whileHover={{ x: 4 }}
                    style={{
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'color 0.2s',
                    }}
                    className="footer-nav-link"
                  >
                    {link.label}
                    <ArrowUpRight size={12} style={{ opacity: 0.4 }} />
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 20,
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
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              Пн–Пт, 10:00–19:00
              <br />
              Отвечаем в течение 1 рабочего дня
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
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
              href="/privacy"
              onClick={go('/privacy')}
              style={{
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              className="footer-bottom-link"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/terms"
              onClick={go('/terms')}
              style={{
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              className="footer-bottom-link"
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
        .footer-nav-link:hover {
          color: var(--accent) !important;
        }
        .footer-bottom-link:hover {
          color: var(--text) !important;
        }
        @media (max-width: 900px) {
          .footer-top {
            grid-template-columns: 1fr 1fr !important;
            gap: 40px !important;
          }
        }
        @media (max-width: 600px) {
          .footer-top {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;