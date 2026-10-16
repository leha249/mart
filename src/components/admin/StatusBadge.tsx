import type { OrderStatus } from '../../types/database';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../types/database';

interface Props {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

const StatusBadge = ({ status, size = 'md' }: Props) => {
  const colors = ORDER_STATUS_COLORS[status];
  const label = ORDER_STATUS_LABELS[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: size === 'sm' ? '3px 10px' : '5px 12px',
        borderRadius: 100,
        background: colors.bg,
        color: colors.text,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: colors.text,
          boxShadow: `0 0 6px ${colors.text}`,
        }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;