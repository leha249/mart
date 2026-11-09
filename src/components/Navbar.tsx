import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  ShoppingBag,
  Heart,
  X,
  Settings,
  Store,
  Package,
  User,
  Tag,
  Info,
  Mail,
  Send,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useCustomer } from '../context/CustomerContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useThrottle } from '../hooks/useDebounce';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import { CONTACTS } from '../utils/constants';
import { navigate } from '../utils/navigate';

const navLinks = [
  { label: 'Магазины', kind: 'sellers' as const },
  { label: 'Каталог', kind: 'catalog' as const },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { openCart, openSearch } = useUI();
  const { role } = useAuth();
  const { isAuthenticated: isCustomer } = useCustomer();

  useBodyLock(menuOpen);

  const isSellerOrAdmin = role === 'seller' || role === 'admin';
  const isPending = role === 'pending';
  const canManage = isSellerOrAdmin || isPending;

  const handleScroll = useThrottle(() => {
    setScrolled(window.scrollY > 40);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const go = (path: string) => {
    navigate(path);
  };

  const goHome = () => go('/');
  const goToFavorites = () => go('/favorites');
  const goToSellers = () => go('/sellers');
  const goToCatalog = () => go('/catalog');
  const goToAdmin = () => go('/admin');
  const goToAccount = () => go(isCustomer ? '/account' : '/login-customer');
  const goToSell = () => go('/sell');

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition:
            'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
          background: scrolled ? 'rgba(10,10,10,0.75)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled
            ? '1px solid var(--border)'
            : '1px solid transparent',
          willChange: 'background, backdrop-filter, border-color',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 84,
          }}
        >
          <motion.a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              goHome();
            }}
            whileHover={{ scale: 1.02 }}
            aria-label="На главную"
            style={{ textDecoration: 'none' }}
          >
            <Logo size="md" withSuffix />
          </motion.a>

          <nav
            style={{ display: 'flex', gap: 32, alignItems: 'center' }}
            className="desktop-nav"
          >
            {navLinks.map((link, i) => (
              <motion.button
                key={link.label}
                onClick={() => {
                  if (link.kind === 'sellers') goToSellers();
                  else if (link.kind === 'catalog') goToCatalog();
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                whileHover={{ y: -2 }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  position: 'relative',
                  fontFamily: 'inherit',
                  padding: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </motion.button>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {/* «Войти» текстом — перед всеми иконками справа */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={goToAccount}
              aria-label={isCustomer ? 'Личный кабинет' : 'Войти'}
              title={isCustomer ? 'Личный кабинет' : 'Войти'}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 2px',
                color: isCustomer ? 'var(--accent)' : 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {isCustomer ? 'Кабинет' : 'Войти'}
            </motion.button>

            {canManage && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="icon-btn"
                aria-label="Управление"
                title={isPending ? 'Аккаунт на модерации' : 'Управление'}
                onClick={goToAdmin}
              >
                <Settings size={18} strokeWidth={1.75} />
              </motion.button>
            )}

            <div className="theme-toggle-wrap">
              <ThemeToggle />
            </div>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="icon-btn"
              aria-label="Поиск"
              onClick={openSearch}
            >
              <Search size={18} strokeWidth={1.75} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="icon-btn"
              aria-label={`Избранное: ${favorites.length}`}
              onClick={goToFavorites}
              style={{
                position: 'relative',
                color: favorites.length > 0 ? 'var(--danger)' : 'var(--text)',
              }}
            >
              <Heart
                size={18}
                strokeWidth={1.75}
                fill={favorites.length > 0 ? 'var(--danger)' : 'none'}
              />
              {favorites.length > 0 && (
                <span
                  className="price-num"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '50%',
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="icon-btn"
              onClick={openCart}
              aria-label={`Корзина, товаров: ${totalItems}`}
              style={{ position: 'relative' }}
            >
              <ShoppingBag size={18} strokeWidth={1.75} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="price-num"
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                      borderRadius: '50%',
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              className="icon-btn mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              style={{ display: 'none' }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--bg)',
              zIndex: 200,
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Logo size="md" withSuffix />
              <button
                className="icon-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
              >
                <X size={24} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                marginTop: 24,
                flex: 1,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {[
                { label: 'Каталог', icon: Package, go: goToCatalog },
                { label: 'Магазины', icon: Store, go: goToSellers },
                {
                  label: `Избранное${favorites.length ? ` · ${favorites.length}` : ''}`,
                  icon: Heart,
                  go: goToFavorites,
                },
                {
                  label: `Корзина${totalItems ? ` · ${totalItems}` : ''}`,
                  icon: ShoppingBag,
                  go: () => {
                    setMenuOpen(false);
                    openCart();
                  },
                },
                {
                  label: isCustomer ? 'Мой кабинет' : 'Войти',
                  icon: User,
                  go: goToAccount,
                  accent: true,
                },
                { label: 'Тарифы', icon: Tag, go: () => go('/pricing') },
                { label: 'О платформе', icon: Info, go: () => go('/about') },
                { label: 'Контакты', icon: Mail, go: () => go('/contacts') },
                ...(canManage
                  ? [
                      {
                        label: isPending ? 'Аккаунт на модерации' : 'Управление',
                        icon: Settings,
                        go: goToAdmin,
                      },
                    ]
                  : []),
              ].map(({ label, icon: Icon, go: action, accent }, i) => (
                <motion.button
                  key={label}
                  onClick={() => {
                    setMenuOpen(false);
                    action();
                  }}
                  initial={{ opacity: 0, x: -30, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{
                    delay: 0.05 + i * 0.04,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    fontSize: 'clamp(20px, 3.4vw, 30px)',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: accent ? 'var(--accent)' : 'var(--text)',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    padding: '6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    lineHeight: 1.2,
                  }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  {label}
                </motion.button>
              ))}
            </div>

            {/* Низ меню: вход для продавцов + менеджер */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 18,
                borderTop: '1px solid var(--border)',
              }}
            >
              <motion.button
                onClick={() => {
                  setMenuOpen(false);
                  goToSell();
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Store size={22} strokeWidth={1.75} />
                  <span style={{ textAlign: 'left' }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 17,
                        fontWeight: 800,
                      }}
                    >
                      Магазин
                    </span>
                    <span
                      style={{ fontSize: 11.5, color: 'var(--muted)' }}
                    >
                      Вход для продавцов
                    </span>
                  </span>
                </span>
                <span style={{ color: 'var(--accent)', fontSize: 18 }}>→</span>
              </motion.button>

              <a
                href={CONTACTS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 4px',
                  fontSize: 12.5,
                  color: 'var(--muted)',
                  textDecoration: 'none',
                }}
              >
                <Send size={14} />
                Ещё не продаёте? Напишите менеджеру в Telegram
              </a>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ThemeToggle variant="pill" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .icon-btn {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          /* Иконка 18×18, но область нажатия — 40×40 (WCAG 2.5.8 требует ≥24) */
          min-width: 40px;
          min-height: 40px;
          margin: -11px 0;
          transition: color 0.2s;
        }
        .icon-btn:hover {
          color: var(--accent);
        }
        .icon-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
          border-radius: 4px;
        }
        /* Бургер — основное меню сайта на всех экранах */
        .mobile-menu-btn { display: flex !important; }
        @media (min-width: 1151px) {
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 1150px) {
          .desktop-nav { display: none !important; }
        }
        @media (max-width: 500px) {
          .theme-toggle-wrap { display: none; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
