import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { navigate } from '../utils/navigate';

const STORAGE_KEY = 'mora-cookie-consent-v1';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  // На полноэкранной странице входа продавца баннер перекрывает форму.
  const hidden = location.pathname === '/sell';

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accepted: true,
          date: new Date().toISOString(),
        })
      );
    } catch {}
    setVisible(false);
  };

  /** Отказ: оставляем только технически необходимые (cookies/localStorage),
   *  ничего аналитического у нас и так нет — просто не показываем баннер. */
  const handleReject = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accepted: false,
          necessaryOnly: true,
          date: new Date().toISOString(),
        })
      );
    } catch {}
    setVisible(false);
  };

  const goToPolicy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/privacy');
  };

  if (hidden) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            right: 24,
            maxWidth: 480,
            zIndex: 90,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 24,
            boxShadow: 'var(--shadow-lg)',
          }}
          className="cookie-banner"
        >
          <button
            onClick={() => setVisible(false)}
            aria-label="Закрыть"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>

          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(232,255,90,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              <Cookie size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Cookies и данные
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                }}
              >
                Сайт использует cookies и localStorage для работы корзины,
                избранного и темы. Данные хранятся на серверах Supabase
                (трансграничная передача). Продолжая, вы соглашаетесь с{' '}
                <a
                  href="/privacy"
                  onClick={goToPolicy}
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'underline',
                  }}
                >
                  политикой конфиденциальности
                </a>
                .
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleAccept}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 20px',
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
              Принять
            </button>
            <button
              onClick={handleReject}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Только необходимое
            </button>
            <a
              href="/privacy"
              onClick={goToPolicy}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              Подробнее
            </a>
          </div>
        </motion.div>
      )}

      <style key="cookie-banner-styles">{`
        @media (max-width: 600px) {
          .cookie-banner {
            left: 12px !important;
            right: 12px !important;
            bottom: 12px !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default CookieBanner;