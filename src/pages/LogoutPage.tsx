import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCustomer } from '../context/CustomerContext';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * /logout — «аварийный выход».
 *
 * Нужен, когда кнопка «Выйти» в кабинете недоступна (например, кабинет
 * не открывается или вкладка сломалась): достаточно набрать адрес
 * в браузере, сессия сбрасывается и человек уходит на главную.
 *
 * Гасит ОБЕ сессии: продавца/админа (Supabase Auth) и покупателя
 * (localStorage mora-customer-session-v1).
 */
const LogoutPage = () => {
  const { signOut } = useAuth();
  const { signOut: signOutCustomer } = useCustomer();
  const [failed, setFailed] = useState(false);

  usePageMeta({ title: 'Выход — MØRA MART', noindex: true });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Покупательская сессия живёт отдельно от Supabase Auth.
        // Удаляем ключ синхронно: эффект CustomerContext может не успеть
        // сработать до window.location.replace и сессия остаётся.
        try {
          localStorage.removeItem('mora-customer-session-v1');
        } catch {
          // приватный режим — не критично
        }
        signOutCustomer();
        await signOut();
      } catch (e) {
        console.error('[LogoutPage] signOut:', e);
        if (!cancelled) setFailed(true);
        return;
      }
      if (!cancelled) window.location.replace('/');
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [signOut, signOutCustomer]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <main
        style={{
          paddingTop: 160,
          paddingBottom: 160,
          textAlign: 'center',
          minHeight: '60vh',
        }}
      >
        <div className="container" style={{ maxWidth: 480 }}>
          <h1 className="serif" style={{ fontSize: 32, marginBottom: 16 }}>
            {failed ? 'Не удалось выйти' : 'Выходим из аккаунта…'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
            {failed
              ? 'Закройте вкладку и откройте сайт заново, либо очистите данные сайта в настройках браузера.'
              : 'Сессия сбрасывается, сейчас вернём на главную.'}
          </p>
          {failed && (
            <button
              onClick={() => window.location.replace('/')}
              style={{
                marginTop: 24,
                padding: '14px 28px',
                borderRadius: 100,
                border: 'none',
                background: 'var(--accent)',
                color: '#000',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              На главную
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LogoutPage;
