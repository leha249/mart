import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Store } from 'lucide-react';
import { sellersService } from '../services/sellers';
import { productsService } from '../services/products';
import { categoriesService } from '../services/categories';
import { supabase } from '../lib/supabase';
import { useUI } from '../context/UIContext';
import type { UISeller, UIProduct } from '../types/database';
import { mapProductToUI } from '../types/database';
import Navbar from '../components/Navbar';
import SellerHero from '../components/seller/SellerHero';
import SellerCatalog from '../components/seller/SellerCatalog';
import SellerLookbook from '../components/seller/SellerLookbook';
import SellerAbout from '../components/seller/SellerAbout';
import SellerFooter from '../components/seller/SellerFooter';
import ProductModal from '../components/ProductModal';
import ToastContainer from '../components/ToastContainer';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';

interface Props {
  slug: string;
}

const SellerPage = ({ slug }: Props) => {
  const { selectedProduct, openProduct, closeProduct } = useUI();

  const [seller, setSeller] = useState<UISeller | null>(null);
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accent = seller?.accentColor || '#e8ff5a';

  const goHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const foundSeller = await sellersService.getBySlug(slug);

      if (!foundSeller) {
        setError('Магазин не найден');
        setLoading(false);
        return;
      }

      if (foundSeller.status !== 'active') {
        setError('Магазин временно недоступен');
        setLoading(false);
        return;
      }

      setSeller(foundSeller);

      const rawProducts = await productsService.getAll(foundSeller.id);
      setProducts(rawProducts.map(mapProductToUI));

      const sellerCategories = await categoriesService.getAll(foundSeller.id);
      setCategories(sellerCategories.map((c) => c.name));

      document.title = `${foundSeller.name} — MØRA MART`;
    } catch (e) {
      console.error('[SellerPage] load error:', e);
      setError(
        e instanceof Error ? e.message : 'Не удалось загрузить магазин'
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
    return () => {
      document.title = 'MØRA MART';
    };
  }, [loadData]);

  useEffect(() => {
    if (!seller) return;

    const channelName = `seller-page-${seller.id}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `seller_id=eq.${seller.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const ui = mapProductToUI(payload.new as any);
            setProducts((prev) => {
              if (prev.some((p) => p.id === ui.id)) return prev;
              return [ui, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const ui = mapProductToUI(payload.new as any);
            setProducts((prev) =>
              prev.map((p) => (p.id === ui.id ? ui : p))
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const del = payload.old as { id: number };
            setProducts((prev) => prev.filter((p) => p.id !== del.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seller]);

  const displayCategories = useMemo(() => {
    const set = new Set<string>(categories);
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [categories, products]);

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <Cursor />
        <Navbar />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            color: 'var(--muted)',
            paddingTop: 100,
          }}
        >
          <Loader2
            size={32}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <div style={{ fontSize: 14 }}>Загружаем магазин...</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
        <ToastContainer />
      </>
    );
  }

  if (error || !seller) {
    return (
      <>
        <ScrollProgress />
        <Cursor />
        <Navbar />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 20px 80px',
            textAlign: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              marginBottom: 8,
            }}
          >
            <Store size={36} strokeWidth={1.5} />
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-1px',
            }}
          >
            {error === 'Магазин временно недоступен'
              ? 'Магазин временно недоступен'
              : 'Магазин не найден'}
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 15,
              maxWidth: 400,
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            {error === 'Магазин временно недоступен'
              ? 'Продавец приостановил работу. Попробуйте зайти позже или вернитесь на главную.'
              : `По адресу /seller/${slug} магазина не существует. Проверьте ссылку или вернитесь на главную.`}
          </p>
          <button
            onClick={goHome}
            style={{
              padding: '14px 28px',
              borderRadius: 100,
              border: 'none',
              background: 'var(--accent)',
              color: '#000',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ArrowLeft size={16} /> На главную MØRA MART
          </button>
        </div>
        <ToastContainer />
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        ['--accent' as any]: accent,
        ['--accent-contrast' as any]: '#000',
      }}
    >
      <ScrollProgress />
      <Cursor />
      <Navbar />

      <main>
        <SellerHero seller={seller} />
        <SellerCatalog
          products={products}
          categories={displayCategories}
          accent={accent}
          onProductClick={openProduct}
        />
        {seller.lookbookImages && seller.lookbookImages.length > 0 && (
          <SellerLookbook
            images={seller.lookbookImages}
            accentColor={accent}
          />
        )}
        <SellerAbout seller={seller} />
      </main>

      <SellerFooter seller={seller} onGoHome={goHome} />

      <ProductModal product={selectedProduct} onClose={closeProduct} />
      <ToastContainer />
    </div>
  );
};

export default SellerPage;