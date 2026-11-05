import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Слой навигации поверх React Router.
 *
 * Раньше в проекте был самописный роутер: чтобы перейти на другой адрес,
 * вызывали window.history.pushState(...) + вручную дёргали событие popstate.
 * Теперь маршрутами занимается React Router, но такие вызовы остались
 * в ~30 файлах. Чтобы не переписывать каждый компонент на useNavigate(),
 * здесь стоит «мост»: NavigationBridge подписывает navigate() на реальный
 * роутер.
 */

type NavigateFn = (to: string) => void;

let navigatorRef: NavigateFn | null = null;

export const setNavigator = (fn: NavigateFn | null) => {
  navigatorRef = fn;
};

/**
 * Переход на внутренний адрес без перезагрузки страницы.
 * Работает и до монтирования роутера (тогда — через history + popstate,
 * это событие React Router тоже слушает).
 */
export const navigate = (to: string) => {
  if (!to) return;

  // Внешние адреса и mailto/tel отдаём браузеру
  if (/^(https?:|mailto:|tel:)/i.test(to)) {
    window.location.href = to;
    return;
  }

  if (navigatorRef) {
    navigatorRef(to);
    return;
  }

  if (window.location.pathname + window.location.hash === to) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

/**
 * Мост к React Router. Рендерится один раз внутри <BrowserRouter>.
 * Подписка в useEffect: дочерние компоненты вызывают navigate() максимум
 * в своих эффектах, а если раньше — сработает резервный путь выше.
 */
export const NavigationBridge = () => {
  const nav = useNavigate();

  useEffect(() => {
    setNavigator((to) => nav(to));
    return () => setNavigator(null);
  }, [nav]);

  return null;
};

/** Удобные именованные переходы. */
export const routes = {
  navigate,
  home: () => navigate('/'),
  catalog: () => navigate('/catalog'),
  sellers: () => navigate('/sellers'),
  seller: (slug: string) => navigate(`/seller/${slug.trim()}`),
  product: (slug: string) => navigate(`/product/${slug.trim()}`),
  favorites: () => navigate('/favorites'),
  admin: () => navigate('/admin'),
  sellerDashboard: () => navigate('/seller/dashboard'),
  login: () => navigate('/login'),
  myOrders: () => navigate('/my-orders'),
  account: () => navigate('/account'),
};

/** Текущий разобранный адрес (обёртка над React Router). */
export const useRoute = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return {
    path: segments.length ? `/${segments[0]}` : '/',
    param: segments[1] ?? null,
    rest: segments.slice(2),
    fullPath: location.pathname,
    hash: location.hash,
    location,
  };
};

export const usePath = () => useLocation().pathname;
