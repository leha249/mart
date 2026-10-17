import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  AlertTriangle,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useAuth } from '../../context/AuthContext';
import { productsService } from '../../services/products';
import { storageService } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { useBodyLock } from '../../hooks/useBodyLock';
import { useDebounce } from '../../hooks/useDebounce';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import AdminTable from '../../components/admin/AdminTable';
import ProductForm, {
  emptyForm,
  formFromProduct,
} from '../../components/admin/ProductForm';
import type { FormState } from '../../components/admin/ProductForm';
import type { Product, UIProduct } from '../../types/database';

const AdminProducts = () => {
  const { products, loading: productsLoading, refetch } = useProducts();
  const { sellerId } = useAuth();
  const { addToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialForm, setInitialForm] = useState<FormState>(emptyForm);
  const [initialImages, setInitialImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [productSearch, setProductSearch] = useState('');
  const [openingForm, setOpeningForm] = useState(false);

  const search = useDebounce(productSearch, 250);

  useBodyLock(formOpen || deleteIds.length > 0);
  useUnsavedChanges(formOpen && !saving);

  // === ФИЛЬТРАЦИЯ ===
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  // === СТАТИСТИКА ===
  const productStats = useMemo(
    () => ({
      total: products.length,
      inStock: products.filter((p) => p.inStock).length,
      outOfStock: products.filter((p) => !p.inStock).length,
      categories: new Set(products.map((p) => p.category)).size,
    }),
    [products]
  );

  // === СОЗДАНИЕ ===
  const openCreate = () => {
    setEditingProduct(null);
    setInitialForm(emptyForm);
    setInitialImages([]);
    setFormOpen(true);
  };

  // === РЕДАКТИРОВАНИЕ ===
  const openEdit = useCallback(
    async (product: UIProduct) => {
      if (openingForm) return;
      setOpeningForm(true);
      try {
        const full = await productsService.getById(product.id);
        if (!full) {
          addToast('Товар не найден', 'error');
          return;
        }
        setEditingProduct(full);
        const f = formFromProduct(full);
        setInitialForm(f);
        setInitialImages(f.images);
        setFormOpen(true);
      } catch (e) {
        addToast('Не удалось загрузить товар', 'error');
      } finally {
        setOpeningForm(false);
      }
    },
    [openingForm, addToast]
  );

  // === СОХРАНЕНИЕ ===
  const handleSubmit = async (form: FormState) => {
    if (saving) return;
    setSaving(true);
    try {
      const firstImage = form.images[0] ?? '';
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        category: form.category.trim(),
        image: firstImage,
        images: form.images,
        tag: form.tag || null,
        sizes: form.sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colors: form.colors
          .split(',')
          .map((s) => s.trim())
          .filter((c) => c.startsWith('#')),
        rating: Number(form.rating) || 0,
        reviews: Number(form.reviews) || 0,
        in_stock: form.in_stock,
        seller_id: sellerId,
      };

      if (editingProduct) {
        const oldImages = new Set<string>();
        if (editingProduct.image) oldImages.add(editingProduct.image);
        (editingProduct.images ?? []).forEach((img) => {
          if (img) oldImages.add(img);
        });
        const newImages = new Set(form.images);
        for (const oldUrl of oldImages) {
          if (!newImages.has(oldUrl)) {
            try {
              await storageService.removeByUrl(oldUrl);
            } catch (e) {
              console.warn('Не удалось удалить старое изображение:', e);
            }
          }
        }
        await productsService.update(editingProduct.id, payload);
        addToast('Товар обновлён', 'success');
      } else {
        await productsService.create(
          payload as Omit<Product, 'id' | 'created_at' | 'updated_at'>
        );
        addToast('Товар создан', 'success');
      }

      setFormOpen(false);
      setEditingProduct(null);
      setInitialForm(emptyForm);
      setInitialImages([]);
      await refetch();
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
    if (deleteIds.length === 0) return;
    const count = deleteIds.length;
    setSaving(true);
    try {
      for (const id of deleteIds) {
        const product = products.find((p) => p.id === id);
        if (product) {
          try {
            if (product.image) {
              await storageService.removeByUrl(product.image);
            }
          } catch {}
        }
      }
      for (const id of deleteIds) {
        await productsService.remove(id);
      }
      addToast(
        count === 1 ? 'Товар удалён' : `Удалено товаров: ${count}`,
        'success'
      );
      setDeleteIds([]);
      setSelected(new Set());
      await refetch();
    } catch (e) {
      addToast('Ошибка удаления', 'error');
    } finally {
      setSaving(false);
    }
  };

  // === ДУБЛИРОВАНИЕ ===
  const handleDuplicate = async (product: UIProduct) => {
    try {
      const full = await productsService.getById(product.id);
      if (!full) return;
      const { id, created_at, updated_at, ...rest } = full;
      await productsService.create({
        ...rest,
        name: `${rest.name} (копия)`,
        seller_id: sellerId,
      } as Omit<Product, 'id' | 'created_at' | 'updated_at'>);
      addToast('Товар дублирован', 'success');
      await refetch();
    } catch (e) {
      addToast('Ошибка дублирования', 'error');
    }
  };

  // === НАЛИЧИЕ ===
  const handleToggleStock = async (product: UIProduct) => {
    try {
      await productsService.update(product.id, { in_stock: !product.inStock });
      addToast(
        product.inStock ? 'Снято с продажи' : 'Возвращено в продажу',
        'success'
      );
      await refetch();
    } catch (e) {
      addToast('Ошибка изменения наличия', 'error');
    }
  };

  // === ВЫДЕЛЕНИЕ ===
  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredProducts.every((p) => selected.has(p.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // === ПРИ СМЕНЕ ФИЛЬТРА СБРАСЫВАЕМ ВЫДЕЛЕНИЕ ===
  useEffect(() => {
    setSelected(new Set());
  }, [search]);

  const formMode: 'create' | 'edit' = editingProduct ? 'edit' : 'create';

  return (
    <>
      {/* ЗАГОЛОВОК + КНОПКА ДОБАВИТЬ */}
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
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Товары</h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openCreate}
          disabled={openingForm}
          style={{
            padding: '12px 24px',
            borderRadius: 100,
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            fontSize: 14,
            fontWeight: 700,
            cursor: openingForm ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: openingForm ? 0.6 : 1,
          }}
        >
          <Plus size={16} /> Добавить товар
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
          { label: 'Всего товаров', value: productStats.total },
          { label: 'В наличии', value: productStats.inStock },
          { label: 'Нет в наличии', value: productStats.outOfStock },
          { label: 'Категорий', value: productStats.categories },
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

      {/* ПОИСК + ВЫДЕЛЕНИЕ */}
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
            placeholder="Поиск по названию или категории..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
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
          {productSearch && (
            <button
              onClick={() => setProductSearch('')}
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

        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--muted)' }}>
                Выбрано:{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  {selected.size}
                </strong>
              </span>
              <button
                onClick={() => setDeleteIds(Array.from(selected))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                }}
              >
                <Trash2 size={14} /> Удалить
              </button>
              <button
                onClick={() => setSelected(new Set())}
                aria-label="Снять выделение"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
        <AdminTable
          products={filteredProducts}
          loading={productsLoading}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={openEdit}
          onDelete={(id) => setDeleteIds([id])}
          onDuplicate={handleDuplicate}
          onToggleStock={handleToggleStock}
          search={search}
        />
      </div>

      {/* МОДАЛКА: PRODUCT FORM */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="product-form-backdrop"
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
              key="product-form-panel"
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
                maxWidth: 720,
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
                  {formMode === 'edit' ? 'Редактировать товар' : 'Новый товар'}
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

              <ProductForm
                mode={formMode}
                initialForm={initialForm}
                initialImages={initialImages}
                saving={saving}
                onSubmit={handleSubmit}
                onCancel={() => setFormOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛКА: DELETE PRODUCTS */}
      <AnimatePresence>
        {deleteIds.length > 0 && (
          <motion.div
            key="delete-products-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setDeleteIds([])}
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
              key="delete-products-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 32,
                maxWidth: 420,
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
                Удалить{' '}
                {deleteIds.length === 1
                  ? 'товар'
                  : `${deleteIds.length} товаров`}
                ?
              </h3>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Действие нельзя отменить. Изображения также будут удалены из
                хранилища.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setDeleteIds([])}
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

      {/* ПЛАШКА «ЗАГРУЗКА ТОВАРА» (при открытии формы редактирования) */}
      {openingForm && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '12px 20px',
            borderRadius: 100,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'var(--shadow-md)',
            zIndex: 500,
          }}
        >
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Загрузка товара...
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          div[style*="padding: 32px"] {
            padding: 24px 20px !important;
          }
        }
      `}</style>
    </>
  );
};

export default AdminProducts;