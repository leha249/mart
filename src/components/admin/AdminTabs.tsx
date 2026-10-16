import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  FolderOpen,
  MessageSquare,
  BarChart3,
  Tag,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'categories'
  | 'reviews'
  | 'promocodes';

interface Props {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
  ordersBadge?: number;
  reviewsBadge?: number;
}

const AdminTabs = ({
  active,
  onChange,
  ordersBadge = 0,
  reviewsBadge = 0,
}: Props) => {
  const tabs: {
    key: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { key: 'dashboard', label: 'Дашборд', icon: <BarChart3 size={16} /> },
    { key: 'products', label: 'Товары', icon: <Package size={16} /> },
    {
      key: 'orders',
      label: 'Заказы',
      icon: <ShoppingCart size={16} />,
      badge: ordersBadge > 0 ? ordersBadge : undefined,
    },
    {
      key: 'categories',
      label: 'Категории',
      icon: <FolderOpen size={16} />,
    },
    {
      key: 'reviews',
      label: 'Отзывы',
      icon: <MessageSquare size={16} />,
      badge: reviewsBadge > 0 ? reviewsBadge : undefined,
    },
    { key: 'promocodes', label: 'Промокоды', icon: <Tag size={16} /> },
  ];

  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 100,
        marginBottom: 32,
        width: 'fit-content',
        maxWidth: '100%',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            role="tab"
            aria-selected={isActive}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 100,
              border: 'none',
              background: 'transparent',
              color: isActive ? '#000' : 'var(--muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.25s',
              zIndex: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="admin-tab-bg"
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--accent)',
                  borderRadius: 100,
                  zIndex: -1,
                }}
              />
            )}
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 100,
                  background: isActive ? '#000' : 'var(--danger)',
                  color: isActive ? 'var(--accent)' : '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
      <style>{`
        div[role="tablist"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminTabs;