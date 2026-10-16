import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { safeGet, safeSet } from '../utils/storage';

interface FavoritesContextType {
  favorites: number[];
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  clearFavorites: () => void;
  pruneMissing: (existingIds: number[]) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'mora-favorites-v1';

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<number[]>(() => {
    const loaded = safeGet<number[]>(STORAGE_KEY, []);
    if (!Array.isArray(loaded)) return [];
    return loaded.filter((x) => typeof x === 'number' && x > 0);
  });

  useEffect(() => {
    safeSet(STORAGE_KEY, favorites);
  }, [favorites]);

  const toggleFavorite = (id: number) => {
    if (typeof id !== 'number' || id <= 0) return;
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: number) => favorites.includes(id);

  const clearFavorites = () => setFavorites([]);

  const pruneMissing = (existingIds: number[]) => {
    setFavorites((prev) => {
      const filtered = prev.filter((id) => existingIds.includes(id));
      if (filtered.length === prev.length) return prev;
      return filtered;
    });
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite, clearFavorites, pruneMissing }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};