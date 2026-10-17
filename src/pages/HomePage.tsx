import { useEffect } from 'react';
import SellersSection from '../components/home/SellersSection';
import PopularProducts from '../components/home/PopularProducts';
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

const HomePage = () => {
  const {
    activePanel,
    closePanels,
    selectedProduct,
    openProduct,
    closeProduct,
  } = useUI();

  useEffect(() => {
    document.title = 'MØRA MART — маркетплейс одежды';
    return () => {
      document.title = 'MØRA MART';
    };
  }, []);

  const goToSellers = () => {
    window.history.pushState({}, '', '/sellers');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goToSeller = (slug: string) => {
    window.history.pushState({}, '', `/seller/${slug}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const goToCatalog = () => {
    window.history.pushState({}, '', '/catalog');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div id="top" style={{ minHeight: '100vh' }}>
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main style={{ paddingTop: 84 }}>
        <SellersSection
          limit={6}
          onGoToSellers={goToSellers}
          onGoToSeller={goToSeller}
        />
        <PopularProducts
          limit={8}
          onProductClick={openProduct}
          onGoToCatalog={goToCatalog}
        />
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

export default HomePage;