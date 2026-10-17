import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useReviews } from '../context/ReviewsContext';
import AdminLayout from './admin/AdminLayout';
import type { AdminTab } from '../components/admin/AdminTabs';

// Lazy-load вкладок — каждая грузится при первом открытии
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./admin/AdminProducts'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminCategories = lazy(() => import('./admin/AdminCategories'));
const AdminReviews = lazy(() => import('./admin/AdminReviews'));
const AdminPromocodes = lazy(() => import('./admin/AdminPromocodes'));
const AdminSellers = lazy(() => import('./admin/AdminSellers'));
const AdminProfile = lazy(() => import('./admin/AdminProfile'));

function TabLoader() {
  return (
    <div
      style={{
        padding: 80,
        textAlign: 'center',
        color: 'var(--muted)',
      }}
    >
      <Loader2
        size={24}
        style={{
          animation: 'spin 1s linear infinite',
          display: 'inline-block',
        }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const Admin = () => {
  const { user, loading: authLoading, role } = useAuth();
  const { newOrdersCount } = useOrders();
  const { pendingCount: reviewsPendingCount } = useReviews();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const isSeller = role === 'seller';

  // === ЗАЩИТА: если продавец попал на чужую вкладку — редиректим ===
  useEffect(() => {
    if (!isSeller) return;
    // Продавцу доступны: dashboard, products, orders, categories, reviews, promocodes, profile
    // Но не sellers
    if (activeTab === 'sellers') {
      setActiveTab('dashboard');
    }
  }, [isSeller, activeTab]);

  // === РЕДИРЕКТ НА /login если не авторизован ===
  useEffect(() => {
    if (!authLoading && !user) {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [user, authLoading]);

  // === ЗАГОЛОВОК ВКЛАДКИ БРАУЗЕРА ===
  useEffect(() => {
    let title = 'Админ — MØRA MART';

    if (role === 'seller') {
      title = 'Кабинет продавца — MØRA MART';
    } else {
      if (activeTab === 'dashboard') title = 'Дашборд — MØRA MART';
      if (activeTab === 'orders')
        title = `Заказы (${newOrdersCount}) — MØRA MART`;
      if (activeTab === 'products') title = 'Товары — MØRA MART';
      if (activeTab === 'categories') title = 'Категории — MØRA MART';
      if (activeTab === 'reviews')
        title = `Отзывы (${reviewsPendingCount}) — MØRA MART`;
      if (activeTab === 'promocodes') title = 'Промокоды — MØRA MART';
      if (activeTab === 'sellers') title = 'Продавцы — MØRA MART';
    }

    document.title = title;

    return () => {
      document.title = 'MØRA MART';
    };
  }, [activeTab, newOrdersCount, reviewsPendingCount, role]);

  // === РЕНДЕР ВКЛАДКИ ===
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'products':
        return <AdminProducts />;
      case 'orders':
        return <AdminOrders />;
      case 'categories':
        return <AdminCategories />;
      case 'reviews':
        return <AdminReviews />;
      case 'promocodes':
        return <AdminPromocodes />;
      case 'sellers':
        return isSeller ? <AdminDashboard /> : <AdminSellers />;
      case 'profile':
        return isSeller ? <AdminProfile /> : <AdminDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <Suspense fallback={<TabLoader />}>{renderTab()}</Suspense>
    </AdminLayout>
  );
};

export default Admin;