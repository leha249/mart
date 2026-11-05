import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Store,
  Check,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  Phone,
  User,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

const RegisterSellerPage = () => {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  usePageMeta({ title: 'Стать продавцом — MØRA MART' });

  const goHome = () => {
    navigate('/');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Введите ФИО';
    if (name.trim().length < 2) return 'ФИО слишком короткое';
    if (!phone.trim()) return 'Введите телефон';
    if (phone.replace(/\D/g, '').length < 10) return 'Некорректный телефон';
    if (!email.trim()) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Некорректный email';
    if (!password) return 'Введите пароль';
    if (password.length < 6) return 'Пароль минимум 6 символов';
    if (!agreed) return 'Необходимо согласие на обработку данных и принятие оферты';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: 'seller',
            name: name.trim(),
            phone: phone.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setSuccess(true);
        addToast(
          'Проверьте почту — мы отправили ссылку для подтверждения',
          'success'
        );
      } else {
        throw new Error('Не удалось создать аккаунт');
      }
    } catch (e) {
      console.error('[RegisterSellerPage]', e);
      let msg = 'Ошибка регистрации';
      if (e instanceof Error) {
        if (e.message.includes('already registered')) {
          msg = 'Этот email уже зарегистрирован. Войдите или восстановите пароль.';
        } else {
          msg = e.message;
        }
      }
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <ScrollProgress />
        <Cursor />
        <Navbar />

        <main style={{ paddingTop: 120, paddingBottom: 100 }}>
          <div className="container" style={{ maxWidth: 560 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: 48,
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#000',
                }}
              >
                <Check size={40} strokeWidth={3} />
              </motion.div>

              <h1
                className="serif"
                style={{
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  marginBottom: 16,
                }}
              >
                Проверьте почту
              </h1>

              <p
                style={{
                  fontSize: 15,
                  color: 'var(--muted)',
                  lineHeight: 1.7,
                  maxWidth: 400,
                  margin: '0 auto 32px',
                }}
              >
                Мы отправили ссылку для подтверждения на{' '}
                <strong style={{ color: 'var(--text)' }}>{email}</strong>.
                Перейдите по ней, чтобы активировать аккаунт. Письмо может
                попасть в «Спам» — проверьте папку.
              </p>

              <div
                style={{
                  padding: 16,
                  background: 'rgba(232,255,90,0.06)',
                  border: '1px solid rgba(232,255,90,0.2)',
                  borderRadius: 12,
                  fontSize: 13,
                  color: 'var(--text-dim)',
                  lineHeight: 1.6,
                  textAlign: 'left',
                  marginBottom: 24,
                }}
              >
                <strong style={{ color: 'var(--accent)' }}>
                  Что дальше:
                </strong>
                <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                  <li>Подтвердите email по ссылке</li>
                  <li>Войдите на сайт</li>
                  <li>
                    Дождитесь модерации (мы проверим заявку в течение 24 часов)
                  </li>
                  <li>После активации — оплатите подписку и начинайте продавать</li>
                </ol>
              </div>

              <button
                onClick={goToLogin}
                style={{
                  padding: '14px 28px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#000',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Перейти к входу
              </button>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 560 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={goHome}
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
                marginBottom: 32,
              }}
            >
              <ArrowLeft size={14} /> На главную
            </button>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(232,255,90,0.12)',
                  border: '1px solid rgba(232,255,90,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'var(--accent)',
                }}
              >
                <Store size={28} />
              </div>
              <h1
                className="serif"
                style={{
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  lineHeight: 1.1,
                  marginBottom: 12,
                }}
              >
                Стать{' '}
                <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                  продавцом
                </span>
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                  maxWidth: 400,
                  margin: '0 auto',
                }}
              >
                Зарегистрируйте магазин, дождитесь модерации и начните продавать
                на платформе MØRA MART.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <Field
                icon={User}
                label="ФИО *"
                value={name}
                onChange={setName}
                placeholder="Иван Иванович Иванов"
                disabled={submitting}
                autoFocus
              />

              <Field
                icon={Phone}
                label="Телефон *"
                value={phone}
                onChange={setPhone}
                placeholder="+7 900 000-00-00"
                type="tel"
                disabled={submitting}
              />

              <Field
                icon={Mail}
                label="Email *"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                disabled={submitting}
              />

              <Field
                icon={Lock}
                label="Пароль *"
                value={password}
                onChange={setPassword}
                placeholder="Минимум 6 символов"
                type="password"
                disabled={submitting}
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

              {/* ✅ ОБЯЗАТЕЛЬНЫЙ ЧЕКБОКС СОГЛАСИЯ */}
              <label
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  padding: '14px 16px',
                  background: agreed
                    ? 'rgba(74,222,128,0.06)'
                    : 'rgba(255,77,77,0.04)',
                  border: agreed
                    ? '1px solid rgba(74,222,128,0.3)'
                    : '1px solid rgba(255,77,77,0.2)',
                  borderRadius: 12,
                  fontSize: 12,
                  lineHeight: 1.6,
                  transition: 'all 0.2s',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (error) setError(null);
                  }}
                  disabled={submitting}
                  style={{
                    marginTop: 2,
                    width: 16,
                    height: 16,
                    accentColor: 'var(--accent)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--text-dim)' }}>
                  Я даю согласие на{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    обработку персональных данных
                  </a>{' '}
                  в соответствии с 152-ФЗ, принимаю{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    условия использования
                  </a>{' '}
                  и{' '}
                  <a
                    href="/seller-agreement"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    оферту для продавцов
                  </a>
                  .
                </span>
              </label>

              <motion.button
                type="submit"
                whileHover={{ scale: submitting || !agreed ? 1 : 1.02 }}
                whileTap={{ scale: submitting || !agreed ? 1 : 0.98 }}
                disabled={submitting || !agreed}
                style={{
                  padding: '16px',
                  borderRadius: 100,
                  border: !agreed ? '1px solid var(--border)' : 'none',
                  background: !agreed ? 'var(--surface-hi)' : 'var(--accent)',
                  color: !agreed ? 'var(--muted)' : '#000',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: submitting || !agreed ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  marginTop: 8,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Регистрация...
                  </>
                ) : !agreed ? (
                  'Примите условия'
                ) : (
                  'Зарегистрироваться'
                )}
              </motion.button>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  textAlign: 'center',
                }}
              >
                Уже есть аккаунт?{' '}
                <button
                  type="button"
                  onClick={goToLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Войти
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

interface FieldProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const Field = ({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  autoFocus,
}: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label
      style={{
        fontSize: 12,
        color: 'var(--muted)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <Icon
        size={16}
        color="var(--muted)"
        // @ts-ignore
        style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '14px 16px 14px 44px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  </div>
);

export default RegisterSellerPage;
