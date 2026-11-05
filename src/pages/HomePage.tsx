import SellersSection from '../components/home/SellersSection';
import PopularProducts from '../components/home/PopularProducts';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import type { UIProduct } from '../types/database';

const HomePage = () => {
  usePageMeta({
    title: 'MØRA MART — маркетплейс одежды',
    description:
      'MØRA MART — маркетплейс одежды, обуви и аксессуаров. Независимые продавцы, каждый со своим магазином. Доставка по России.',
  });

  const goToSellers = () => {
    navigate('/sellers');
  };

  const goToSeller = (slug: string) => {
    navigate(`/seller/${slug}`);
  };

  const goToCatalog = () => {
    navigate('/catalog');
  };

  const openProductPage = (product: UIProduct) => {
    navigate(product.slug ? `/product/${product.slug}` : `/product/${product.id}`);
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
          onProductClick={openProductPage}
          onGoToCatalog={goToCatalog}
        />
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
