import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useSellers } from '../../context/SellersContext';
import { useProducts } from '../../context/ProductsContext';
import { sellersService } from '../../services/sellers';
import { useToast } from '../../context/ToastContext';
import { useBodyLock } from '../../hooks/useBodyLock';
import { useDebounce } from '../../hooks/useDebounce';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import SellersTable from '../../components/admin/SellersTable';
import SellerForm, {
  sellerFormFrom,
} from '../../components/admin/SellerForm';
import type { SellerFormState } from '../../components/admin/SellerForm';
import type { UISeller, SellerStatus } from '../../types/database';

const AdminSellers = () => {
  const {
    sellers,
    loading: sellersLoading,
    refetch: refetchSellers,
  } = useSellers();
  const { products, refetch: refetchProducts } = useProducts();
  const { addToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<UISeller | null>(null);
  const [initialForm, setInitialForm] =
    useState<SellerFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const searchDebounced = useDebounce(searchInput, 250);

  useBodyLock(formOpen);
  useUnsavedChanges(formOpen && !saving);

  // === КОЛИЧЕСТВО ТОВАРОВ ===
  const productsCountBySeller = useMemo(() => {
    const map: Record<number, number> = {};
    products.forEach((p) => {
      if (p.sellerId !== null) {
        map[p.sellerId] = (map[p.sellerId] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // === ФИЛЬТРАЦИЯ ===
  const filteredSellers = useMemo(() => {
    if (!searchDebounced.trim()) return sellers;
    const q = searchDebounced.toLowerCase();
    return sellers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [sellers, searchDebounced]);

  // === СТАТИСТИКА ===
  const stats = useMemo(
    () => ({
      total: sellers.length,
      active: sellers.filter((s) => s.status === 'active').length,
      paused: sellers.filter((s) => s.status === 'paused').length,
      blocked: sellers.filter((s) => s.status === 'blocked').length,
    }),
    [sellers]
  );

  // === РЕДАКТИРОВАНИЕ ===
  const openEdit = (seller: UISeller) => {
    setEditingSeller(seller);
    setInitialForm(sellerFormFrom(seller));
    setFormOpen(true);
  };

  // === СОХРАНЕНИЕ ===
  const handleSubmit = async (form: SellerFormState) => {
    if (!editingSeller || saving) return;
    setSaving(true);
    try {
      await sellersService.update(editingSeller.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        logo: form.logo || null,
        cover: form.cover || null,

        hero_title: form.hero_title.trim() || null,
        hero_subtitle: form.hero_subtitle.trim() || null,
        hero_image: form.hero_image || null,
        hero_badge: form.hero_badge.trim() || null,
        about_title: form.about_title.trim() || null,
        about_text: form.about_text.trim() || null,
        about_image: form.about_image || null,
        about_badge: form.about_badge.trim() || null,
        footer_text: form.footer_text.trim() || null,
        accent_color: form.accent_color.trim() || null,

        // 🐛 ИСПРАВЛЕНИЕ: передаём Lookbook-фото
        lookbook_images: form.lookbook_images,
      });

      if (form.slug.trim() !== editingSeller.slug) {
        await sellersService.updateSlug(editingSeller.id, form.slug);
      }

      if (form.status !== editingSeller.status) {
        await sellersService.updateStatus(editingSeller.id, form.status);
      }

      addToast('Продавец обновлён', 'success');
      setFormOpen(false);
      setEditingSeller(null);
      setInitialForm(null);
      await refetchSellers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      addToast(msg, 'error');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // === СМЕНА СТАТУСА ===
  const handleStatusChange = async (
    seller: UISeller,
    status: SellerStatus
  ) => {
    try {
      await sellersService.updateStatus(seller.id, status);
      addToast(
        status === 'active'
          ? 'Продавец активирован'
          : status === 'paused'
          ? 'Продавец поставлен на паузу'
          : 'Продавец заблокирован',
        'success'
      );
      await refetchSellers();
    } catch (e) {
      addToast('Ошибка изменения статуса', 'error');
    }
  };

  // === УДАЛЕНИЕ ===
  const handleDelete = async (seller: UISeller) => {
    try {
      await sellersService.remove(seller.id);
      addToast(`Продавец «${seller.name}» удалён`, 'success');
      await refetchSellers();
      await refetchProducts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка удаления';
      addToast(msg, 'error');
      throw e;
    }
  };

  return (
    <>
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
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Продавцы
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Новые продавцы создаются через Supabase Authentication — они
            появляются здесь автоматически
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Всего продавцов', value: stats.total },
          { label: 'Активных', value: stats.active, accent: true },
          { label: 'На паузе', value: stats.paused },
          { label: 'Заблокировано', value: stats.blocked },
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
            placeholder="Поиск по имени, slug или email..."
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

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <SellersTable
          sellers={filteredSellers}
          loading={sellersLoading}
          productsCount={productsCountBySeller}
          onEdit={openEdit}
          onChangeStatus={handleStatusChange}
          onDelete={handleDelete}
          search={searchDebounced}
        />
      </div>

      <AnimatePresence>
        {formOpen && initialForm && (
          <motion.div
            key="seller-form-backdrop"
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
              key="seller-form-panel"
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
                  Редактировать продавца
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

              <SellerForm
                initialForm={initialForm}
                saving={saving}
                canEditSlugAndStatus
                onSubmit={handleSubmit}
                onCancel={() => setFormOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSellers;