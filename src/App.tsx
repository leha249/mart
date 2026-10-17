import { lazy, Suspense, useEffect, useState } from 'react';
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import { CartProvider, useCart } from './context/CartContext';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import { ProductsProvider, useProducts } from './context/ProductsContext';
import { OrdersProvider } from './context/OrdersContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { ReviewsProvider } from './context/ReviewsContext';
import { PromocodesAdminProvider } from './context/PromocodesAdminContext';
import { PromoProvider } from './context/PromoContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { SellersProvider } from './context/SellersContext';
import { useRoute } from './utils/navigate';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';

// ============ LAZY PAGES ============
const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));
const SellerPage = lazy(() => import('./pages/SellerPage'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const FavoritesPage = lazy(() => import('./pages/Favorites'));

// ============ DATA SYNC ============
function DataSync() {
  const { products } = useProducts();
  const { pruneMissing: pruneCart } = useCart();
  const { pruneMissing: pruneFav } = useFavorites();
  const { pruneMissing: pruneRecent } = useRecentlyViewed();

  useEffect(() => {
    if (products.length === 0) return;
    const ids = products.map((p) => p.id);
    pruneCart(ids);
    pruneFav(ids);
    pruneRecent(ids);
  }, [products, pruneCart, pruneFav, pruneRecent]);

  return null;
}

// ============ PAGE LOADER ============
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: 14,
      }}
    >
      Загрузка...
    </div>
  );
}

// ============ ROUTER ============
function Router() {
  const route = useRoute();

  // /admin
  if (route.path === '/admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Admin />
      </Suspense>
    );
  }

  // /login
  if (route.path === '/login') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  // /favorites
  if (route.path === '/favorites') {
    return (
      <Suspense fallback={<PageLoader />}>
        <FavoritesPage />
      </Suspense>
    );
  }

  // /catalog — полный каталог
  if (route.path === '/catalog') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CatalogPage />
      </Suspense>
    );
  }

  // /sellers — список магазинов
  if (route.path === '/sellers') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SellersPage />
      </Suspense>
    );
  }

  // /seller/dashboard — кабинет продавца (ведёт в Admin)
  if (route.path === '/seller' && route.param === 'dashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Admin />
      </Suspense>
    );
  }

  // /seller/:slug — страница конкретного магазина
  if (route.path === '/seller' && route.param) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SellerPage slug={route.param} />
      </Suspense>
    );
  }

  // / — главная (Hero + Магазины + Популярное + About + Newsletter + Footer)
  return (
    <Suspense fallback={<PageLoader />}>
      <HomePage />
    </Suspense>
  );
}

// ============ APP ============
function App() {
  const [preloaded, setPreloaded] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProductsProvider>
              <CategoriesProvider>
                <SellersProvider>
                  <OrdersProvider>
                    <ReviewsProvider>
                      <PromocodesAdminProvider>
                        <CartProvider>
                          <PromoProvider>
                            <FavoritesProvider>
                              <UIProvider>
                                <DataSync />
                                {!preloaded && (
                                  <Preloader
                                    onDone={() => setPreloaded(true)}
                                  />
                                )}
                                <Router />
                              </UIProvider>
                            </FavoritesProvider>
                          </PromoProvider>
                        </CartProvider>
                      </PromocodesAdminProvider>
                    </ReviewsProvider>
                  </OrdersProvider>
                </SellersProvider>
              </CategoriesProvider>
            </ProductsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;