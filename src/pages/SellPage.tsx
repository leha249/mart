import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONTACTS } from '../utils/constants';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import DotGrid from '../components/DotGrid';

/**
 * /sell — вход для продавцов.
 *
 * Слева знак и слоган, справа форма входа. Под кнопкой — заявка
 * и Telegram менеджера. Фон — сетка точек, которая тянется за курсором.
 */
const SellPage = () => {
  const { signIn } = useAuth();
  const { addToast } = useToast();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: 'mora.mart — вход для продавцов',
    description: 'Кабинет продавца MØRA MART. Комиссия 4% с заказа.',
    noindex: true,
  });

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
      await signIn(login, password);
      addToast('Добро пожаловать в кабинет', 'success');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (resetting) return;

    const value = login.trim();
    if (!value.includes('@')) {
      setError(
        'Введите email в поле выше — пришлём ссылку для сброса пароля'
      );
      return;
    }

    setResetting(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        value
      );
      if (resetError) throw resetError;
      addToast('Письмо со ссылкой для сброса отправлено', 'success');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось отправить письмо'
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="lg">
      {/* Левая половина: знак + текст. Точки живут только здесь. */}
      <section className="lg-left">
        <DotGrid className="lg-dots" />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg-brand"
        >
          <img
            src="/mora-logo.png"
            alt="MØRA MART"
            className="lg-mark"
            draggable={false}
          />
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

          <button
            type="button"
            onClick={handleForgot}
            className="lg-forgot"
            disabled={resetting}
          >
            {resetting ? 'Отправляем…' : 'Забыли пароль?'}
          </button>

          <div className="lg-actions">
            <div className="lg-actions-title">Начать продавать</div>
            <div className="lg-actions-sub">
              4% с заказа · без подписки · свой мини-магазин
            </div>
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

        /* ---- левая половина ---- */
        .lg-left {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          padding: clamp(32px, 5vw, 88px);
          overflow: hidden;
        }

        .lg-brand {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .lg-mark {
          width: clamp(150px, 22vw, 300px);
          height: auto;
          user-select: none;
          filter: drop-shadow(0 0 70px rgba(232,255,90,.10));
        }

        .lg-word {
          margin-top: clamp(16px, 2.2vw, 28px);
          font-size: clamp(34px, 4.8vw, 66px);
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

        .lg-forgot {
          align-self: center;
          margin-top: 4px;
          background: none;
          border: none;
          color: rgba(255,255,255,.55);
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          padding: 6px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .lg-forgot:hover { color: #e8ff5a; }

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

        .lg-actions-sub {
          font-size: 12px;
          color: rgba(255,255,255,.4);
          line-height: 1.5;
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
