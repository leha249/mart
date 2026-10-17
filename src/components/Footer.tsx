import { motion } from 'framer-motion';
import { Send, Play, Mail, Camera } from 'lucide-react';
import Logo from './Logo';

const columns = [
  {
    title: 'Магазин',
    links: ['Новинки', 'Бестселлеры', 'Распродажа', 'Подарочные карты'],
  },
  {
    title: 'Помощь',
    links: ['Доставка', 'Возврат', 'Размеры', 'Контакты'],
  },
  {
    title: 'О нас',
    links: ['История', 'Устойчивость', 'Карьера', 'Пресса'],
  },
];

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
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: 60,
            marginBottom: 60,
          }}
        >
          <div>
            <div style={{ marginBottom: 20 }}>
              <Logo size="lg" withSuffix />
            </div>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 320,
                marginBottom: 28,
              }}
            >
              Осознанная мода для тех, кто ценит качество, стиль и природу.
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
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text)',
                  }}
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 20,
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {col.links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      onClick={noop}
                      whileHover={{ x: 4, color: 'var(--accent)' }}
                      style={{
                        color: 'var(--text)',
                        textDecoration: 'none',
                        fontSize: 14,
                        display: 'inline-block',
                        transition: 'color 0.2s',
                      }}
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

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
              style={{ color: 'var(--muted)', textDecoration: 'none' }}
            >
              Политика конфиденциальности
            </a>
            <a
              href="#"
              onClick={noop}
              style={{ color: 'var(--muted)', textDecoration: 'none' }}
            >
              Условия
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 500px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;