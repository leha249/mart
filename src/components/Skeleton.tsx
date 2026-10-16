import type { CSSProperties } from 'react';

interface BaseProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
  className?: string;
}

const Skeleton = ({
  width = '100%',
  height = 20,
  radius = 8,
  style,
  className,
}: BaseProps) => (
  <div
    className={`skeleton ${className || ''}`}
    style={{
      width,
      height,
      borderRadius: radius,
      ...style,
    }}
    aria-hidden="true"
  />
);

/** Скелетон карточки товара */
export const ProductCardSkeleton = () => (
  <div
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}
  >
    <Skeleton height="auto" style={{ aspectRatio: '3/4', borderRadius: 0 }} />
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton width={70} height={11} />
      <Skeleton height={16} />
      <Skeleton width="40%" height={17} />
    </div>
  </div>
);

/** Сетка скелетонов товаров */
export const ProductsGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div
    className="products-grid"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24,
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

/** Скелетон строки таблицы */
export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <tr style={{ borderBottom: '1px solid var(--border)' }}>
    <td style={{ padding: 12 }}>
      <Skeleton width={44} height={56} radius={8} />
    </td>
    {Array.from({ length: cols - 1 }).map((_, i) => (
      <td key={i} style={{ padding: 12 }}>
        <Skeleton height={14} width={i === 0 ? '60%' : '40%'} />
      </td>
    ))}
  </tr>
);

/** Скелетон карточки заказа */
export const OrderCardSkeleton = () => (
  <div
    style={{
      padding: 16,
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Skeleton width={60} height={14} />
      <Skeleton width={80} height={18} radius={100} />
    </div>
    <Skeleton height={14} width="60%" />
    <Skeleton height={12} width="40%" />
  </div>
);

export default Skeleton;