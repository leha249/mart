import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONTACTS } from '../utils/constants';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import DotGrid from '../components/DotGrid';
import SellerPanelPreview from '../components/SellerPanelPreview';

/**
 * /sell — вход для продавцов.
 *
 * Слева знак и слоган, справа форма входа. Под кнопкой — заявка
 * и Telegram менеджера. Фон — сетка точек, которая тянется за курсором.
 */
const SellPage = () => {
  const { signIn, user, role, loading } = useAuth();
  const { addToast } = useToast();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: 'mora.mart — вход для продавцов',
    description: 'Кабинет продавца MØRA MART. Комиссия 4% с заказа.',
    noindex: true,
  });

  // Уже вошли (например, обновили страницу или вернулись из кабинета) —
  // не держим на форме входа, а сразу уводим в кабинет.
  useEffect(() => {
    if (loading || !user) return;
    if (role === 'admin' || role === 'seller' || role === 'pending') {
      navigate('/admin');
    }
  }, [loading, user, role]);

  const canSubmit = login.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!canSubmit) {
      setError('Введите логин и пароль');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const resolved = await signIn(login, password);

      // Пароль верный, но аккаунт не привязан к магазину: AuthContext
      // уже разлогинил. Раньше здесь показывалось «Добро пожаловать»,
      // а гард /admin молча возвращал на форму.
      if (resolved === 'guest') {
        setError(
          'Пароль верный, но аккаунт не привязан к магазину. Для продавцов MØRA MART аккаунт создаёт владелец платформы: напишите менеджеру в Telegram.'
        );
        return;
      }

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
      {/* Левая половина: знак + текст. Точки живут только здесь. */}
      <section className="lg-left">
        <DotGrid className="lg-dots" />

        {/* Декоративные слои: мягкое свечение и тонкое кольцо за знаком */}
        <div className="lg-aura" aria-hidden="true" />

        {/* Превью кабинета продавца — под наклоном, справа от знака */}
        <div className="lg-mock" aria-hidden="true">
          <SellerPanelPreview />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg-brand"
        >
          <div className="lg-logo">
            <img
              src="/mora-logo.png"
              alt="MØRA MART"
              className="lg-mark"
              draggable={false}
            />
            <span className="lg-ring" aria-hidden="true" />
          </div>
          <div className="lg-word">mora.mart</div>
          <h1 className="lg-tag serif">Продавать теперь легче</h1>
          <div className="lg-rule" aria-hidden="true" />
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
          <h2 className="lg-title">Войти</h2>

          <input
            type="text"
            value={login}
            onChange={(e) => {
              setLogin(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Номер телефона или почта"
            autoComplete="username"
            maxLength={80}
            className="lg-input"
            aria-label="Номер телефона или почта"
          />

          <div className="lg-pass">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Введите пароль"
              autoComplete="current-password"
              className="lg-input lg-input-pass"
              aria-label="Пароль"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="lg-eye"
              aria-label={showPass ? 'Скрыть пароль' : 'Показать пароль'}
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="lg-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="lg-submit"
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="lg-spin" /> Проверяем…
              </>
            ) : (
              <>
                Продолжить <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="lg-actions">
            <div className="lg-actions-title">Начать продавать</div>
            <a
              className="lg-telegram-btn"
              href={CONTACTS.telegram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Оставить заявку
              <Send size={16} />
            </a>
          </div>
        </motion.form>
      </section>

      <style>{`
        @keyframes lg-spin-kf { to { transform: rotate(360deg); } }

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

        .lg-dots {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          z-index: 0;
          pointer-events: none;
          /* мягко растворяем сетку к правому краю, чтобы не было обрыва */
          mask-image: linear-gradient(90deg, #000 0%, #000 58%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 58%, transparent 100%);
        }

        /* Тонкий разделитель между половинами, растворяется к краям */
        .lg::before {
          content: '';
          position: absolute;
          z-index: 1;
          left: 50%;
          top: 12%;
          bottom: 12%;
          width: 1px;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(255,255,255,.10) 25%,
            rgba(255,255,255,.10) 75%,
            transparent
          );
          pointer-events: none;
        }

        /* ---- левая половина ---- */
        .lg-left {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          padding: clamp(32px, 5vw, 88px);
          /* превью кабинета выходит за границу половины */
          overflow: visible;
        }

        .lg-brand {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          /* ближе к превью кабинета справа */
          margin-left: clamp(0px, 2.4vw, 40px);
        }

        /* Превью кабинета: наклонено и уходит за правый край половины */
        .lg-mock {
          position: absolute;
          z-index: 1;
          right: -20%;
          top: 47%;
          width: min(560px, 78%);
          /* без scale: размер задаётся реальными пикселями, поэтому текст резкий */
          transform: translateY(-50%) perspective(1500px) rotateY(-14deg)
            rotateX(4deg) rotate(-2.5deg);
          transform-origin: right center;
          opacity: .95;
          pointer-events: none;
          backface-visibility: hidden;
        }

        .lg-mark {
          position: relative;
          z-index: 1;
          width: clamp(140px, 15vw, 230px);
          height: auto;
          user-select: none;
          filter: drop-shadow(0 0 70px rgba(232,255,90,.10));
        }

        .lg-logo { position: relative; z-index: 3; display: inline-flex; }

        /* Тонкое кольцо вокруг знака */
        .lg-ring {
          position: absolute;
          z-index: 0;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 152%;
          aspect-ratio: 1;
          border-radius: 50%;
          border: 1px solid rgba(232,255,90,.10);
          box-shadow: inset 0 0 120px rgba(232,255,90,.05);
          pointer-events: none;
        }

        .lg-ring::after {
          content: '';
          position: absolute;
          inset: 8%;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.045);
        }

        .lg-word {
          margin-top: clamp(16px, 2.2vw, 28px);
          font-size: clamp(30px, 3.6vw, 52px);
          font-weight: 800;
          letter-spacing: -.055em;
          line-height: .95;
        }

        .lg-tag {
          margin: clamp(12px, 1.6vw, 20px) 0 0;
          font-size: clamp(16px, 1.7vw, 22px);
          font-weight: 700;
          font-style: italic;
          letter-spacing: -.03em;
          line-height: 1.15;
          color: #e8ff5a;
          max-width: 22ch;
        }

        /* Тонкая акцентная черта под слоганом */
        .lg-rule {
          margin-top: clamp(20px, 2.6vw, 32px);
          width: 72px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #e8ff5a, rgba(232,255,90,0));
        }

        /* Свечение за знаком */
        .lg-aura {
          position: absolute;
          z-index: 0;
          width: 68%;
          aspect-ratio: 1;
          left: -14%;
          top: 4%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,255,90,.13) 0%, transparent 62%);
          filter: blur(60px);
          pointer-events: none;
        }

        @media (min-width: 901px) {
          .lg-tag { white-space: nowrap; max-width: none; }
        }
        @media (max-width: 1400px) {
          .lg-mock { width: min(500px, 74%); right: -12%; }
        }

        @media (max-width: 1150px) {
          .lg-mock { width: min(430px, 70%); right: -8%; }
        }

        /* ---- правая половина ---- */
        .lg-right {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(28px, 4vw, 64px);
        }

        .lg-form {
          width: 100%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .lg-title {
          margin: 0 0 14px;
          text-align: center;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -.03em;
          font-family: inherit;
        }

        .lg-input {
          width: 100%;
          padding: 16px 18px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.03);
          color: #f5f5f5;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }

        .lg-input::placeholder { color: rgba(255,255,255,.32); }

        .lg-input:focus {
          border-color: rgba(232,255,90,.65);
          background: rgba(232,255,90,.04);
          box-shadow: 0 0 0 1px rgba(232,255,90,.25);
        }

        .lg-pass { position: relative; }

        .lg-input-pass { padding-right: 48px; }

        .lg-eye {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border: none;
          background: none;
          color: rgba(255,255,255,.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .lg-eye:hover { color: rgba(255,255,255,.75); }

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
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: #e8ff5a;
          color: #000;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: transform .18s, box-shadow .18s, opacity .18s, background .18s;
        }

        .lg-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(232,255,90,.22);
        }

        .lg-submit:disabled {
          background: rgba(255,255,255,.08);
          color: rgba(255,255,255,.35);
          cursor: not-allowed;
        }

        .lg-spin { animation: lg-spin-kf 1s linear infinite; }

        .lg-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,.07);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lg-actions-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -.01em;
        }

        /* Кнопка заявки — в фирменном цвете Telegram */
        .lg-telegram-btn {
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 14px 18px;
          border-radius: 12px;
          border: none;
          background: #229ED9;
          color: #fff;
          font-size: 14.5px;
          font-weight: 700;
          font-family: inherit;
          text-decoration: none;
          transition: background .2s, transform .18s, box-shadow .18s;
        }

        .lg-telegram-btn:hover {
          background: #1e8fc4;
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(34,158,217,.35);
        }

        /* ---- адаптив ---- */
        @media (max-width: 900px) {
          .lg::before,
          .lg-ring,
          .lg-mock { display: none; }
          .lg {
            grid-template-columns: 1fr;
            grid-auto-rows: min-content;
            align-content: start;
          }
          .lg-left { padding: 28px 22px 22px; }
          .lg-mark { width: clamp(88px, 22vw, 120px); }
          .lg-word { font-size: clamp(28px, 7.6vw, 40px); margin-top: 12px; }
          .lg-tag { font-size: clamp(17px, 4.4vw, 22px); margin-top: 8px; }
          .lg-right { padding: 26px 22px 40px; align-items: flex-start; }
          .lg-form { max-width: none; }
          .lg-title { font-size: 28px; text-align: left; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lg-submit:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default SellPage;
