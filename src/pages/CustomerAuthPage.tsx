import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { useCustomer } from '../context/CustomerContext';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';

type Mode = 'login' | 'register';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px 16px 15px 44px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
};

/** Куда вернуться после входа: «cart» — назад к оформлению заказа. */
const readNext = (): string => {
  try {
    return new URLSearchParams(window.location.search).get('next') ?? '';
  } catch {
    return '';
  }
};

const CustomerAuthPage = () => {
  const { register, login, isAuthenticated } = useCustomer();

  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({ title: 'Вход и регистрация — MØRA MART', noindex: true });

  // Запоминаем «куда вернуться» один раз: после редиректа query уже пустой.
  const [next] = useState(readNext);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (next === 'cart') {
      navigate('/?cart=1');
      return;
    }
    navigate(next || '/account');
  };

  useEffect(() => {
    if (isAuthenticated) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await login(phone);
      if (!res.success) {
        setError(res.error || 'Не удалось войти');
        // Профиля нет — сразу предлагаем зарегистрироваться.
        if ((res.error ?? '').includes('не найден')) setMode('register');
        return;
      }
      finish();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!agreed) {
      setError('Необходимо согласие на обработку данных');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await register({ firstName, lastName, phone, email });
      if (!res.success) {
        setError(res.error || 'Не удалось создать профиль');
        return;
      }
      finish();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 480 }}>
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

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 900,
                letterSpacing: '-1px',
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              {mode === 'login' ? 'Вход' : 'Регистрация'}{' '}
              <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                покупателя
              </span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              {next === 'cart'
                ? 'Войдите или зарегистрируйтесь — и сразу вернётесь к оформлению заказа.'
                : 'Войдите, чтобы видеть свои заказы, чаты с продавцами и статусы доставки.'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 4,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 100,
              marginBottom: 18,
            }}
          >
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 100,
                  border: 'none',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#000' : 'var(--muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={mode === 'login' ? handleLogin : handleRegister}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {mode === 'register' && (
              <>
                <label style={labelStyle}>Имя</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="var(--muted)"
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Иван"
                    maxLength={60}
                    style={inputStyle}
                  />
                </div>

                <label style={labelStyle}>Фамилия</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="var(--muted)"
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Иванов"
                    maxLength={60}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            <label style={labelStyle}>Телефон</label>
            <div style={{ position: 'relative' }}>
              <Phone
                size={16}
                color="var(--muted)"
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="+7 900 000-00-00"
                maxLength={20}
                style={inputStyle}
              />
            </div>

            {mode === 'register' && (
              <>
                <label style={labelStyle}>Email (необязательно)</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    color="var(--muted)"
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={200}
                    style={inputStyle}
                  />
                </div>

                <label
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{
                      marginTop: 2,
                      width: 16,
                      height: 16,
                      accentColor: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    Даю согласие на{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}
                    >
                      обработку персональных данных
                    </a>{' '}
                    в соответствии с 152-ФЗ.
                  </span>
                </label>
              </>
            )}

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
              disabled={submitting || !phone.trim() || (mode === 'register' && !agreed)}
              style={{
                marginTop: 4,
                padding: '16px',
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
                opacity:
                  submitting || !phone.trim() || (mode === 'register' && !agreed)
                    ? 0.6
                    : 1,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {mode === 'login' ? 'Входим…' : 'Создаём профиль…'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Войти' : 'Создать профиль'}{' '}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div
              style={{
                fontSize: 11.5,
                color: 'var(--muted)',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              {mode === 'login'
                ? 'Нет профиля? Переключитесь на «Регистрация» — это займёт полминуты.'
                : 'Уже покупали? Переключитесь на «Вход».'}
            </div>
          </motion.form>

          <div
            style={{
              marginTop: 18,
              padding: 16,
              border: '1px dashed var(--border)',
              borderRadius: 14,
              fontSize: 12.5,
              color: 'var(--muted)',
              lineHeight: 1.6,
            }}
          >
            Продаёте одежду и хотите магазин на MØRA MART?{' '}
            <a
              href="/sell"
              onClick={(e) => {
                e.preventDefault();
                navigate('/sell');
              }}
              style={{ color: 'var(--accent)' }}
            >
              Вход для продавцов
            </a>
          </div>
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

export default CustomerAuthPage;
