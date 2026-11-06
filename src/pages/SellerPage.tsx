import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Store, MessageCircle } from 'lucide-react';
import { sellersService } from '../services/sellers';
import { productsService } from '../services/products';
import { supabase } from '../lib/supabase';
import type { UISeller, UIProduct } from '../types/database';
import { mapProductToUI } from '../types/database';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SellerHero from '../components/seller/SellerHero';
import SellerCatalog from '../components/seller/SellerCatalog';
import SellerLookbook from '../components/seller/SellerLookbook';
import SellerAbout from '../components/seller/SellerAbout';
import SellerFooter from '../components/seller/SellerFooter';
import Cursor from '../components/Cursor';
import ScrollProgress from '../components/ScrollProgress';
import { navigate } from '../utils/navigate';
import { usePageMeta } from '../hooks/usePageMeta';
import ChatPanel from '../components/chat/ChatPanel';

interface Props {
  slug: string;
}

const SellerPage = ({ slug }: Props) => {
  const [seller, setSeller] = useState<UISeller | null>(null);
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const accent = seller?.accentColor || '#e8ff5a';

  const goHome = useCallback(() => {
    navigate('/');
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
  }, [loadData]);

  usePageMeta({
    title: seller ? `${seller.name} — магазин` : 'Магазин',
    description: seller
      ? seller.description?.slice(0, 160) ||
        `${seller.name} на MØRA MART — одежда, обувь и аксессуары от независимого продавца.`
      : 'Магазин продавца на MØRA MART.',
    image: seller?.cover || seller?.logo || undefined,
    noindex: !seller,
  });

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
        <Footer />
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
          accent={accent}
          onProductClick={(product) =>
            navigate(
              product.slug
                ? `/product/${product.slug}`
                : `/product/${product.id}`
            )
          }
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

      {/* Чат с продавцом */}
      <button
        onClick={() => setChatOpen(true)}
        style={{
          position: 'fixed',
          left: 20,
          bottom: 20,
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '13px 20px',
          borderRadius: 100,
          border: 'none',
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
        }}
      >
        <MessageCircle size={16} /> Написать продавцу
      </button>

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        sellerId={seller.id}
        sellerName={seller.name}
      />
    </div>
  );
};

export default SellerPage;
