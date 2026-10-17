import { motion } from 'framer-motion';
import { Leaf, Sparkles, Truck } from 'lucide-react';
import type { UISeller } from '../../types/database';

interface Props {
  seller: UISeller;
}

const features = [
  {
    icon: Leaf,
    title: 'Эко-материалы',
    text: 'Только натуральные и переработанные ткани от проверенных поставщиков.',
  },
  {
    icon: Sparkles,
    title: 'Лимитированные серии',
    text: 'Каждая коллекция выпускается ограниченным тиражом. Уникальность в каждой вещи.',
  },
  {
    icon: Truck,
    title: 'Бесплатная доставка',
    text: 'По всей России при заказе от 5 000 ₽. Возврат в течение 30 дней.',
  },
];

const SellerAbout = ({ seller }: Props) => {
  const accent = seller.accentColor || 'var(--accent)';

  // Дефолты MØRA MART
  const title = seller.aboutTitle || 'Мы создаём одежду с характером';
  const text =
    seller.aboutText ||
    'MØRA MART — это больше, чем магазин. Это философия осознанного потребления, где каждый предмет одежды создаётся с уважением к природе и человеку.';
  const badge = seller.aboutBadge || '100% ORGANIC';

  // Разбиваем заголовок на «до» и «курсив в конце»
  // Логика: последнее слово — курсивом акцентом.
  const titleWords = title.trim().split(' ');
  const titleLast = titleWords.length > 1 ? titleWords[titleWords.length - 1] : '';
  const titleMain =
    titleWords.length > 1 ? titleWords.slice(0, -1).join(' ') + ' ' : title;

  return (
    <section
      id="about"
      style={{ padding: '120px 0', scrollMarginTop: 80 }}
    >
      <div className="container">
        <div
          className="seller-about-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
              }}
            >
              • О магазине
            </div>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1.05,
                marginBottom: 24,
              }}
            >
              {titleMain}
              {titleLast && (
                <span style={{ fontStyle: 'italic', color: accent }}>
                  {titleLast}
                </span>
              )}
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 16,
                lineHeight: 1.8,
                marginBottom: 24,
              }}
            >
              {text}
            </p>

            {seller.description && seller.description !== text && (
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginBottom: 48,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}
              >
                {seller.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
                marginTop: 24,
              }}
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  style={{ display: 'flex', gap: 20 }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: accent,
                    }}
                  >
                    <f.icon size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--muted)',
                        lineHeight: 1.6,
                      }}
                    >
                      {f.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            style={{ position: 'relative' }}
          >
            <div
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                aspectRatio: '4/5',
                background: 'var(--surface)',
              }}
            >
              {seller.aboutImage ? (
                <img
                  src={seller.aboutImage}
                  alt={seller.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : seller.cover ? (
                <img
                  src={seller.cover}
                  alt={seller.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)',
                    padding: 40,
                    textAlign: 'center',
                    fontSize: 14,
                  }}
                >
                  Изображение появится позже
                </div>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 900,
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 1.3,
                padding: 20,
                letterSpacing: '0.5px',
              }}
            >
              {badge.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < badge.split('\n').length - 1 && <br />}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .seller-about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
};

export default SellerAbout;