import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Send,
  Percent,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONTACTS } from '../utils/constants';
import { COMMISSION } from '../services/commission';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * /sell — «Магазин»: точка входа для продавцов.
 *
 * Регистрации здесь нет: аккаунты продавцов создаёт только админ.
 * Здесь только вход (email + пароль) и путь «ещё не продаёте» →
 * заявка менеджеру в Telegram.
 */
const SellPage = () => {
  const { signIn } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: 'Магазин — вход для продавцов MØRA MART',
    description:
      'Кабинет продавца MØRA MART: товары, заказы, комиссия. Комиссия 4% с заказа, без абонентской платы.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      addToast('Добро пожаловать в кабинет', 'success');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          <button
            onClick={() => navigate('/')}
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
              marginBottom: 28,
            }}
          >
            <ArrowLeft size={14} /> На главную
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: 48,
              alignItems: 'start',
            }}
            className="sell-grid"
          >
            {/* Левая часть — визитка */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: 14,
                }}
              >
                • Магазин на платформе
              </div>
              <h1
                className="serif"
                style={{
                  fontSize: 'clamp(32px, 4.6vw, 56px)',
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  lineHeight: 1.02,
                  marginBottom: 18,
                }}
              >
                Продавайте{' '}
                <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                  своим именем
                </span>
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--text-dim)',
                  lineHeight: 1.7,
                  maxWidth: 460,
                  marginBottom: 28,
                }}
              >
                Ваш мини-магазин внутри MØRA MART: своя витрина, лукбук,
                категории и чат с покупателем. Комиссия — {COMMISSION.defaultPercent}%
                с заказа, без абонентской платы и без платы за регистрацию.
              </p>

              <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
                {[
                  {
                    icon: Percent,
                    text: `Комиссия ${COMMISSION.defaultPercent}% только с проданного заказа`,
                  },
                  {
                    icon: Truck,
                    text: 'Доставку и оплату согласуете с покупателем напрямую',
                  },
                  {
                    icon: ShieldCheck,
                    text: 'Мы — витрина и трафик, товар и ответственность за него остаются вашими',
                  },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 13.5,
                      color: 'var(--text-dim)',
                    }}
                  >
                    <Icon size={16} style={{ color: 'var(--accent)' }} />
                    {text}
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: 24,
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  background: 'var(--surface)',
                  maxWidth: 460,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                  Ещё не продаёте на MØRA MART?
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  Аккаунты продавцов создаём мы — так на витрине не появляется
                  случайных магазинов. Напишите менеджеру, он задаст пару
                  вопросов и заведёт кабинет.
                </p>
                <a
                  href={CONTACTS.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 22px',
                    borderRadius: 100,
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Send size={16} /> {CONTACTS.telegramLabel}
                </a>
              </div>
            </motion.div>

            {/* Правая часть — вход */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'sticky',
                top: 110,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                Вход для продавца
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                Только для действующих магазинов. Логин и пароль выдаёт
                менеджер.
              </div>

              <label
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="shop@example.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />

              <label
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Пароль
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,77,77,0.1)',
                    border: '1px solid rgba(255,77,77,0.3)',
                    borderRadius: 10,
                    color: 'var(--danger)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4,
                  padding: '15px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#000',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Входим…
                  </>
                ) : (
                  <>
                    Войти в кабинет <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .sell-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SellPage;
