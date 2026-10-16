import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { safeGet, safeSet } from '../utils/storage';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  pruneMissing: (existingIds: number[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'mora-cart-v1';
const MAX_QUANTITY = 99;

const isValidCartItem = (item: unknown): item is CartItem => {
  if (!item || typeof item !== 'object') return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.id === 'number' &&
    i.id > 0 &&
    typeof i.name === 'string' &&
    i.name.length > 0 &&
    typeof i.price === 'number' &&
    i.price > 0 &&
    typeof i.image === 'string' &&
    typeof i.quantity === 'number' &&
    i.quantity > 0 &&
    i.quantity <= MAX_QUANTITY
  );
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const loaded = safeGet<unknown[]>(STORAGE_KEY, []);
    if (!Array.isArray(loaded)) return [];
    return loaded.filter(isValidCartItem);
  });

  useEffect(() => {
    safeSet(STORAGE_KEY, items);
  }, [items]);

  const addItem = (product: Omit<CartItem, 'quantity'>) => {
    if (!product || product.id <= 0 || product.price <= 0) return;

    setItems((prev) => {
      const existing = prev.find(
        (i) => i.id === product.id && i.size === product.size
      );
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === product.size
            ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) }
            : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const pruneMissing = (existingIds: number[]) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => existingIds.includes(i.id));
      if (filtered.length === prev.length) return prev;
      return filtered;
    });
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        pruneMissing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};