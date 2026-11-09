import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONTACTS } from '../utils/constants';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * /sell — полный экран входа для продавцов.
 *
 * Слева — знак и слоган, справа — форма. Ни хедера, ни футера.
 * Логин принимает email или телефон (сервер резолвит телефон в email).
 */
const SellPage = () => {
  const { signIn } = useAuth();
  const { addToast } = useToast();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: 'mora.mart — вход для продавцов',
    description: 'Кабинет продавца MØRA MART. Комиссия 4% с заказа.',
    noindex: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!login.trim() || !password) {
      setError('Введите логин и пароль');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn(login, password);
      addToast('Добро пожаловать в кабинет', 'success');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sell">
      <div className="sell-aurora" aria-hidden="true">
        <span className="sell-aurora-a" />
        <span className="sell-aurora-b" />
        <span className="sell-aurora-c" />
      </div>
      <div className="sell-mesh" aria-hidden="true" />

      <main className="sell-shell">
        <motion.section
          className="sell-brand"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src="/mora-logo.png"
            alt="MØRA MART"
            className="sell-mark"
            draggable={false}
          />
          <div className="sell-name">mora.mart</div>
          <h1 className="sell-slogan serif">Продавать теперь легче</h1>
        </motion.section>

        <motion.section
          className="sell-card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sell-card-title">Кабинет продавца</div>
          <div className="sell-card-sub">
            Вход по email или номеру телефона
          </div>

          <form onSubmit={handleSubmit} className="sell-form">
            <label className="sell-field">
              <Mail size={16} className="sell-field-icon" />
              <input
                type="text"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Email или телефон"
                autoComplete="username"
                maxLength={80}
              />
            </label>

            <label className="sell-field">
              <Lock size={16} className="sell-field-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Пароль"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <div className="sell-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="sell-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="sell-spin" /> Входим…
                </>
              ) : (
                <>
                  Войти <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="sell-note">
            Ещё не продаёте?{' '}
            <a
              href={CONTACTS.telegram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Напишите менеджеру
            </a>
          </div>
        </motion.section>
      </main>

      <style>{`
        @keyframes sell-spin-kf { to { transform: rotate(360deg); } }
        @keyframes sell-drift-a {
          from { transform: translate3d(-4%, -2%, 0) scale(1); }
          to { transform: translate3d(6%, 4%, 0) scale(1.18); }
        }
        @keyframes sell-drift-b {
          from { transform: translate3d(3%, 2%, 0) scale(1.1); }
          to { transform: translate3d(-5%, -3%, 0) scale(0.92); }
        }
        @keyframes sell-drift-c {
          from { transform: translate3d(0, 3%, 0) scale(0.95); }
          to { transform: translate3d(4%, -4%, 0) scale(1.25); }
        }
        @keyframes sell-mesh-move {
          from { background-position: 0 0, 0 0; }
          to { background-position: 0 72px, 72px 0; }
        }
        @keyframes sell-mark-glow {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(232, 255, 90, 0)); }
          50% { filter: drop-shadow(0 0 34px rgba(232, 255, 90, 0.28)); }
        }

        .sell {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(120% 90% at 15% 0%, #10140a 0%, #050505 55%, #020202 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          font-family: Inter, system-ui, sans-serif;
          color: #f5f5f5;
        }

        .sell-aurora { position: absolute; inset: 0; pointer-events: none; }
        .sell-aurora span {
          position: absolute;
          border-radius: 50%;
          filter: blur(110px);
          will-change: transform;
        }
        .sell-aurora-a {
          width: 46vmax; height: 46vmax;
          top: -18vmax; left: -12vmax;
          background: radial-gradient(circle, rgba(232,255,90,0.30) 0%, transparent 68%);
          animation: sell-drift-a 20s ease-in-out infinite alternate;
        }
        .sell-aurora-b {
          width: 34vmax; height: 34vmax;
          bottom: -14vmax; right: -8vmax;
          background: radial-gradient(circle, rgba(232,255,90,0.16) 0%, transparent 70%);
          animation: sell-drift-b 26s ease-in-out infinite alternate;
        }
        .sell-aurora-c {
          width: 26vmax; height: 26vmax;
          top: 42%; left: 46%;
          background: radial-gradient(circle, rgba(160,255,120,0.10) 0%, transparent 72%);
          animation: sell-drift-c 30s ease-in-out infinite alternate;
        }

        .sell-mesh {
          position: absolute;
          inset: -40%;
          background-image:
            linear-gradient(rgba(232,255,90,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,255,90,0.045) 1px, transparent 1px);
          background-size: 72px 72px;
          transform: perspective(700px) rotateX(56deg);
          animation: sell-mesh-move 18s linear infinite;
          mask-image: radial-gradient(ellipse at 50% 45%, #000 5%, transparent 68%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 45%, #000 5%, transparent 68%);
          opacity: 0.7;
          pointer-events: none;
        }

        .sell-shell {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1000px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 72px;
          align-items: center;
        }

        .sell-brand { display: flex; flex-direction: column; align-items: flex-start; }

        .sell-mark {
          width: clamp(150px, 17vw, 210px);
          height: auto;
          animation: sell-mark-glow 6s ease-in-out infinite;
          user-select: none;
        }

        .sell-name {
          margin-top: 18px;
          font-size: clamp(30px, 3.6vw, 44px);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .sell-slogan {
          margin: 14px 0 0;
          font-size: clamp(22px, 2.6vw, 32px);
          font-weight: 700;
          font-style: italic;
          letter-spacing: -0.03em;
          line-height: 1.1;
          color: #e8ff5a;
          max-width: 420px;
        }

        .sell-card {
          background: rgba(18, 18, 18, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 24px;
          padding: 34px 32px 26px;
          backdrop-filter: blur(18px);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
        }

        .sell-card-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .sell-card-sub {
          margin-top: 6px;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 22px;
        }

        .sell-form { display: flex; flex-direction: column; gap: 12px; }

        .sell-field {
          position: relative;
          display: block;
        }

        .sell-field-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.35);
          pointer-events: none;
        }

        .sell-field input {
          width: 100%;
          padding: 15px 16px 15px 44px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.035);
          color: #f5f5f5;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .sell-field input::placeholder { color: rgba(255, 255, 255, 0.32); }

        .sell-field input:focus {
          border-color: rgba(232, 255, 90, 0.55);
          background: rgba(232, 255, 90, 0.05);
          box-shadow: 0 0 0 3px rgba(232, 255, 90, 0.10);
        }

        .sell-error {
          display: flex;
          gap: 9px;
          align-items: flex-start;
          padding: 11px 14px;
          border-radius: 12px;
          background: rgba(255, 77, 77, 0.10);
          border: 1px solid rgba(255, 77, 77, 0.28);
          color: #ff7a7a;
          font-size: 12.5px;
          line-height: 1.45;
        }

        .sell-btn {
          margin-top: 6px;
          width: 100%;
          padding: 16px;
          border-radius: 100px;
          border: none;
          background: #e8ff5a;
          color: #000;
          font-size: 15px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
        }

        .sell-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(232, 255, 90, 0.28);
        }

        .sell-btn:disabled { opacity: 0.65; cursor: wait; }

        .sell-spin { animation: sell-spin-kf 1s linear infinite; }

        .sell-note {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.42);
        }

        .sell-note a {
          color: rgba(232, 255, 90, 0.9);
          text-decoration: none;
          border-bottom: 1px solid rgba(232, 255, 90, 0.35);
        }

        @media (max-width: 880px) {
          .sell-shell {
            grid-template-columns: 1fr;
            gap: 28px;
            max-width: 420px;
          }
          .sell-brand { align-items: center; text-align: center; }
          .sell-slogan { margin-inline: auto; }
          .sell-card { padding: 26px 22px 20px; }
          .sell { padding: 32px 18px; }
        }

        @media (max-width: 420px) {
          .sell-mark { width: 120px; }
          .sell-name { font-size: 26px; }
          .sell-slogan { font-size: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sell-aurora span, .sell-mesh, .sell-mark { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SellPage;
