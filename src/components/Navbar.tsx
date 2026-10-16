import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, ShoppingBag, Heart, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useUI } from '../context/UIContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useThrottle } from '../hooks/useDebounce';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const links = [
  { label: 'Магазин', href: '#shop' },
  { label: 'Lookbook', href: '#lookbook' },
  { label: 'О нас', href: '#about' },
  { label: 'Контакты', href: '#footer' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { openCart, openSearch } = useUI();

  useBodyLock(menuOpen);

  const handleScroll = useThrottle(() => {
    setScrolled(window.scrollY > 40);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const goToFavorites = () => {
    window.history.pushState({}, '', '/favorites');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

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
          background: scrolled ? 'rgba(8,8,10,0.75)' : 'transparent',
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
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            whileHover={{ scale: 1.02 }}
            aria-label="На главную"
            style={{ textDecoration: 'none' }}
          >
            <Logo size="md" withSuffix />
          </motion.a>

          <nav style={{ display: 'flex', gap: 48 }} className="desktop-nav">
            {links.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                whileHover={{ y: -2 }}
                style={{
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  position: 'relative',
                }}
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
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
                color: favorites.length > 0 ? 'var(--accent-red)' : 'var(--text)',
              }}
            >
              <Heart
                size={18}
                strokeWidth={1.75}
                fill={favorites.length > 0 ? 'var(--accent-red)' : 'none'}
              />
              {favorites.length > 0 && (
                <span
                  className="price-num"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    background: 'var(--accent-red)',
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

      {/* Fullscreen mobile menu */}
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
                gap: 8,
                marginTop: 'auto',
                marginBottom: 'auto',
              }}
            >
              {links.map((link, i) => (
                <motion.a
                  key={`mobile-${link.label}`}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{
                    delay: 0.1 + i * 0.07,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    fontSize: 'clamp(40px, 10vw, 72px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    lineHeight: 1.1,
                  }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.button
                onClick={() => {
                  setMenuOpen(false);
                  goToFavorites();
                }}
                initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: 0.1 + 4 * 0.07,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  fontSize: 'clamp(40px, 10vw, 72px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: 'var(--text)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  lineHeight: 1.1,
                }}
              >
                Избранное
                {favorites.length > 0 && (
                  <span
                    style={{
                      fontSize: 16,
                      padding: '4px 12px',
                      background: 'var(--accent-red)',
                      color: '#fff',
                      borderRadius: 100,
                      fontWeight: 700,
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </motion.button>
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
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 500px) {
          .theme-toggle-wrap { display: none; }
        }
      `}</style>
    </>
  );
};

export default Navbar;