import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSellers } from '../../context/SellersContext';
import { sellersService } from '../../services/sellers';
import { useToast } from '../../context/ToastContext';
import SellerForm, {
  sellerFormFrom,
} from '../../components/admin/SellerForm';
import type { SellerFormState } from '../../components/admin/SellerForm';

const AdminProfile = () => {
  const { role } = useAuth();
  const { refetch: refetchSellers } = useSellers();
  const { addToast } = useToast();

  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState<SellerFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSeller = role === 'seller';

  // === ЗАГРУЗКА ===
  const loadProfile = useCallback(async () => {
    if (!isSeller) return;
    setLoading(true);
    try {
      const me = await sellersService.getMy();
      if (me) {
        setProfileId(me.id);
        setProfileForm(sellerFormFrom(me));
      } else {
        addToast('Профиль продавца не найден', 'error');
      }
    } catch (e) {
      addToast('Не удалось загрузить профиль', 'error');
    } finally {
      setLoading(false);
    }
  }, [isSeller, addToast]);

  useEffect(() => {
    if (isSeller && !profileForm && !loading) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller]);

  // === СОХРАНЕНИЕ ===
  const handleSubmit = async (form: SellerFormState) => {
    if (!profileId || saving) return;
    setSaving(true);
    try {
      await sellersService.update(profileId, {
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
      });

      // Перезагружаем профиль — чтобы форма сохранила новое как "initial"
      const updated = await sellersService.getMy();
      if (updated) {
        setProfileForm(sellerFormFrom(updated));
      }

      addToast('Профиль магазина сохранён', 'success');
      await refetchSellers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profileId) {
      loadProfile();
    }
  };

  if (!isSeller) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: 'center',
          color: 'var(--muted)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}
      >
        Эта вкладка доступна только продавцам
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 32,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2
          className="serif"
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            marginBottom: 8,
          }}
        >
          Профиль магазина
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          Настройте внешний вид и тексты вашей страницы. Если поле пустое —
          используется стандартное оформление MØRA MART.
        </p>
      </div>

      {loading && (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          <Loader2
            size={24}
            style={{
              animation: 'spin 1s linear infinite',
              display: 'inline-block',
            }}
          />
          <div style={{ marginTop: 12 }}>Загрузка профиля...</div>
        </div>
      )}

      {!loading && profileForm && (
        <SellerForm
          initialForm={profileForm}
          saving={saving}
          canEditSlugAndStatus={false}
          inline
          onSubmit={handleSubmit}
          onCancel={handleReset}
        />
      )}

      {!loading && !profileForm && (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          <AlertTriangle
            size={32}
            style={{ marginBottom: 12, opacity: 0.5 }}
          />
          <div>Не удалось загрузить профиль</div>
          <button
            onClick={loadProfile}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              borderRadius: 100,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Попробовать снова
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminProfile;