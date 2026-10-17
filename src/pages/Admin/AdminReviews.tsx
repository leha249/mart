import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Download } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { useProducts } from '../../context/ProductsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import ReviewsTable from '../../components/admin/ReviewsTable';
import { exportReviewsToCSV } from '../../utils/export';

const AdminReviews = () => {
  const {
    reviews,
    loading: reviewsLoading,
    filter,
    search: reviewsSearch,
    pendingCount,
    setFilter,
    setSearch,
    approve,
    reject,
    removeReview,
  } = useReviews();
  const { products } = useProducts();
  const { role } = useAuth();
  const { addToast } = useToast();

  const isSeller = role === 'seller';

  const [searchInput, setSearchInput] = useState(reviewsSearch);
  const searchDebounced = useDebounce(searchInput, 300);

  // Применяем поиск в контекст с дебаунсом
  useEffect(() => {
    if (reviewsSearch !== searchDebounced) {
      setSearch(searchDebounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced]);

  // Карта товаров: id → { name, image }
  const productsMap = useMemo(() => {
    const map: Record<number, { name: string; image: string }> = {};
    products.forEach((p) => {
      map[p.id] = { name: p.name, image: p.image };
    });
    return map;
  }, [products]);

  const handleApprove = async (id: number) => {
    try {
      await approve(id);
      addToast('Отзыв одобрен', 'success');
    } catch (e) {
      addToast('Ошибка одобрения', 'error');
      throw e;
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reject(id);
      addToast('Отзыв отклонён', 'info');
    } catch (e) {
      addToast('Ошибка отклонения', 'error');
      throw e;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await removeReview(id);
      addToast('Отзыв удалён', 'success');
    } catch (e) {
      addToast('Ошибка удаления', 'error');
      throw e;
    }
  };

  const handleExport = () => {
    if (reviews.length === 0) {
      addToast('Нет отзывов для экспорта', 'info');
      return;
    }
    exportReviewsToCSV(reviews);
    addToast(`Экспортировано отзывов: ${reviews.length}`, 'success');
  };

  const filterTabs = [
    { key: 'pending' as const, label: 'Ожидают' },
    { key: 'approved' as const, label: 'Одобрены' },
    { key: 'all' as const, label: 'Все' },
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
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>
          {isSeller ? 'Отзывы на мои товары' : 'Отзывы'}
        </h2>
        {!isSeller && reviews.length > 0 && (
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
            <Download size={16} /> Экспорт отзывов
          </motion.button>
        )}
      </div>

      {/* СТАТИСТИКА (только админ) */}
      {!isSeller && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: 'Ожидают модерации',
              value: pendingCount,
              accent: pendingCount > 0,
            },
            {
              label: 'Всего показано',
              value: reviews.length,
            },
            {
              label: 'Одобренных',
              value: reviews.filter((r) => r.approved).length,
            },
            {
              label: 'Средний рейтинг',
              value:
                reviews.length > 0
                  ? (
                      reviews.reduce((s, r) => s + r.rating, 0) /
                      reviews.length
                    ).toFixed(1)
                  : '—',
            },
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
            placeholder="Поиск по имени автора или тексту..."
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

        {!isSeller && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filterTabs.map((f) => {
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {f.label}
                  {f.key === 'pending' && pendingCount > 0 && (
                    <span
                      style={{
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        borderRadius: 100,
                        background: isActive ? '#000' : 'var(--danger)',
                        color: isActive ? 'var(--accent)' : '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
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
        <ReviewsTable
          reviews={reviews}
          loading={reviewsLoading}
          productsMap={productsMap}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          search={reviewsSearch}
          readonly={isSeller}
        />
      </div>
    </>
  );
};

export default AdminReviews;