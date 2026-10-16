import { useEffect, useState } from 'react';

const navigate = (path: string) => {
  if (window.location.pathname === path) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const openProduct = (product: unknown) => {
  window.dispatchEvent(new CustomEvent('open-product', { detail: product }));
};

export const routes = {
  navigate,
  home: () => navigate('/'),
  admin: () => navigate('/admin'),
  login: () => navigate('/login'),
  favorites: () => navigate('/favorites'),
  openProduct,
};

export const useRoute = (): string => {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return path;
};

export const useProductOpenEvent = (
  handler: (product: unknown) => void
) => {
  useEffect(() => {
    const listener = (e: Event) => {
      handler((e as CustomEvent).detail);
    };
    window.addEventListener('open-product', listener);
    return () => window.removeEventListener('open-product', listener);
  }, [handler]);
};