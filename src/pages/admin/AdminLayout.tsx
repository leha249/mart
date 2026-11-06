import type { ReactNode } from 'react';
import { ArrowLeft, LogOut, Loader2, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useReviews } from '../../context/ReviewsContext';
import AdminTabs from '../../components/admin/AdminTabs';
import type { AdminTab } from '../../components/admin/AdminTabs';
import { useToast } from '../../context/ToastContext';
import { navigate } from '../../utils/navigate';

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
  messagesBadge?: number;
}

const AdminLayout = ({
  activeTab,
  onTabChange,
  children,
  messagesBadge = 0,
}: Props) => {
  const { user, loading: authLoading, signOut, role } = useAuth();
  const { newOrdersCount, markAllSeen } = useOrders();
  const { pendingCount: reviewsPendingCount } = useReviews();
  const { addToast } = useToast();

  const isPending = role === 'pending';
  const headerLabel = isPending
    ? 'Аккаунт на модерации'
    : role === 'seller'
    ? 'Кабинет продавца'
    : 'Админ-панель';

  const handleTabChange = (tab: AdminTab) => {
    onTabChange(tab);
    if (tab === 'orders') {
      setTimeout(markAllSeen, 500);
    }
  };

  const handleSignOut = async () => {
    const ok = window.confirm('Выйти из аккаунта?');
    if (!ok) return;
    try {
      localStorage.removeItem('mora-cart-v1');
      localStorage.removeItem('mora-favorites-v1');
      localStorage.removeItem('mora-promo-v1');
      localStorage.removeItem('mora-recently-viewed-v1');
      localStorage.removeItem('mora-search-history-v1');

      await signOut();
      addToast('Вы вышли из аккаунта', 'info');
      navigate('/');
    } catch (e) {
      addToast('Ошибка выхода', 'error');
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
        }}
      >
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* БАННЕР ДЛЯ PENDING */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 24,
              padding: '20px 24px',
              background: 'rgba(232,255,90,0.08)',
              border: '1px solid rgba(232,255,90,0.3)',
              borderRadius: 16,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                flexShrink: 0,
              }}
            >
              <Clock size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 6,
                  color: 'var(--accent)',
                }}
              >
                Аккаунт на модерации
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'var(--text-dim)',
                  lineHeight: 1.6,
                }}
              >
                Мы проверим вашу заявку в течение 24 часов и свяжемся по email.
                Пока вы можете <strong>только смотреть</strong> свой кабинет —
                добавлять товары, редактировать профиль и принимать заказы
                станет доступно после активации. Плата за размещение — 10% с
                суммы заказа, без абонентской платы.
              </div>
            </div>
          </motion.div>
        )}

        {/* ПРЕДУПРЕЖДЕНИЕ О READONLY */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginBottom: 16,
              padding: '10px 16px',
              background: 'rgba(255,77,77,0.06)',
              border: '1px solid rgba(255,77,77,0.2)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShieldAlert size={14} />
            Действия недоступны — аккаунт ожидает активации
          </motion.div>
        )}

        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {headerLabel}
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: '-1px',
                display: 'inline-flex',
                alignItems: 'baseline',
              }}
            >
              MØRA
              <span
                style={{
                  color: 'var(--accent)',
                  display: 'inline-block',
                }}
              >
                .
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: '3px',
                  color: 'var(--muted)',
                  marginLeft: 6,
                  textTransform: 'uppercase',
                }}
              >
                MART
              </span>
            </h1>
            {user.email && (
              <div
                style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}
              >
                {user.email}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="/"
              style={{
                padding: '12px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ArrowLeft size={16} /> На сайт
            </a>

            <button
              onClick={handleSignOut}
              style={{
                padding: '12px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        </div>

        <AdminTabs
          active={activeTab}
          onChange={handleTabChange}
          ordersBadge={newOrdersCount}
          reviewsBadge={reviewsPendingCount}
          messagesBadge={messagesBadge}
          role={isPending ? 'seller' : role}
        />

        {/* Контент — обёрнут в fieldset для блокировки взаимодействия */}
        {isPending ? (
          <fieldset
            disabled
            style={{
              border: 'none',
              padding: 0,
              margin: 0,
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          >
            {children}
          </fieldset>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default AdminLayout;