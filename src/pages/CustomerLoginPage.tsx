import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  KeyRound,
  Loader2,
  AlertCircle,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import ToastContainer from '../components/ToastContainer';
import { useCustomer } from '../context/CustomerContext';

type Step = 'phone' | 'code';

const CustomerLoginPage = () => {
  const { requestCode, verifyCode, isAuthenticated } = useCustomer();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [displayedCode, setDisplayedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Вход — MØRA MART';
    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  // Если уже вошёл — редирект в кабинет
  useEffect(() => {
    if (isAuthenticated) {
      window.history.pushState({}, '', '/account');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [isAuthenticated]);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Введите номер телефона');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await requestCode(trimmed);

    if (result.success && result.code) {
      setDisplayedCode(result.code);
      setStep('code');
      setTimeout(() => codeInputRef.current?.focus(), 200);
    } else {
      setError(result.error || 'Не удалось получить код');
    }

    setSubmitting(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmed = code.trim();
    if (trimmed.length !== 4) {
      setError('Код должен содержать 4 цифры');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await verifyCode(phone, trimmed);

    if (result.success) {
      window.history.pushState({}, '', '/account');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      setError(result.error || 'Неверный код');
    }

    setSubmitting(false);
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setCode('');
    setDisplayedCode(null);
    setError(null);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 480 }}>
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
                <ShieldCheck size={28} />
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
                {step === 'phone' ? (
                  <>
                    Вход в{' '}
                    <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                      кабинет
                    </span>
                  </>
                ) : (
                  <>
                    Введите{' '}
                    <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
                      код
                    </span>
                  </>
                )}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                  maxWidth: 360,
                  margin: '0 auto',
                }}
              >
                {step === 'phone'
                  ? 'Введите номер телефона, который указывали при оформлении заказа'
                  : `Мы отправили код на ${phone}. Введите 4 цифры.`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRequestCode}
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
                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Номер телефона
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={16}
                      color="var(--muted)"
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="+7 900 000-00-00"
                      autoFocus
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 44px',
                        background: 'var(--bg)',
                        border: error
                          ? '1px solid var(--danger)'
                          : '1px solid var(--border)',
                        borderRadius: 12,
                        color: 'var(--text)',
                        fontSize: 16,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

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

                  <motion.button
                    type="submit"
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    disabled={submitting || !phone.trim()}
                    style={{
                      padding: '16px',
                      borderRadius: 100,
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor:
                        submitting || !phone.trim()
                          ? 'not-allowed'
                          : 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      marginTop: 8,
                      opacity: submitting || !phone.trim() ? 0.6 : 1,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={16}
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        Отправка...
                      </>
                    ) : (
                      <>
                        Получить код <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      textAlign: 'center',
                      lineHeight: 1.6,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    Продолжая, вы соглашаетесь с{' '}
                    <a
                      href="/privacy"
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'underline',
                      }}
                    >
                      политикой конфиденциальности
                    </a>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="code-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyCode}
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
                  {/* Тестовый код */}
                  {displayedCode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(232,255,90,0.08)',
                        border: '1px solid rgba(232,255,90,0.3)',
                        borderRadius: 12,
                        fontSize: 13,
                        lineHeight: 1.5,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--muted)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          marginBottom: 6,
                        }}
                      >
                        Ваш код (тестовый режим)
                      </div>
                      <div
                        className="price-num"
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          letterSpacing: 8,
                          color: 'var(--accent)',
                        }}
                      >
                        {displayedCode}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--muted)',
                          marginTop: 6,
                        }}
                      >
                        Код действует 10 минут
                      </div>
                    </motion.div>
                  )}

                  <label
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Код из сообщения
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={16}
                      color="var(--muted)"
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      ref={codeInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={code}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        setCode(v);
                        if (error) setError(null);
                      }}
                      placeholder="0000"
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 44px',
                        background: 'var(--bg)',
                        border: error
                          ? '1px solid var(--danger)'
                          : '1px solid var(--border)',
                        borderRadius: 12,
                        color: 'var(--text)',
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: 8,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

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

                  <motion.button
                    type="submit"
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    disabled={submitting || code.length !== 4}
                    style={{
                      padding: '16px',
                      borderRadius: 100,
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor:
                        submitting || code.length !== 4
                          ? 'not-allowed'
                          : 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      marginTop: 8,
                      opacity: submitting || code.length !== 4 ? 0.6 : 1,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={16}
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        Проверка...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Войти
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    disabled={submitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      padding: '8px',
                      textDecoration: 'underline',
                    }}
                  >
                    ← Изменить номер
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <Footer />
      <ToastContainer />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CustomerLoginPage;