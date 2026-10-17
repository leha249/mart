import { lazy, Suspense, useEffect, useState } from 'react';
import Preloader from './components/Preloader';
import Cursor from './components/Cursor';
import ScrollProgress from './components/ScrollProgress';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import RecentlyViewed from './components/RecentlyViewed';
import Lookbook from './components/Lookbook';
import About from './components/About';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import CartPanel from './components/CartPanel';
import FavoritesPanel from './components/FavoritesPanel';
import SearchOverlay from './components/SearchOverlay';
import ProductModal from './components/ProductModal';
import ErrorBoundary from './components/ErrorBoundary';
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
import { UIProvider, useUI } from './context/UIContext';
import { SellersProvider } from './context/SellersContext';
import { useRoute, useProductOpenEvent } from './utils/navigate';
import { useRecentlyViewed } from './hooks/useRecentlyViewed';
import type { UIProduct } from './types/database';

const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const FavoritesPage = lazy(() => import('./pages/Favorites'));

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

function GlobalProductOpener() {
  const { openProduct } = useUI();

  useProductOpenEvent((product) => {
    if (product && typeof product === 'object') {
      openProduct(product as UIProduct);
    }
  });

  return null;
}

function AppContent() {
  const {
    activePanel,
    closePanels,
    selectedProduct,
    openProduct,
    closeProduct,
  } = useUI();

  return (
    <div id="top" style={{ minHeight: '100vh' }}>
      <DataSync />
      <GlobalProductOpener />
      <ScrollProgress />
      <Cursor />
      <Navbar />
      <main>
        <Hero />
        <Products onProductClick={openProduct} />
        <RecentlyViewed onProductClick={openProduct} />
        <Lookbook />
        <About />
        <Newsletter />
      </main>
      <Footer />

      <CartPanel open={activePanel === 'cart'} onClose={closePanels} />
      <FavoritesPanel open={activePanel === 'favorites'} onClose={closePanels} />
      <SearchOverlay
        open={activePanel === 'search'}
        onClose={closePanels}
        onProductSelect={openProduct}
      />
      <ProductModal product={selectedProduct} onClose={closeProduct} />
      <ToastContainer />
    </div>
  );
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

function Router() {
  const path = useRoute();

  if (path === '/admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Admin />
      </Suspense>
    );
  }
  if (path === '/login') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    );
  }
  if (path === '/favorites') {
    return (
      <Suspense fallback={<PageLoader />}>
        <ScrollProgress />
        <Cursor />
        <Navbar />
        <FavoritesPage />
        <Footer />
        <ToastContainer />
      </Suspense>
    );
  }
  return <AppContent />;
}

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
                                {!preloaded && (
                                  <Preloader onDone={() => setPreloaded(true)} />
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