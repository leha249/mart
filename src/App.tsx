import { lazy, Suspense, useEffect, useState } from 'react';
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import CookieBanner from './components/CookieBanner';
import CartPanel from './components/CartPanel';
import FavoritesPanel from './components/FavoritesPanel';
import SearchOverlay from './components/SearchOverlay';
import ProductModal from './components/ProductModal';
import ToastContainer from './components/ToastContainer';
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
import { CustomerProvider } from './context/CustomerContext';
import { UIProvider, useUI } from './context/UIContext';
import { SellersProvider } from './context/SellersContext';
import { useRoute } from './utils/navigate';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';

const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));
const SellerPage = lazy(() => import('./pages/SellerPage'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const FavoritesPage = lazy(() => import('./pages/Favorites'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));

const CustomerLoginPage = lazy(() => import('./pages/CustomerLoginPage'));
const CustomerAccountPage = lazy(() => import('./pages/CustomerAccountPage'));

const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const SellerAgreementPage = lazy(() => import('./pages/SellerAgreementPage'));
const DataRequestPage = lazy(() => import('./pages/DataRequestPage'));
const RegisterSellerPage = lazy(() => import('./pages/RegisterSellerPage'));

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

/**
 * Глобальные панели — рендерятся на уровне App, чтобы корзина,
 * поиск, избранное и карточка товара работали с любой страницы.
 */
function GlobalPanels() {
  const {
    activePanel,
    closePanels,
    selectedProduct,
    openProduct,
    closeProduct,
  } = useUI();

  return (
    <>
      <CartPanel open={activePanel === 'cart'} onClose={closePanels} />
      <FavoritesPanel
        open={activePanel === 'favorites'}
        onClose={closePanels}
      />
      <SearchOverlay
        open={activePanel === 'search'}
        onClose={closePanels}
        onProductSelect={openProduct}
      />
      <ProductModal product={selectedProduct} onClose={closeProduct} />
      <ToastContainer />
    </>
  );
}

function Router() {
  const route = useRoute();

  if (route.path === '/admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Admin />
      </Suspense>
    );
  }

  if (route.path === '/login') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }

  if (route.path === '/register-seller') {
    return (
      <Suspense fallback={<PageLoader />}>
        <RegisterSellerPage />
      </Suspense>
    );
  }

  if (route.path === '/favorites') {
    return (
      <Suspense fallback={<PageLoader />}>
        <FavoritesPage />
      </Suspense>
    );
  }

  if (route.path === '/order-success') {
    return (
      <Suspense fallback={<PageLoader />}>
        <OrderSuccess />
      </Suspense>
    );
  }

  if (route.path === '/my-orders') {
    return (
      <Suspense fallback={<PageLoader />}>
        <MyOrdersPage />
      </Suspense>
    );
  }

  if (route.path === '/login-customer') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CustomerLoginPage />
      </Suspense>
    );
  }

  if (route.path === '/account') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CustomerAccountPage />
      </Suspense>
    );
  }

  if (route.path === '/catalog') {
    return (
      <Suspense fallback={<PageLoader />}>
        <CatalogPage />
      </Suspense>
    );
  }

  if (route.path === '/sellers') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SellersPage />
      </Suspense>
    );
  }

  if (route.path === '/about') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AboutPage />
      </Suspense>
    );
  }

  if (route.path === '/contacts') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ContactsPage />
      </Suspense>
    );
  }

  if (route.path === '/privacy') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PrivacyPage />
      </Suspense>
    );
  }

  if (route.path === '/terms') {
    return (
      <Suspense fallback={<PageLoader />}>
        <TermsPage />
      </Suspense>
    );
  }

  if (route.path === '/seller-agreement') {
    return (
      <Suspense fallback={<PageLoader />}>
        <SellerAgreementPage />
      </Suspense>
    );
  }

  if (route.path === '/data-request') {
    return (
      <Suspense fallback={<PageLoader />}>
        <DataRequestPage />
      </Suspense>
    );
  }

  if (route.path === '/seller' && route.param === 'dashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Admin />
      </Suspense>
    );
  }

  if (route.path === '/seller' && route.param) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SellerPage slug={route.param} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <HomePage />
    </Suspense>
  );
}

function App() {
  const [preloaded, setPreloaded] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CustomerProvider>
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
                                  <GlobalPanels />
                                  <CookieBanner />
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
            </CustomerProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;