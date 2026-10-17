import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  AlertTriangle,
  X,
  ArrowLeft,
  Trash2,
  Loader2,
  LogOut,
  Download,
} from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useOrders } from '../context/OrdersContext';
import { useCategories } from '../context/CategoriesContext';
import { useReviews } from '../context/ReviewsContext';
import { usePromocodesAdmin } from '../context/PromocodesAdminContext';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../services/products';
import { categoriesService } from '../services/categories';
import { promocodesService } from '../services/promocodes';
import { storageService } from '../services/storage';
import { useToast } from '../context/ToastContext';
import { useBodyLock } from '../hooks/useBodyLock';
import { useDebounce } from '../hooks/useDebounce';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useCmdK } from '../hooks/useHotkey';
import AdminTable from '../components/admin/AdminTable';
import ProductForm, {
  emptyForm,
  formFromProduct,
} from '../components/admin/ProductForm';
import type { FormState } from '../components/admin/ProductForm';
import AdminTabs from '../components/admin/AdminTabs';
import type { AdminTab } from '../components/admin/AdminTabs';
import OrdersTable from '../components/admin/OrdersTable';
import OrderModal from '../components/admin/OrderModal';
import CategoriesTable from '../components/admin/CategoriesTable';
import CategoryForm, {
  emptyCategoryForm,
  categoryFormFrom,
} from '../components/admin/CategoryForm';
import type { CategoryFormState } from '../components/admin/CategoryForm';
import ReviewsTable from '../components/admin/ReviewsTable';
import Dashboard from '../components/admin/Dashboard';
import PromocodesTable from '../components/admin/PromocodesTable';
import PromocodeForm, {
  emptyPromoForm,
  promoFormFrom,
} from '../components/admin/PromocodeForm';
import type { PromoFormState } from '../components/admin/PromocodeForm';
import type {
  Category,
  Order,
  OrderStatus,
  Product,
  Promocode,
  UIProduct,
} from '../types/database';
import { formatPrice } from '../utils/format';
import {
  exportOrdersToCSV,
  exportReviewsToCSV,
  exportPromocodesToCSV,
} from '../utils/export';

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { products, loading: productsLoading, refetch } = useProducts();
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
    newOrdersCount,
    markAllSeen,
  } = useOrders();
  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const {
    reviews,
    loading: reviewsLoading,
    filter: reviewsFilter,
    search: reviewsSearch,
    pendingCount: reviewsPendingCount,
    setFilter: setReviewsFilter,
    setSearch: setReviewsSearch,
    approve: approveReview,
    reject: rejectReview,
    removeReview,
  } = useReviews();
  const {
    promocodes,
    loading: promocodesLoading,
    refetch: refetchPromocodes,
  } = usePromocodesAdmin();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialForm, setInitialForm] = useState<FormState>(emptyForm);
  const [initialImages, setInitialImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [productSearch, setProductSearch] = useState('');
  const [openingForm, setOpeningForm] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [initialCategoryForm, setInitialCategoryForm] =
    useState<CategoryFormState>(emptyCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');

  const [reviewSearchInput, setReviewSearchInput] = useState(reviewsSearch);

  const [promoFormOpen, setPromoFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promocode | null>(null);
  const [initialPromoForm, setInitialPromoForm] =
    useState<PromoFormState>(emptyPromoForm);
  const [savingPromo, setSavingPromo] = useState(false);
  const [deletePromoId, setDeletePromoId] = useState<number | null>(null);
  const [promoSearch, setPromoSearch] = useState('');

  const search = useDebounce(productSearch, 250);
  const categorySearchDebounced = useDebounce(categorySearch, 250);
  const orderSearchDebounced = useDebounce(filters.search || '', 300);
  const reviewSearchDebounced = useDebounce(reviewSearchInput, 300);

  const isModalOpen =
    formOpen ||
    categoryFormOpen ||
    promoFormOpen ||
    selectedOrder !== null ||
    deleteIds.length > 0 ||
    deleteCategoryId !== null ||
    deletePromoId !== null;

  useCmdK(() => {
    if (isModalOpen) return;

    const selector = 'input[placeholder^="Поиск"]';
    const input = document.querySelector<HTMLInputElement>(selector);
    if (input) {
      input.focus();
      input.select();
    }
  });

  useBodyLock(isModalOpen);
  useUnsavedChanges((formOpen || categoryFormOpen || promoFormOpen) && !saving);

  useEffect(() => {
    if (filters.search !== orderSearchDebounced) {
      setSearchFilter(orderSearchDebounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSearchDebounced]);

  useEffect(() => {
    if (reviewsSearch !== reviewSearchDebounced) {
      setReviewsSearch(reviewSearchDebounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewSearchDebounced]);

  useEffect(() => {
    if (!selectedOrder) return;
    const updated = orders.find((o) => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  }, [orders, selectedOrder]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [user, authLoading]);

  useEffect(() => {
    let title = 'Админ — MØRA MART';
    if (activeTab === 'dashboard') title = 'Дашборд — MØRA MART';
    if (activeTab === 'orders') title = `Заказы (${newOrdersCount}) — MØRA MART`;
    if (activeTab === 'products') title = 'Товары — MØRA MART';
    if (activeTab === 'categories') title = 'Категории — MØRA MART';
    if (activeTab === 'reviews')
      title = `Отзывы (${reviewsPendingCount}) — MØRA MART`;
    if (activeTab === 'promocodes') title = 'Промокоды — MØRA MART';
    document.title = title;
    return () => {
      document.title = 'MØRA MART';
    };
  }, [activeTab, newOrdersCount, reviewsPendingCount]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'orders') {
      setTimeout(markAllSeen, 500);
    }
  };

  const handleSignOut = async () => {
    const ok = window.confirm('Выйти из аккаунта?');
    if (!ok) return;
    try {
      localStorage.removeItem('mora-cart-v1');
      localStorage.removeItem('mora-favorites-v1');
      localStorage.removeItem('mora-promo-v1');
      localStorage.removeItem('mora-recently-viewed-v1');
      localStorage.removeItem('mora-search-history-v1');

      await signOut();
      addToast('Вы вышли из аккаунта', 'info');
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (e) {
      addToast('Ошибка выхода', 'error');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openCreate = () => {
    setEditingProduct(null);
    setInitialForm(emptyForm);
    setInitialImages([]);
    setFormOpen(true);
  };

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

  const handleDuplicate = async (product: UIProduct) => {
    try {
      const full = await productsService.getById(product.id);
      if (!full) return;
      const { id, created_at, updated_at, ...rest } = full;
      await productsService.create({
        ...rest,
        name: `${rest.name} (копия)`,
      } as Omit<Product, 'id' | 'created_at' | 'updated_at'>);
      addToast('Товар дублирован', 'success');
      await refetch();
    } catch (e) {
      addToast('Ошибка дублирования', 'error');
    }
  };

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

  const productStats = useMemo(
    () => ({
      total: products.length,
      inStock: products.filter((p) => p.inStock).length,
      outOfStock: products.filter((p) => !p.inStock).length,
      categories: new Set(products.map((p) => p.category)).size,
    }),
    [products]
  );

  const handleOrderStatusUpdate = async (id: number, status: OrderStatus) => {
    try {
      await updateStatus(id, status);
      addToast('Статус обновлён', 'success');
    } catch (e) {
      addToast('Ошибка изменения статуса', 'error');
      throw e;
    }
  };

  const handleOrderDelete = async (id: number) => {
    try {
      await removeOrder(id);
      addToast('Заказ удалён', 'success');
    } catch (e) {
      addToast('Ошибка удаления', 'error');
      throw e;
    }
  };

  const handleExportOrders = () => {
    if (orders.length === 0) {
      addToast('Нет заказов для экспорта', 'info');
      return;
    }
    exportOrdersToCSV(orders);
    addToast(`Экспортировано заказов: ${orders.length}`, 'success');
  };

  const handleExportReviews = () => {
    if (reviews.length === 0) {
      addToast('Нет отзывов для экспорта', 'info');
      return;
    }
    exportReviewsToCSV(reviews);
    addToast(`Экспортировано отзывов: ${reviews.length}`, 'success');
  };

  const handleExportPromocodes = () => {
    if (promocodes.length === 0) {
      addToast('Нет промокодов для экспорта', 'info');
      return;
    }
    exportPromocodesToCSV(promocodes);
    addToast(`Экспортировано промокодов: ${promocodes.length}`, 'success');
  };

  const productsCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchDebounced.trim()) return categories;
    const q = categorySearchDebounced.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categories, categorySearchDebounced]);

  const openCategoryCreate = () => {
    setEditingCategory(null);
    setInitialCategoryForm(emptyCategoryForm);
    setCategoryFormOpen(true);
  };

  const openCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setInitialCategoryForm(categoryFormFrom(category));
    setCategoryFormOpen(true);
  };

  const handleCategorySubmit = async (form: CategoryFormState) => {
    if (savingCategory) return;
    setSavingCategory(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingCategory) {
        const oldName = editingCategory.name;
        await categoriesService.update(editingCategory.id, payload);
        if (oldName !== payload.name) {
          try {
            await categoriesService.renameInProducts(oldName, payload.name);
            await refetch();
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

      setCategoryFormOpen(false);
      setEditingCategory(null);
      setInitialCategoryForm(emptyCategoryForm);
      await refetchCategories();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      addToast(msg, 'error');
      throw e;
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategoryDelete = async () => {
    if (deleteCategoryId === null) return;
    setSavingCategory(true);
    try {
      await categoriesService.remove(deleteCategoryId);
      addToast('Категория удалена', 'success');
      setDeleteCategoryId(null);
      await refetchCategories();
    } catch (e) {
      addToast('Ошибка удаления', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const productsMap = useMemo(() => {
    const map: Record<number, { name: string; image: string }> = {};
    products.forEach((p) => {
      map[p.id] = { name: p.name, image: p.image };
    });
    return map;
  }, [products]);

  const handleApproveReview = async (id: number) => {
    try {
      await approveReview(id);
      addToast('Отзыв одобрен', 'success');
    } catch (e) {
      addToast('Ошибка одобрения', 'error');
      throw e;
    }
  };

  const handleRejectReview = async (id: number) => {
    try {
      await rejectReview(id);
      addToast('Отзыв отклонён', 'info');
    } catch (e) {
      addToast('Ошибка отклонения', 'error');
      throw e;
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      await removeReview(id);
      addToast('Отзыв удалён', 'success');
    } catch (e) {
      addToast('Ошибка удаления', 'error');
      throw e;
    }
  };

  const filteredPromocodes = useMemo(() => {
    if (!promoSearch.trim()) return promocodes;
    const q = promoSearch.toLowerCase();
    return promocodes.filter((p) => p.code.toLowerCase().includes(q));
  }, [promocodes, promoSearch]);

  const openPromoCreate = () => {
    setEditingPromo(null);
    setInitialPromoForm(emptyPromoForm);
    setPromoFormOpen(true);
  };

  const openPromoEdit = (promo: Promocode) => {
    setEditingPromo(promo);
    setInitialPromoForm(promoFormFrom(promo));
    setPromoFormOpen(true);
  };

  const handlePromoSubmit = async (form: PromoFormState) => {
    if (savingPromo) return;
    setSavingPromo(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_percent: Number(form.discount_percent),
        min_total: Number(form.min_total) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at
          ? new Date(form.expires_at).toISOString()
          : null,
        active: form.active,
      };

      if (editingPromo) {
        await promocodesService.update(editingPromo.id, payload);
        addToast('Промокод обновлён', 'success');
      } else {
        await promocodesService.create(payload);
        addToast('Промокод создан', 'success');
      }

      setPromoFormOpen(false);
      setEditingPromo(null);
      setInitialPromoForm(emptyPromoForm);
      await refetchPromocodes();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      addToast(msg, 'error');
      throw e;
    } finally {
      setSavingPromo(false);
    }
  };

  const handlePromoDelete = async () => {
    if (deletePromoId === null) return;
    setSavingPromo(true);
    try {
      await promocodesService.remove(deletePromoId);
      addToast('Промокод удалён', 'success');
      setDeletePromoId(null);
      await refetchPromocodes();
    } catch (e) {
      addToast('Ошибка удаления', 'error');
    } finally {
      setSavingPromo(false);
    }
  };

  const handlePromoToggleActive = async (promo: Promocode) => {
    try {
      await promocodesService.toggleActive(promo.id, !promo.active);
      addToast(
        promo.active ? 'Промокод выключен' : 'Промокод включён',
        'success'
      );
      await refetchPromocodes();
    } catch (e) {
      addToast('Ошибка', 'error');
    }
  };

  const formMode: 'create' | 'edit' = editingProduct ? 'edit' : 'create';
  const categoryFormMode: 'create' | 'edit' = editingCategory
    ? 'edit'
    : 'create';
  const promoFormMode: 'create' | 'edit' = editingPromo ? 'edit' : 'create';

  const deletingCategory = useMemo(
    () => categories.find((c) => c.id === deleteCategoryId) || null,
    [categories, deleteCategoryId]
  );

  const deletingCategoryProductsCount = deletingCategory
    ? productsCountByCategory[deletingCategory.name] || 0
    : 0;

  const deletingPromo = useMemo(
    () => promocodes.find((p) => p.id === deletePromoId) || null,
    [promocodes, deletePromoId]
  );

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
        }}
      >
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Админ-панель
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: '-1px',
                display: 'inline-flex',
                alignItems: 'baseline',
              }}
            >
              MØRA
              <span
                style={{
                  color: 'var(--accent)',
                  display: 'inline-block',
                }}
              >
                .
              </span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: '3px',
                  color: 'var(--muted)',
                  marginLeft: 6,
                  textTransform: 'uppercase',
                }}
              >
                MART
              </span>
            </h1>
            {user.email && (
              <div
                style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}
              >
                {user.email}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="/"
              style={{
                padding: '12px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                color: 'var(--text)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ArrowLeft size={16} /> На сайт
            </a>

            <button
              onClick={handleSignOut}
              style={{
                padding: '12px 20px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <LogOut size={16} /> Выйти
            </button>

            {activeTab === 'products' && (
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
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: openingForm ? 0.6 : 1,
                }}
              >
                <Plus size={16} /> Добавить товар
              </motion.button>
            )}

            {activeTab === 'categories' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={openCategoryCreate}
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
            )}

            {activeTab === 'promocodes' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={openPromoCreate}
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
                <Plus size={16} /> Добавить промокод
              </motion.button>
            )}

            {activeTab === 'orders' && orders.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportOrders}
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

            {activeTab === 'reviews' && reviews.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportReviews}
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

            {activeTab === 'promocodes' && promocodes.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportPromocodes}
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
        </div>

        <AdminTabs
          active={activeTab}
          onChange={handleTabChange}
          ordersBadge={newOrdersCount}
          reviewsBadge={reviewsPendingCount}
        />

        {activeTab === 'dashboard' && <Dashboard />}

        {activeTab === 'products' && (
          <>
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
                  <div
                    className="price-num"
                    style={{ fontSize: 24, fontWeight: 700 }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

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
          </>
        )}

        {activeTab === 'orders' && (
          <>
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
                  value={filters.search || ''}
                  onChange={(e) => setSearchFilter(e.target.value)}
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
                {filters.search && (
                  <button
                    onClick={() => setSearchFilter('')}
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
                {[
                  { key: 'all' as const, label: 'Все' },
                  { key: 'new' as const, label: 'Новые' },
                  { key: 'processing' as const, label: 'В работе' },
                  { key: 'shipped' as const, label: 'Отправлены' },
                  { key: 'delivered' as const, label: 'Доставлены' },
                  { key: 'cancelled' as const, label: 'Отменены' },
                ].map((f) => {
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
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {[
                { label: 'Всего категорий', value: categories.length },
                {
                  label: 'С товарами',
                  value: categories.filter(
                    (c) => (productsCountByCategory[c.name] || 0) > 0
                  ).length,
                },
                {
                  label: 'Пустых',
                  value: categories.filter(
                    (c) => (productsCountByCategory[c.name] || 0) === 0
                  ).length,
                },
                {
                  label: 'Товаров в каталоге',
                  value: products.length,
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
                    style={{ fontSize: 24, fontWeight: 700 }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

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
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
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
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
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
                onEdit={openCategoryEdit}
                onDelete={setDeleteCategoryId}
                search={categorySearchDebounced}
              />
            </div>
          </>
        )}

        {activeTab === 'reviews' && (
          <>
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
                  value: reviewsPendingCount,
                  accent: reviewsPendingCount > 0,
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
                  value={reviewSearchInput}
                  onChange={(e) => setReviewSearchInput(e.target.value)}
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
                {reviewSearchInput && (
                  <button
                    onClick={() => setReviewSearchInput('')}
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
                {[
                  { key: 'pending' as const, label: 'Ожидают' },
                  { key: 'approved' as const, label: 'Одобрены' },
                  { key: 'all' as const, label: 'Все' },
                ].map((f) => {
                  const isActive = reviewsFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setReviewsFilter(f.key)}
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
                      {f.key === 'pending' && reviewsPendingCount > 0 && (
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
                          {reviewsPendingCount > 99
                            ? '99+'
                            : reviewsPendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

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
                onApprove={handleApproveReview}
                onReject={handleRejectReview}
                onDelete={handleDeleteReview}
                search={reviewsSearch}
              />
            </div>
          </>
        )}

        {activeTab === 'promocodes' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {[
                { label: 'Всего промокодов', value: promocodes.length },
                {
                  label: 'Активных',
                  value: promocodes.filter((p) => p.active).length,
                },
                {
                  label: 'Использовано раз',
                  value: promocodes.reduce((s, p) => s + p.used_count, 0),
                },
                {
                  label: 'Средняя скидка',
                  value:
                    promocodes.length > 0
                      ? Math.round(
                          promocodes.reduce(
                            (s, p) => s + p.discount_percent,
                            0
                          ) / promocodes.length
                        ) + '%'
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
                    style={{ fontSize: 24, fontWeight: 700 }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

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
                  placeholder="Поиск по коду..."
                  value={promoSearch}
                  onChange={(e) => setPromoSearch(e.target.value)}
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
                    textTransform: 'uppercase',
                  }}
                />
                {promoSearch && (
                  <button
                    onClick={() => setPromoSearch('')}
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

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <PromocodesTable
                promocodes={filteredPromocodes}
                loading={promocodesLoading}
                onEdit={openPromoEdit}
                onDelete={setDeletePromoId}
                onToggleActive={handlePromoToggleActive}
                search={promoSearch}
              />
            </div>
          </>
        )}
      </div>

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

      <AnimatePresence>
        {categoryFormOpen && (
          <motion.div
            key="category-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !savingCategory && setCategoryFormOpen(false)}
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
                  {categoryFormMode === 'edit'
                    ? 'Редактировать категорию'
                    : 'Новая категория'}
                </h2>
                <button
                  type="button"
                  onClick={() => !savingCategory && setCategoryFormOpen(false)}
                  disabled={savingCategory}
                  aria-label="Закрыть"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: savingCategory ? 'not-allowed' : 'pointer',
                    padding: 4,
                    opacity: savingCategory ? 0.5 : 1,
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              <CategoryForm
                mode={categoryFormMode}
                initialForm={initialCategoryForm}
                editingId={editingCategory?.id}
                saving={savingCategory}
                onSubmit={handleCategorySubmit}
                onCancel={() => setCategoryFormOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {promoFormOpen && (
          <motion.div
            key="promo-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !savingPromo && setPromoFormOpen(false)}
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
              key="promo-form-panel"
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
                  {promoFormMode === 'edit'
                    ? 'Редактировать промокод'
                    : 'Новый промокод'}
                </h2>
                <button
                  type="button"
                  onClick={() => !savingPromo && setPromoFormOpen(false)}
                  disabled={savingPromo}
                  aria-label="Закрыть"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: savingPromo ? 'not-allowed' : 'pointer',
                    padding: 4,
                    opacity: savingPromo ? 0.5 : 1,
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              <PromocodeForm
                mode={promoFormMode}
                initialForm={initialPromoForm}
                saving={savingPromo}
                onSubmit={handlePromoSubmit}
                onCancel={() => setPromoFormOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {deletingCategory && (
          <motion.div
            key="delete-category-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !savingCategory && setDeleteCategoryId(null)}
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
                  onClick={() => setDeleteCategoryId(null)}
                  disabled={savingCategory}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: savingCategory ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleCategoryDelete}
                  disabled={savingCategory}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: savingCategory ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingPromo && (
          <motion.div
            key="delete-promo-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !savingPromo && setDeletePromoId(null)}
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
              key="delete-promo-panel"
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
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8, fontWeight: 700 }}>
                Удалить промокод «{deletingPromo.code}»?
              </h3>
              <p
                style={{
                  color: 'var(--muted)',
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Действие нельзя отменить
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setDeletePromoId(null)}
                  disabled={savingPromo}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: savingPromo ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handlePromoDelete}
                  disabled={savingPromo}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 100,
                    border: 'none',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: savingPromo ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleOrderStatusUpdate}
        onDelete={handleOrderDelete}
      />

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
    </div>
  );
};

export default Admin;