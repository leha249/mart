import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONTACTS } from '../utils/constants';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * /sell — вход для продавцов.
 *
 * Экран разделён пополам: слева знак и слоган, справа минималистичная
 * форма. Ни хедера, ни футера. Фон — едва заметное движение света.
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
    <div className="lg">
      {/* Минималистичный анимированный фон */}
      <div className="lg-bg" aria-hidden="true">
        <div className="lg-halo lg-halo-1" />
        <div className="lg-halo lg-halo-2" />
        <div className="lg-lines" />
      </div>

      {/* Левая половина: знак + текст */}
      <section className="lg-left">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg-brand"
        >
          <img src="/mora-logo.png" alt="MØRA MART" className="lg-mark" draggable={false} />
          <div className="lg-word">mora.mart</div>
          <h1 className="lg-tag serif">Продавать теперь легче</h1>
        </motion.div>
      </section>

      {/* Правая половина: вход */}
      <section className="lg-right">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg-form"
        >
          <div className="lg-eyebrow">Вход для продавцов</div>

          <label className="lg-field">
            <span className="lg-label">Email или телефон</span>
            <input
              type="text"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@shop.ru"
              autoComplete="username"
              maxLength={80}
            />
          </label>

          <label className="lg-field">
            <span className="lg-label">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="lg-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="lg-submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="lg-spin" /> Входим…
              </>
            ) : (
              <>
                Войти <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="lg-note">
            Нет доступа?{' '}
            <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer">
              Напишите менеджеру
            </a>
          </div>
        </motion.form>
      </section>

      <style>{`
        @keyframes lg-spin-kf { to { transform: rotate(360deg); } }
        @keyframes lg-halo-a {
          0%   { transform: translate3d(-6%, -4%, 0) scale(1); opacity: .55; }
          50%  { transform: translate3d(4%, 6%, 0) scale(1.12); opacity: .8; }
          100% { transform: translate3d(-2%, 2%, 0) scale(1.04); opacity: .6; }
        }
        @keyframes lg-halo-b {
          0%   { transform: translate3d(4%, 5%, 0) scale(1.05); opacity: .35; }
          50%  { transform: translate3d(-5%, -3%, 0) scale(.95); opacity: .55; }
          100% { transform: translate3d(2%, -6%, 0) scale(1.08); opacity: .4; }
        }
        @keyframes lg-lines-drift {
          from { background-position: 0 0; }
          to   { background-position: 0 96px; }
        }

        .lg {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #050505;
          color: #f5f5f5;
          font-family: Inter, system-ui, sans-serif;
          overflow: hidden;
        }

        /* ---- фон ---- */
        .lg-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .lg-halo {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          will-change: transform, opacity;
        }
        .lg-halo-1 {
          width: 52vmax; height: 52vmax;
          top: -20vmax; left: -22vmax;
          background: radial-gradient(circle, rgba(232,255,90,.22) 0%, transparent 66%);
          animation: lg-halo-a 24s ease-in-out infinite;
        }
        .lg-halo-2 {
          width: 40vmax; height: 40vmax;
          bottom: -18vmax; right: -14vmax;
          background: radial-gradient(circle, rgba(232,255,90,.12) 0%, transparent 70%);
          animation: lg-halo-b 30s ease-in-out infinite;
        }
        .lg-lines {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            180deg,
            rgba(255,255,255,.028) 0px,
            rgba(255,255,255,.028) 1px,
            transparent 1px,
            transparent 96px
          );
          mask-image: linear-gradient(180deg, #000 0%, transparent 78%);
          -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 78%);
          animation: lg-lines-drift 22s linear infinite;
        }

        /* ---- левая половина ---- */
        .lg-left {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          padding: clamp(32px, 5vw, 88px);
          border-right: 1px solid rgba(255,255,255,.06);
        }

        .lg-brand { display: flex; flex-direction: column; align-items: flex-start; }

        .lg-mark {
          width: clamp(150px, 24vw, 320px);
          height: auto;
          user-select: none;
          filter: drop-shadow(0 0 60px rgba(232,255,90,.12));
        }

        .lg-word {
          margin-top: clamp(18px, 2.4vw, 30px);
          font-size: clamp(34px, 5.2vw, 72px);
          font-weight: 800;
          letter-spacing: -.055em;
          line-height: .95;
        }

        .lg-tag {
          margin: clamp(12px, 1.6vw, 20px) 0 0;
          font-size: clamp(19px, 2.1vw, 28px);
          font-weight: 700;
          font-style: italic;
          letter-spacing: -.03em;
          line-height: 1.15;
          color: #e8ff5a;
          max-width: 22ch;
        }

        @media (min-width: 901px) {
          .lg-tag { white-space: nowrap; max-width: none; }
        }

        /* ---- правая половина ---- */
        .lg-right {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(32px, 5vw, 88px);
        }

        .lg-form {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .lg-eyebrow {
          font-size: 11.5px;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: rgba(255,255,255,.4);
        }

        .lg-field { display: flex; flex-direction: column; gap: 8px; }

        .lg-label {
          font-size: 11.5px;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.38);
        }

        .lg-field input {
          width: 100%;
          padding: 10px 2px 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,.16);
          color: #f5f5f5;
          font-size: 16px;
          font-family: inherit;
          outline: none;
          transition: border-color .25s, color .25s;
        }

        .lg-field input::placeholder { color: rgba(255,255,255,.22); }

        .lg-field input:focus { border-bottom-color: #e8ff5a; }

        .lg-error {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 12.5px;
          line-height: 1.5;
          color: #ff7a7a;
        }

        .lg-submit {
          margin-top: 6px;
          width: 100%;
          padding: 15px;
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
          transition: transform .18s, box-shadow .18s, opacity .18s;
        }

        .lg-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(232,255,90,.22);
        }
        .lg-submit:disabled { opacity: .65; cursor: wait; }

        .lg-spin { animation: lg-spin-kf 1s linear infinite; }

        .lg-note { font-size: 12px; color: rgba(255,255,255,.4); }
        .lg-note a {
          color: rgba(232,255,90,.9);
          text-decoration: none;
          border-bottom: 1px solid rgba(232,255,90,.35);
        }

        /* ---- адаптив ---- */
        @media (max-width: 900px) {
          .lg {
            grid-template-columns: 1fr;
            grid-auto-rows: min-content;
            align-content: start;
          }
          .lg-left {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,.06);
            padding: 28px 22px 24px;
            justify-content: flex-start;
          }
          .lg-mark { width: clamp(92px, 24vw, 128px); }
          .lg-word { font-size: clamp(28px, 7.6vw, 40px); margin-top: 12px; }
          .lg-tag { font-size: clamp(17px, 4.4vw, 22px); margin-top: 8px; }
          .lg-right { align-items: flex-start; padding: 26px 22px 40px; }
          .lg-form { max-width: none; gap: 18px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lg-halo, .lg-lines { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SellPage;
