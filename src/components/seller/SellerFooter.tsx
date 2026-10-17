import { motion } from 'framer-motion';
import { Send, Play, Mail, Camera, Phone, ArrowLeft } from 'lucide-react';
import type { UISeller } from '../../types/database';

interface Props {
  seller: UISeller;
  onGoHome: () => void;
}

const noop = (e: React.MouseEvent) => e.preventDefault();

const SellerFooter = ({ seller, onGoHome }: Props) => {
  const accent = seller.accentColor || 'var(--accent)';

  const footerText =
    seller.footerText ||
    'Осознанная мода для тех, кто ценит качество, стиль и природу.';

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
          className="seller-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: 60,
            marginBottom: 60,
          }}
        >
          <div>
            {/* Лого продавца или название */}
            <div style={{ marginBottom: 20 }}>
              {seller.logo ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <img
                    src={seller.logo}
                    alt={seller.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      objectFit: 'cover',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {seller.name}
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    display: 'inline-flex',
                    alignItems: 'baseline',
                  }}
                >
                  {seller.name}
                  <span style={{ color: accent }}>.</span>
                </span>
              )}
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
              {footerText}
            </p>

            {/* Контакты продавца */}
            {(seller.phone || seller.email) && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 28,
                  fontSize: 13,
                }}
              >
                {seller.phone && (
                  <a
                    href={`tel:${seller.phone}`}
                    style={{
                      color: 'var(--text)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 500,
                    }}
                  >
                    <Phone size={13} color="var(--muted)" />
                    {seller.phone}
                  </a>
                )}
                {seller.email && (
                  <a
                    href={`mailto:${seller.email}`}
                    style={{
                      color: 'var(--text)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 500,
                    }}
                  >
                    <Mail size={13} color="var(--muted)" />
                    {seller.email}
                  </a>
                )}
              </div>
            )}

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
                      whileHover={{ x: 4, color: accent }}
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

        {/* Кнопка «На главную MØRA MART» + копирайт */}
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
          <div>
            © 2025 {seller.name}. Магазин на платформе{' '}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
              }}
              style={{
                color: 'var(--text)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              MØRA MART
            </a>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <button
              onClick={onGoHome}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 100,
                padding: '8px 16px',
                color: 'var(--text)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={12} />
              На главную MØRA MART
            </button>

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
          .seller-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 500px) {
          .seller-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
};

export default SellerFooter;