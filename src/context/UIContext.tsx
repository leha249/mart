import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UIProduct } from '../types/database';
import { useProducts } from './ProductsContext';

type Panel = 'cart' | 'search' | 'favorites' | null;

interface UIContextType {
  activePanel: Panel;
  openCart: () => void;
  openSearch: () => void;
  openFavorites: () => void;
  closePanels: () => void;
  selectedProduct: UIProduct | null;
  openProduct: (p: UIProduct) => void;
  closeProduct: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [selectedProduct, setSelectedProduct] = useState<UIProduct | null>(null);
  const { products } = useProducts();

  useEffect(() => {
    if (selectedProduct && !products.some((p) => p.id === selectedProduct.id)) {
      setSelectedProduct(null);
    }
  }, [products, selectedProduct]);

  const openCart = () => setActivePanel('cart');
  const openSearch = () => setActivePanel('search');
  const openFavorites = () => setActivePanel('favorites');
  const closePanels = () => setActivePanel(null);

  const openProduct = (p: UIProduct) => setSelectedProduct(p);
  const closeProduct = () => setSelectedProduct(null);

  return (
    <UIContext.Provider
      value={{
        activePanel,
        openCart,
        openSearch,
        openFavorites,
        closePanels,
        selectedProduct,
        openProduct,
        closeProduct,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};