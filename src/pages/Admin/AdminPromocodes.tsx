import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Trash2, Loader2, Download } from 'lucide-react';
import { usePromocodesAdmin } from '../../context/PromocodesAdminContext';
import { useToast } from '../../context/ToastContext';
import { useBodyLock } from '../../hooks/useBodyLock';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import PromocodesTable from '../../components/admin/PromocodesTable';
import PromocodeForm, {
  emptyPromoForm,
  promoFormFrom,
} from '../../components/admin/PromocodeForm';
import type { PromoFormState } from '../../components/admin/PromocodeForm';
import { promocodesService } from '../../services/promocodes';
import type { Promocode } from '../../types/database';
import { exportPromocodesToCSV } from '../../utils/export';

const AdminPromocodes = () => {
  const {
    promocodes,
    loading,
    refetch,
    currentSellerId,
  } = usePromocodesAdmin();
  const { addToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promocode | null>(null);
  const [initialForm, setInitialForm] =
    useState<PromoFormState>(emptyPromoForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useBodyLock(formOpen || deleteId !== null);
  useUnsavedChanges(formOpen && !saving);

  const filteredPromocodes = useMemo(() => {
    if (!searchInput.trim()) return promocodes;
    const q = searchInput.toLowerCase();
    return promocodes.filter((p) => p.code.toLowerCase().includes(q));
  }, [promocodes, searchInput]);

  const stats = useMemo(
    () => ({
      total: promocodes.length,
      active: promocodes.filter((p) => p.active).length,
      usedCount: promocodes.reduce((s, p) => s + p.used_count, 0),
      avgDiscount:
        promocodes.length > 0
          ? Math.round(
              promocodes.reduce((s, p) => s + p.discount_percent, 0) /
                promocodes.length
            )
          : 0,
    }),
    [promocodes]
  );

  const openCreate = () => {
    setEditingPromo(null);
    setInitialForm(emptyPromoForm);
    setFormOpen(true);
  };

  const openEdit = (promo: Promocode) => {
    setEditingPromo(promo);
    setInitialForm(promoFormFrom(promo));
    setFormOpen(true);
  };

  const handleSubmit = async (form: PromoFormState) => {
    if (saving) return;
    setSaving(true);
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
        seller_id: currentSellerId,
      };

      if (editingPromo) {
        await promocodesService.update(editingPromo.id, {
          code: payload.code,
          discount_percent: payload.discount_percent,
          min_total: payload.min_total,
          max_uses: payload.max_uses,
          expires_at: payload.expires_at,
          active: payload.active,
        });
        addToast('Промокод обновлён', 'success');
      } else {
        await promocodesService.create(payload);
        addToast('Промокод создан', 'success');
      }

      setFormOpen(false);
      setEditingPromo(null);
      setInitialForm(emptyPromoForm);
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
    if (deleteId === null) return;
    setSaving(true);
    try {
      await promocodesService.remove(deleteId);
      addToast('Промокод удалён', 'success');
      setDeleteId(null);
      await refetch();
    } catch (e) {
      addToast('Ошибка удаления', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo: Promocode) => {
    try {
      await promocodesService.toggleActive(promo.id, !promo.active);
      addToast(
        promo.active ? 'Промокод выключен' : 'Промокод включён',
        'success'
      );
      await refetch();
    } catch (e) {
      addToast('Ошибка', 'error');
    }
  };

  const handleExport = () => {
    if (promocodes.length === 0) {
      addToast('Нет промокодов для экспорта', 'info');
      return;
    }
    exportPromocodesToCSV(promocodes);
    addToast(`Экспортировано промокодов: ${promocodes.length}`, 'success');
  };

  const deletingPromo = useMemo(
    () => promocodes.find((p) => p.id === deleteId) || null,
    [promocodes, deleteId]
  );

  const formMode: 'create' | 'edit' = editingPromo ? 'edit' : 'create';

  return (
    <>
      {/* ЗАГОЛОВОК + КНОПКИ */}
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
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Промокоды</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {promocodes.length > 0 && (
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
            <Plus size={16} /> Добавить промокод
          </motion.button>
        </div>
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
          { label: 'Всего промокодов', value: stats.total },
          { label: 'Активных', value: stats.active },
          { label: 'Использовано раз', value: stats.usedCount },
          {
            label: 'Средняя скидка',
            value: stats.avgDiscount > 0 ? stats.avgDiscount + '%' : '—',
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
            placeholder="Поиск по коду..."
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
              textTransform: 'uppercase',
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
        <PromocodesTable
          promocodes={filteredPromocodes}
          loading={loading}
          onEdit={openEdit}
          onDelete={setDeleteId}
          onToggleActive={handleToggleActive}
          search={searchInput}
        />
      </div>

      {/* МОДАЛКА: PROMO FORM */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            key="promo-form-backdrop"
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
                  {formMode === 'edit'
                    ? 'Редактировать промокод'
                    : 'Новый промокод'}
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

              <PromocodeForm
                mode={formMode}
                initialForm={initialForm}
                saving={saving}
                onSubmit={handleSubmit}
                onCancel={() => setFormOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* МОДАЛКА: DELETE PROMO */}
      <AnimatePresence>
        {deletingPromo && (
          <motion.div
            key="delete-promo-backdrop"
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

export default AdminPromocodes;