import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { productsService } from '../services/products';
import type { Product, UIProduct } from '../types/database';
import { mapProductToUI } from '../types/database';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ProductsContextType {
  products: UIProduct[];
  rawProducts: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, sellerId } = useAuth();

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const pendingRefetchRef = useRef(false);
  const fetchingRef = useRef(false);

  // Фильтр по продавцу применяется только в кабинете продавца.
  // На публичном каталоге (role = guest/admin) показываем всё.
  const effectiveSellerId = role === 'seller' ? sellerId : null;

  const fetchProducts = async () => {
    if (fetchingRef.current) {
      pendingRefetchRef.current = true;
      return;
    }
    fetchingRef.current = true;

    try {
      setError(null);
      const data = await productsService.getAll(effectiveSellerId);
      if (mountedRef.current) setRawProducts(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки товаров';
      if (mountedRef.current) setError(msg);
      console.error('ProductsContext error:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        setTimeout(fetchProducts, 100);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProducts();

    // Realtime-подписка: для продавца — только его товары
    const channelName =
      role === 'seller' && sellerId !== null
        ? `mora-products-seller-${sellerId}-${Math.random().toString(36).slice(2)}`
        : `mora-products-${Math.random().toString(36).slice(2)}`;

    const config =
      role === 'seller' && sellerId !== null
        ? {
            event: '*' as const,
            schema: 'public',
            table: 'products',
            filter: `seller_id=eq.${sellerId}`,
          }
        : {
            event: '*' as const,
            schema: 'public',
            table: 'products',
          };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newProduct = payload.new as Product;
          setRawProducts((prev) => {
            if (prev.some((p) => p.id === newProduct.id)) return prev;
            return [newProduct, ...prev];
          });
          return;
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          const updated = payload.new as Product;
          setRawProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          return;
        }

        fetchProducts();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, sellerId, effectiveSellerId]);

  const products = rawProducts.map(mapProductToUI);

  return (
    <ProductsContext.Provider
      value={{ products, rawProducts, loading, error, refetch: fetchProducts }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};