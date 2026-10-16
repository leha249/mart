import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { productsService } from '../services/products';
import type { Product, UIProduct } from '../types/database';
import { mapProductToUI } from '../types/database';
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
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const pendingRefetchRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchProducts = async () => {
    if (fetchingRef.current) {
      pendingRefetchRef.current = true;
      return;
    }
    fetchingRef.current = true;

    try {
      setError(null);
      const data = await productsService.getAll();
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

    const channel = supabase
      .channel(`mora-products-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
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
        }
      )
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
  }, []);

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