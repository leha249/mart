import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import Preloader from './components/Preloader';
import ErrorBoundary from './components/ErrorBoundary';
import CookieBanner from './components/CookieBanner';
import CartPanel from './components/CartPanel';
import FavoritesPanel from './components/FavoritesPanel';
import SearchOverlay from './components/SearchOverlay';
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
import { NavigationBridge, navigate } from './utils/navigate';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';

const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));
const SellerPage = lazy(() => import('./pages/SellerPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
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
const PricingPage = lazy(() => import('./pages/PricingPage'));

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

/** Прокрутка вверх при смене страницы (кроме перехода на якорь #...). */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}

/**
 * Перехватывает клики по внутренним ссылкам (<a href="/privacy">), чтобы они
 * переходили через роутер, а не перезагружали приложение целиком.
 * Ссылки, которые уже сами обрабатывают клик (preventDefault + navigate),
 * пропускаются. Внешние адреса, mailto, tel, target="_blank" и загрузки
 * остаются браузеру.
 */
function LinkInterceptor() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      event.preventDefault();
      navigate(href);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}

/**
 * Глобальные панели — рендерятся на уровне App, чтобы корзина,
 * поиск и избранное работали с любой страницы.
 *
 * Карточка товара больше не открывается модалкой: у каждого товара
 * теперь своя страница /product/:slug, поэтому выбор в поиске ведёт на неё.
 */
function GlobalPanels() {
  const { activePanel, closePanels } = useUI();

  const openProductPage = (product: { id: number; slug?: string | null }) => {
    closePanels();
    navigate(
      product.slug
        ? `/product/${product.slug}`
        : `/product/${product.id}`
    );
  };

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
        onProductSelect={openProductPage}
      />
      <ToastContainer />
    </>
  );
}

function SellerPageRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <SellerPage slug={slug ?? ''} />;
}

function ProductPageRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <ProductPage slug={slug ?? ''} />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/sellers" element={<SellersPage />} />
        <Route path="/seller/dashboard" element={<Admin />} />
        <Route path="/seller/:slug" element={<SellerPageRoute />} />
        <Route path="/product/:slug" element={<ProductPageRoute />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-seller" element={<RegisterSellerPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login-customer" element={<CustomerLoginPage />} />
        <Route path="/account" element={<CustomerAccountPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/seller-agreement" element={<SellerAgreementPage />} />
        <Route path="/data-request" element={<DataRequestPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const [preloaded, setPreloaded] = useState(false);

  return (
    <ErrorBoundary>
      <BrowserRouter>
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
                                    <NavigationBridge />
                                    <LinkInterceptor />
                                    <ScrollManager />
                                    <DataSync />
                                    {!preloaded && (
                                      <Preloader
                                        onDone={() => setPreloaded(true)}
                                      />
                                    )}
                                    <AppRoutes />
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
