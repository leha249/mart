import Products from '../components/Products';
import RecentlyViewed from '../components/RecentlyViewed';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import type { UIProduct } from '../types/database';

const CatalogPage = () => {
  usePageMeta({
    title: 'Каталог',
    description:
      'Полный каталог MØRA MART: одежда, обувь и аксессуары от независимых продавцов. Фильтры по категориям и цене.',
  });

  const goHome = () => {
    navigate('/');
  };

  /** Клик по карточке ведёт на страницу товара, а не в модалку. */
  const openProductPage = (product: UIProduct) => {
    navigate(product.slug ? `/product/${product.slug}` : `/product/${product.id}`);
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

        <Products onProductClick={openProductPage} />
        <RecentlyViewed onProductClick={openProductPage} />
      </main>

      <Footer />
    </div>
  );
};

export default CatalogPage;
