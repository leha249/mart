import { useEffect, useState } from 'react';

const navigate = (path: string) => {
  if (window.location.pathname === path) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const openProduct = (product: unknown) => {
  window.dispatchEvent(new CustomEvent('open-product', { detail: product }));
};

// === Разбор пути: /seller/ivan → { path: '/seller', param: 'ivan' } ===
interface ParsedRoute {
  /** Чистый путь без динамического параметра, например '/seller' или '/admin' */
  path: string;
  /** Первый динамический сегмент, например 'ivan' для '/seller/ivan' */
  param: string | null;
  /** Полный путь, как в адресной строке, например '/seller/ivan' */
  fullPath: string;
  /** Все сегменты после базового пути: для '/seller/ivan/orders' → ['orders'] */
  rest: string[];
}

const KNOWN_BASE_ROUTES = [
  '/admin',
  '/login',
  '/favorites',
  '/seller',
  '/sellers',
] as const;

const parseRoute = (fullPath: string): ParsedRoute => {
  const clean = fullPath.replace(/\/+$/, '') || '/';

  // Ищем самое длинное совпадение из известных базовых маршрутов
  let matchedBase: string | null = null;
  for (const base of KNOWN_BASE_ROUTES) {
    if (clean === base || clean.startsWith(base + '/')) {
      if (!matchedBase || base.length > matchedBase.length) {
        matchedBase = base;
      }
    }
  }

  if (!matchedBase) {
    return {
      path: clean,
      param: null,
      fullPath: clean,
      rest: [],
    };
  }

  const remainder = clean.slice(matchedBase.length).replace(/^\/+/, '');
  if (!remainder) {
    return {
      path: matchedBase,
      param: null,
      fullPath: clean,
      rest: [],
    };
  }

  const segments = remainder.split('/').filter(Boolean);
  const [param, ...rest] = segments;

  return {
    path: matchedBase,
    param: param ?? null,
    fullPath: clean,
    rest,
  };
};

export const routes = {
  navigate,
  home: () => navigate('/'),
  admin: () => navigate('/admin'),
  login: () => navigate('/login'),
  favorites: () => navigate('/favorites'),
  /** Публичная страница продавца */
  seller: (slug: string) => navigate(`/seller/${slug.trim()}`),
  /** Кабинет продавца (его профиль, товары, заказы) */
  sellerDashboard: () => navigate('/seller/dashboard'),
  /** Список всех продавцов */
  sellers: () => navigate('/sellers'),
  openProduct,
};

/**
 * Возвращает объект с разобранным путём.
 * Пример:
 *   useRoute() для '/seller/ivan' → { path: '/seller', param: 'ivan', fullPath: '/seller/ivan', rest: [] }
 *   useRoute() для '/admin'       → { path: '/admin', param: null, fullPath: '/admin', rest: [] }
 */
export const useRoute = (): ParsedRoute => {
  const [route, setRoute] = useState<ParsedRoute>(() =>
    parseRoute(window.location.pathname)
  );

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return route;
};

/**
 * Хелпер для случаев, когда нужен только путь (строка).
 * Аналог старого поведения useRoute.
 */
export const usePath = (): string => {
  const route = useRoute();
  return route.path;
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

// === Экспорт для удобства ===
export { parseRoute };
export type { ParsedRoute };