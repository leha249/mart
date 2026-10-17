import { ReactNode } from 'react';
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useReviews } from '../../context/ReviewsContext';
import AdminTabs from '../../components/admin/AdminTabs';
import type { AdminTab } from '../../components/admin/AdminTabs';
import { useToast } from '../../context/ToastContext';

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
}

const AdminLayout = ({ activeTab, onTabChange, children }: Props) => {
  const { user, loading: authLoading, signOut, role } = useAuth();
  const { newOrdersCount, markAllSeen } = useOrders();
  const { pendingCount: reviewsPendingCount } = useReviews();
  const { addToast } = useToast();

  const isSeller = role === 'seller';
  const headerLabel = isSeller ? 'Кабинет продавца' : 'Админ-панель';

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
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
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
          role={role}
        />

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;