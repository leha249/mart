import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONTACTS } from '../utils/constants';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * /sell — полноэкранная страница входа для продавцов.
 *
 * Ни хедера, ни футера: логотип, mora.mart, слоган и форма.
 * Войти можно по email или по телефону (сервер резолвит его в email).
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
    <div className="sell-screen">
      {/* Анимированный фон */}
      <div className="sell-bg" aria-hidden="true">
        <div className="sell-glow sell-glow-1" />
        <div className="sell-glow sell-glow-2" />
        <div className="sell-glow sell-glow-3" />
        <div className="sell-grid" />
      </div>

      <motion.div
        className="sell-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src="/mora-logo.webp"
          alt="MØRA MART"
          className="sell-logo"
          width={220}
          height={220}
          draggable={false}
        />

        <div className="sell-wordmark">mora.mart</div>
        <h1 className="sell-tagline serif">Продавать теперь легче</h1>

        <form onSubmit={handleSubmit} className="sell-form">
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
            className="sell-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Пароль"
            autoComplete="current-password"
            className="sell-input"
          />

          {error && (
            <div className="sell-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="sell-submit">
            {submitting ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: 'sell-spin 1s linear infinite' }}
                />
                Входим…
              </>
            ) : (
              <>
                Войти <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="sell-hint">
          Ещё не продаёте?{' '}
          <a
            href={CONTACTS.telegram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Напишите менеджеру
          </a>
        </div>
      </motion.div>

      <style>{`
        @keyframes sell-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sell-screen {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background: #050505;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: Inter, system-ui, sans-serif;
        }

        .sell-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .sell-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
          background: radial-gradient(circle, #e8ff5a 0%, transparent 70%);
          will-change: transform;
        }

        .sell-glow-1 {
          width: 60vmax;
          height: 60vmax;
          top: -20vmax;
          left: -15vmax;
          animation: sell-float-1 18s ease-in-out infinite alternate;
        }

        .sell-glow-2 {
          width: 45vmax;
          height: 45vmax;
          bottom: -18vmax;
          right: -12vmax;
          opacity: 0.22;
          animation: sell-float-2 22s ease-in-out infinite alternate;
        }

        .sell-glow-3 {
          width: 32vmax;
          height: 32vmax;
          bottom: 10%;
          left: 15%;
          opacity: 0.14;
          animation: sell-float-3 26s ease-in-out infinite alternate;
        }

        .sell-grid {
          position: absolute;
          inset: -50%;
          background-image:
            linear-gradient(rgba(232, 255, 90, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232, 255, 90, 0.05) 1px, transparent 1px);
          background-size: 64px 64px;
          transform: perspective(600px) rotateX(58deg);
          animation: sell-grid-move 14s linear infinite;
          opacity: 0.5;
          mask-image: radial-gradient(ellipse at center, #000 10%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, #000 10%, transparent 70%);
        }

        @keyframes sell-float-1 {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(8vmax, 6vmax, 0) scale(1.15); }
        }
        @keyframes sell-float-2 {
          from { transform: translate3d(0, 0, 0) scale(1.1); }
          to { transform: translate3d(-7vmax, -5vmax, 0) scale(0.9); }
        }
        @keyframes sell-float-3 {
          from { transform: translate3d(0, 0, 0) scale(0.9); }
          to { transform: translate3d(6vmax, -4vmax, 0) scale(1.2); }
        }
        @keyframes sell-grid-move {
          from { background-position: 0 0, 0 0; }
          to { background-position: 0 64px, 64px 0; }
        }

        .sell-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* Логотип нарисован на чёрном фоне: screen убирает чёрный квадрат */
        .sell-logo {
          width: clamp(140px, 34vw, 220px);
          height: auto;
          mix-blend-mode: screen;
          user-select: none;
          animation: sell-logo-pulse 6s ease-in-out infinite;
        }

        @keyframes sell-logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(232,255,90,0)); }
          50% { filter: drop-shadow(0 0 28px rgba(232,255,90,0.35)); }
        }

        .sell-wordmark {
          margin-top: 10px;
          font-size: clamp(22px, 5vw, 30px);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #f5f5f5;
          text-transform: lowercase;
        }

        .sell-tagline {
          margin: 10px 0 30px;
          font-size: clamp(20px, 4.4vw, 28px);
          font-weight: 700;
          font-style: italic;
          letter-spacing: -0.02em;
          color: #e8ff5a;
          line-height: 1.15;
        }

        .sell-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sell-input {
          width: 100%;
          padding: 15px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #f5f5f5;
          font-size: 15px;
          outline: none;
          font-family: inherit;
          text-align: center;
          backdrop-filter: blur(8px);
          transition: border-color 0.2s, background 0.2s;
        }

        .sell-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .sell-input:focus {
          border-color: rgba(232, 255, 90, 0.55);
          background: rgba(232, 255, 90, 0.06);
        }

        .sell-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255, 77, 77, 0.1);
          border: 1px solid rgba(255, 77, 77, 0.3);
          color: #ff6b6b;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sell-submit {
          margin-top: 4px;
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
          gap: 10px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .sell-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(232, 255, 90, 0.25);
        }

        .sell-submit:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .sell-hint {
          margin-top: 22px;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.4);
        }

        .sell-hint a {
          color: rgba(232, 255, 90, 0.85);
          text-decoration: none;
          border-bottom: 1px solid rgba(232, 255, 90, 0.3);
        }

        @media (max-width: 480px) {
          .sell-screen { padding: 24px 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sell-glow,
          .sell-grid,
          .sell-logo {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SellPage;
