import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Loader2, Download } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import OrdersTable from '../../components/admin/OrdersTable';
import OrderModal from '../../components/admin/OrderModal';
import type { Order, OrderStatus } from '../../types/database';
import { formatPrice } from '../../utils/format';
import { exportOrdersToCSV } from '../../utils/export';

const AdminOrders = () => {
  const {
    orders,
    stats: orderStats,
    loading: ordersLoading,
    loadingMore,
    hasMore,
    filters,
    setStatusFilter,
    setSearchFilter,
    loadMore,
    updateStatus,
    removeOrder,
  } = useOrders();
  const { addToast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const searchDebounced = useDebounce(searchInput, 300);

  // Применяем поиск в контекст с дебаунсом
  useEffect(() => {
    if (filters.search !== searchDebounced) {
      setSearchFilter(searchDebounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced]);

  // Если открыт заказ — обновляем его при изменениях в списке
  useEffect(() => {
    if (!selectedOrder) return;
    const updated = orders.find((o) => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  }, [orders, selectedOrder]);

  const handleStatusUpdate = async (id: number, status: OrderStatus) => {
    try {
      await updateStatus(id, status);
      addToast('Статус обновлён', 'success');
    } catch (e) {
      addToast('Ошибка изменения статуса', 'error');
      throw e;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeOrder(id);
      addToast('Заказ удалён', 'success');
    } catch (e) {
      addToast('Ошибка удаления', 'error');
      throw e;
    }
  };

  const handleExport = () => {
    if (orders.length === 0) {
      addToast('Нет заказов для экспорта', 'info');
      return;
    }
    exportOrdersToCSV(orders);
    addToast(`Экспортировано заказов: ${orders.length}`, 'success');
  };

  const statusFilters = [
    { key: 'all' as const, label: 'Все' },
    { key: 'new' as const, label: 'Новые' },
    { key: 'processing' as const, label: 'В работе' },
    { key: 'shipped' as const, label: 'Отправлены' },
    { key: 'delivered' as const, label: 'Доставлены' },
    { key: 'cancelled' as const, label: 'Отменены' },
  ];

  return (
    <>
      {/* ЗАГОЛОВОК + ЭКСПОРТ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Заказы</h2>
        {orders.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            style={{
              padding: '12px 24px',
              borderRadius: 100,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Download size={16} /> Экспорт CSV
          </motion.button>
        )}
      </div>

      {/* СТАТИСТИКА */}
      {orderStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Всего', value: orderStats.total },
            {
              label: 'Новые',
              value: orderStats.new,
              accent: orderStats.new > 0,
            },
            { label: 'В работе', value: orderStats.processing },
            { label: 'Доставлено', value: orderStats.delivered },
            { label: 'Отменено', value: orderStats.cancelled },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                className="price-num"
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: s.accent ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
          <div
            style={{
              padding: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              gridColumn: 'span 2',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                marginBottom: 4,
              }}
            >
              Выручка (без отмен)
            </div>
            <div
              className="price-num"
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--success)',
              }}
            >
              {formatPrice(orderStats.revenue)}
            </div>
          </div>
        </div>
      )}

      {/* ПОИСК + ФИЛЬТР */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            maxWidth: 400,
            minWidth: 200,
          }}
        >
          <Search
            size={16}
            color="var(--muted)"
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Поиск по имени, телефону, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 42px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 100,
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              aria-label="Очистить"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statusFilters.map((f) => {
            const isActive = filters.status === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 100,
                  border: '1px solid',
                  borderColor: isActive
                    ? 'var(--accent)'
                    : 'var(--border)',
                  background: isActive
                    ? 'var(--accent)'
                    : 'transparent',
                  color: isActive ? '#000' : 'var(--muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <OrdersTable
          orders={orders}
          loading={ordersLoading}
          onOpen={setSelectedOrder}
          search={filters.search || ''}
        />

        {hasMore && !ordersLoading && (
          <div
            style={{
              padding: 20,
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                padding: '12px 28px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingMore ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                opacity: loadingMore ? 0.6 : 1,
              }}
            >
              {loadingMore && (
                <Loader2
                  size={14}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              )}
              {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
            </button>
          </div>
        )}
      </div>

      {/* МОДАЛКА ЗАКАЗА */}
      <OrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusUpdate}
        onDelete={handleDelete}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AdminOrders;