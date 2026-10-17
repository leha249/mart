import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useCategories } from '../../context/CategoriesContext';
import { useProducts } from '../../context/ProductsContext';
import { useAuth } from '../../context/AuthContext';
import { categoriesService } from '../../services/categories';
import { useToast } from '../../context/ToastContext';
import { useBodyLock } from '../../hooks/useBodyLock';
import { useDebounce } from '../../hooks/useDebounce';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import CategoriesTable from '../../components/admin/CategoriesTable';
import CategoryForm, {
  emptyCategoryForm,
  categoryFormFrom,
} from '../../components/admin/CategoryForm';
import type { CategoryFormState } from '../../components/admin/CategoryForm';
import type { Category } from '../../types/database';

const AdminCategories = () => {
  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const { products, refetch: refetchProducts } = useProducts();
  const { sellerId } = useAuth();
  const { addToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [initialForm, setInitialForm] =
    useState<CategoryFormState>(emptyCategoryForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const searchDebounced = useDebounce(searchInput, 250);

  useBodyLock(formOpen || deleteId !== null);
  useUnsavedChanges(formOpen && !saving);

  // === КОЛИЧЕСТВО ТОВАРОВ ПО КАТЕГОРИЯМ ===
  const productsCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  // === ФИЛЬТРАЦИЯ ===
  const filteredCategories = useMemo(() => {
    if (!searchDebounced.trim()) return categories;
    const q = searchDebounced.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, searchDebounced]);

  // === СТАТИСТИКА ===
  const stats = useMemo(
    () => ({
      total: categories.length,
      withProducts: categories.filter(
        (c) => (productsCountByCategory[c.name] || 0) > 0
      ).length,
      empty: categories.filter(
        (c) => (productsCountByCategory[c.name] || 0) === 0
      ).length,
      productsInCatalog: products.length,
    }),
    [categories, productsCountByCategory, products.length]
  );

  // === СОЗДАНИЕ ===
  const openCreate = () => {
    setEditingCategory(null);
    setInitialForm(emptyCategoryForm);
    setFormOpen(true);
  };

  // === РЕДАКТИРОВАНИЕ ===
  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setInitialForm(categoryFormFrom(category));
    setFormOpen(true);
  };

  // === СОХРАНЕНИЕ ===
  const handleSubmit = async (form: CategoryFormState) => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        seller_id: sellerId,
      };

      if (editingCategory) {
        const oldName = editingCategory.name;
        await categoriesService.update(editingCategory.id, {
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          sort_order: payload.sort_order,
        });
        if (oldName !== payload.name) {
          try {
            await categoriesService.renameInProducts(
              oldName,
              payload.name,
              sellerId
            );
            await refetchProducts();
          } catch (e) {
            console.warn('Не удалось переименовать категорию в товарах:', e);
            addToast(
              'Категория обновлена, но не все товары переименованы',
              'error'
            );
          }
        }
        addToast('Категория обновлена', 'success');
      } else {
        await categoriesService.create(payload);
        addToast('Категория создана', 'success');
      }

      setFormOpen(false);
      setEditingCategory(null);
      setInitialForm(emptyCategoryForm);
      await refetchCategories();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      addToast(msg, 'error');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // === УДАЛЕНИЕ ===
  const handleDelete = async () => {
    if (deleteId === null) return;
    setSaving(true);
    try {
      await categoriesService.remove(deleteId);
      addToast('Категория удалена', 'success');
      setDeleteId(null);
      await refetchCategories();
    } catch (e) {
      addToast('Ошибка удаления', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deletingCategory = useMemo(
    () => categories.find((c) => c.id === deleteId) || null,
    [categories, deleteId]
  );

  const deletingCategoryProductsCount = deletingCategory
    ? productsCountByCategory[deletingCategory.name] || 0
    : 0;

  const formMode: 'create' | 'edit' = editingCategory ? 'edit' : 'create';

  return (
    <>
      {/* ЗАГОЛОВОК + КНОПКА */}
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
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Категории</h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          style={{
            padding: '12px 24px',
            borderRadius: 100,
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={16} /> Добавить категорию
        </motion.button>
      </div>

      {/* СТАТИСТИКА */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Всего категорий', value: stats.total },
          { label: 'С товарами', value: stats.withProducts },
          { label: 'Пустых', value: stats.empty },
          { label: 'Товаров в каталоге', value: stats.productsInCatalog },
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
            <div className="price-num" style={{ fontSize: 24, fontWeight: 700 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ПОИСК */}
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
            placeholder="Поиск по названию или slug..."
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
        <CategoriesTable
          categories={filteredCategories}
          loading={categoriesLoading}
          productsCount={productsCountByCategory}
          onEdit={openEdit}
          onDelete={setDeleteId}
          search={searchDebounced}
        />
      </div>

      {/* МОДАЛКА: CATEGORY FORM */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="category-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setFormOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 500,
              overflowY: 'auto',
              padding: 20,
            }}
          >
            <motion.div
              key="category-form-panel"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: 32,
                width: '100%',
                maxWidth: 560,
                margin: '40px auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>
                  {formMode === 'edit'
                    ? 'Редактировать категорию'
                    : 'Новая категория'}
                </h2>
                <button
                  type="button"
                  onClick={() => !saving && setFormOpen(false)}
                  disabled={saving}
                  aria-label="Закрыть"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    padding: 4,
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              <CategoryForm
                mode={formMode}
                initialForm={initialForm}
                editingId={editingCategory?.id}
                saving={saving}
                onSubmit={handleSubmit}
                onCancel={() => setFormOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛКА: DELETE CATEGORY */}
      <AnimatePresence>
        {deletingCategory && (
          <motion.div
            key="delete-category-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setDeleteId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              key="delete-category-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 32,
                maxWidth: 440,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(255,77,77,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--danger)',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
                Удалить категорию «{deletingCategory.name}»?
              </h3>

              {deletingCategoryProductsCount > 0 ? (
                <div
                  style={{
                    padding: 14,
                    background: 'rgba(255,77,77,0.08)',
                    border: '1px solid rgba(255,77,77,0.25)',
                    borderRadius: 12,
                    fontSize: 13,
                    color: 'var(--danger)',
                    marginBottom: 24,
                    textAlign: 'left',
                  }}
                >
                  ⚠️ С этой категорией связано{' '}
                  <strong>{deletingCategoryProductsCount}</strong> товаров.
                </div>
              ) : (
                <p
                  style={{
                    color: 'var(--muted)',
                    fontSize: 14,
                    marginBottom: 24,
                  }}
                >
                  Категория пуста. Действие нельзя отменить.
                </p>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      Удаление...
                    </>
                  ) : (
                    'Удалить'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AdminCategories;