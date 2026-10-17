import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LogIn,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, loading } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    document.title = 'Вход — MØRA MART';
    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  // Показ сообщения о блокировке / удалении аккаунта
  useEffect(() => {
    const authError = sessionStorage.getItem('mora-auth-error');
    if (authError) {
      sessionStorage.removeItem('mora-auth-error');
      if (authError === 'blocked') {
        setError('Ваш аккаунт заблокирован. Обратитесь к администратору.');
      } else if (authError === 'no-role') {
        setError(
          'Аккаунт не найден или был удалён. Обратитесь к администратору.'
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Заполните все поля');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await signIn(trimmedEmail, password);
      addToast('Добро пожаловать!', 'success');
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message.includes('Invalid login credentials')
            ? 'Неверный email или пароль'
            : e.message
          : 'Ошибка входа';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(232,255,90,0.1), transparent 70%)',
          top: '-20%',
          right: '-10%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(200,224,61,0.12), transparent 70%)',
          bottom: '-15%',
          left: '-15%',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      <button
        onClick={goHome}
        aria-label="На главную"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'inherit',
          padding: 8,
          zIndex: 2,
        }}
      >
        <ArrowLeft size={14} /> На сайт
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          padding: 40,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: '-1px',
              marginBottom: 8,
              display: 'inline-flex',
              alignItems: 'baseline',
            }}
          >
            MØRA
            <span style={{ color: 'var(--accent)', position: 'relative' }}>
              .
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: '3px',
                color: 'var(--muted)',
                marginLeft: 4,
                textTransform: 'uppercase',
              }}
            >
              MART
            </span>
          </motion.div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Админ-панель
          </div>
        </div>

        <h1
          className="serif"
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Вход в систему
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Только для администраторов и продавцов
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="admin@moramart.ru"
              autoComplete="email"
              autoFocus
              disabled={submitting}
              style={{
                padding: '14px 16px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 16px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
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
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            disabled={submitting}
            style={{
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
              marginTop: 8,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                Вход...
              </>
            ) : (
              <>
                <LogIn size={16} /> Войти
              </>
            )}
          </motion.button>
        </form>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </div>
  );
};

export default Login;