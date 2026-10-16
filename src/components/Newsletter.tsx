import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    setSent(true);
    setEmail('');
    addToast('Вы подписаны! Промокод отправлен на почту', 'success');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <section style={{ padding: '80px 0 120px' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
            border: '1px solid var(--border)',
            borderRadius: 32,
            padding: '80px 60px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="newsletter-box"
        >
          <div
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(232,255,90,0.15), transparent 70%)',
              top: '-50%',
              right: '-10%',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(28px, 4vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-1.5px',
                marginBottom: 20,
                lineHeight: 1.1,
              }}
            >
              Получите{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                −10%
              </span>{' '}
              на первый заказ
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 16,
                maxWidth: 500,
                margin: '0 auto 40px',
                lineHeight: 1.7,
              }}
            >
              Подпишитесь на рассылку и первыми узнавайте о новых коллекциях и
              приватных распродажах.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              style={{
                display: 'flex',
                gap: 12,
                maxWidth: 500,
                margin: '0 auto',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="email"
                placeholder="ваш@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                aria-label="Email для подписки"
                aria-invalid={!!error}
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: '18px 24px',
                  borderRadius: 100,
                  border: error
                    ? '1px solid var(--danger)'
                    : '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '18px 32px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {sent ? '✓ Готово' : 'Подписаться'}
                {!sent && <ArrowRight size={16} />}
              </motion.button>
            </form>

            <div
              aria-live="polite"
              style={{
                minHeight: 20,
                marginTop: 12,
                fontSize: 13,
                color: error ? 'var(--danger)' : 'var(--muted)',
              }}
            >
              {error ||
                (sent ? 'Спасибо! Проверьте почту — там промокод на −10%' : '')}
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .newsletter-box { padding: 48px 24px !important; }
        }
      `}</style>
    </section>
  );
};

export default Newsletter;