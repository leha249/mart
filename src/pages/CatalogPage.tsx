import { useEffect } from 'react';
import Products from '../components/Products';
import RecentlyViewed from '../components/RecentlyViewed';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import CartPanel from '../components/CartPanel';
import FavoritesPanel from '../components/FavoritesPanel';
import SearchOverlay from '../components/SearchOverlay';
import ProductModal from '../components/ProductModal';
import ToastContainer from '../components/ToastContainer';
import { useUI } from '../context/UIContext';
import { ArrowLeft } from 'lucide-react';

const CatalogPage = () => {
  const {
    activePanel,
    closePanels,
    selectedProduct,
    openProduct,
    closeProduct,
  } = useUI();

  useEffect(() => {
    document.title = 'Каталог — MØRA MART';
    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div id="top" style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 100 }}>
        {/* Хлебная крошка / возврат */}
        <div className="container" style={{ paddingTop: 20 }}>
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
            }}
          >
            <ArrowLeft size={14} /> На главную
          </button>
        </div>

        <Products onProductClick={openProduct} />
        <RecentlyViewed onProductClick={openProduct} />
      </main>

      <Footer />

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
    </div>
  );
};

export default CatalogPage;