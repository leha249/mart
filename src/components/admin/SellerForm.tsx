import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { UISeller, SellerStatus } from '../../types/database';
import ImageUploader from '../ImageUploader';

export interface SellerFormState {
  name: string;
  slug: string;
  description: string;
  email: string;
  phone: string;
  status: SellerStatus;
  logo: string;
  cover: string;

  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  hero_badge: string;
  about_title: string;
  about_text: string;
  about_image: string;
  about_badge: string;
  footer_text: string;
  accent_color: string;

  lookbook_images: string[];
}

export const sellerFormFrom = (s: UISeller): SellerFormState => ({
  name: s.name,
  slug: s.slug,
  description: s.description ?? '',
  email: s.email ?? '',
  phone: s.phone ?? '',
  status: s.status,
  logo: s.logo ?? '',
  cover: s.cover ?? '',

  hero_title: s.heroTitle ?? '',
  hero_subtitle: s.heroSubtitle ?? '',
  hero_image: s.heroImage ?? '',
  hero_badge: s.heroBadge ?? '',
  about_title: s.aboutTitle ?? '',
  about_text: s.aboutText ?? '',
  about_image: s.aboutImage ?? '',
  about_badge: s.aboutBadge ?? '',
  footer_text: s.footerText ?? '',
  accent_color: s.accentColor ?? '#e8ff5a',

  lookbook_images: s.lookbookImages ?? [],
});

interface Props {
  initialForm: SellerFormState;
  saving: boolean;
  canEditSlugAndStatus?: boolean;
  inline?: boolean;
  onSubmit: (form: SellerFormState) => void;
  onCancel: () => void;
}

const SellerForm = ({
  initialForm,
  saving,
  canEditSlugAndStatus = true,
  inline = false,
  onSubmit,
  onCancel,
}: Props) => {
  const [form, setForm] = useState<SellerFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<
    'main' | 'hero' | 'about' | 'lookbook' | 'footer'
  >('main');
  const firstRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setForm(initialForm);
    setErrors({});
    setTimeout(() => firstRef.current?.focus(), 200);
  }, [initialForm]);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const setField = <K extends keyof SellerFormState>(
    key: K,
    value: SellerFormState[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = 'Введите название';

    if (canEditSlugAndStatus) {
      if (!form.slug.trim()) errs.slug = 'Введите slug';
      else if (!/^[a-z0-9-]+$/.test(form.slug.trim()))
        errs.slug = 'Только латиница, цифры и дефис';
      else if (form.slug.trim().length < 3) errs.slug = 'Минимум 3 символа';
      else if (form.slug.trim().length > 40) errs.slug = 'Максимум 40 символов';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'Некорректный email';

    if (form.accent_color && !/^#[0-9a-fA-F]{6}$/.test(form.accent_color))
      errs.accent_color = 'Формат: #RRGGBB';

    return errs;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.hero_title || errs.hero_subtitle || errs.hero_image || errs.hero_badge)
        setActiveSection('hero');
      else if (errs.about_title || errs.about_text || errs.about_image || errs.about_badge)
        setActiveSection('about');
      else if (errs.lookbook_images) setActiveSection('lookbook');
      else if (errs.footer_text) setActiveSection('footer');
      else setActiveSection('main');
      addToast('Проверьте поля формы', 'error');
      return;
    }

    onSubmit(form);
  };

  const handleCancel = () => {
    if (saving) return;
    if (hasChanges) {
      const ok = window.confirm('Есть несохранённые изменения. Закрыть?');
      if (!ok) return;
    }
    onCancel();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving && !inline) handleCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, hasChanges, inline]);

  const sections: { key: typeof activeSection; label: string }[] = [
    { key: 'main', label: 'Основное' },
    { key: 'hero', label: 'Hero' },
    { key: 'lookbook', label: 'Lookbook' },
    { key: 'about', label: 'About' },
    { key: 'footer', label: 'Footer' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
      {/* Табы разделов */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 100,
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {sections.map((s) => {
          const isActive = activeSection === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSection(s.key)}
              style={{
                position: 'relative',
                padding: '8px 18px',
                borderRadius: 100,
                border: 'none',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#000' : 'var(--muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* === ОСНОВНОЕ === */}
      {activeSection === 'main' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Row>
            <Field
              label="Название магазина *"
              value={form.name}
              onChange={(v) => setField('name', v)}
              placeholder="Магазин Ивана"
              error={errors.name}
              disabled={saving}
              inputRef={firstRef}
            />

            {canEditSlugAndStatus ? (
              <Field
                label="Slug (URL) *"
                value={form.slug}
                onChange={(v) =>
                  setField('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                }
                placeholder="ivan-shop"
                error={errors.slug}
                disabled={saving}
                hint={`/seller/${form.slug || '...'}`}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Slug (URL)</label>
                <input
                  type="text"
                  value={form.slug}
                  disabled
                  readOnly
                  style={{
                    ...inputStyle,
                    opacity: 0.6,
                    cursor: 'not-allowed',
                    fontFamily: 'monospace',
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  /seller/{form.slug}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={11} />
                  Изменить можно только через администратора
                </div>
              </div>
            )}
          </Row>

          <FieldArea
            label="Описание"
            value={form.description}
            onChange={(v) => setField('description', v)}
            placeholder="Короткое описание магазина"
            disabled={saving}
            rows={3}
          />

          <Row>
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => setField('email', v)}
              placeholder="shop@example.com"
              error={errors.email}
              disabled={saving}
            />
            <Field
              label="Телефон"
              value={form.phone}
              onChange={(v) => setField('phone', v)}
              placeholder="+7 900 000-00-00"
              disabled={saving}
            />
          </Row>

          <Row>
            {canEditSlugAndStatus ? (
              <SelectField
                label="Статус"
                value={form.status}
                onChange={(v) => setField('status', v as SellerStatus)}
                options={[
                  { value: 'active', label: 'Активен' },
                  { value: 'paused', label: 'На паузе' },
                  { value: 'blocked', label: 'Заблокирован' },
                ]}
                disabled={saving}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Статус магазина</label>
                <div
                  style={{
                    padding: '14px 16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 14,
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {form.status === 'active' && (
                    <>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--success)',
                        }}
                      />
                      Активен
                    </>
                  )}
                  {form.status === 'paused' && (
                    <>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#c8e03d',
                        }}
                      />
                      На паузе
                    </>
                  )}
                  {form.status === 'blocked' && (
                    <>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--danger)',
                        }}
                      />
                      Заблокирован
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={11} />
                  Статус меняет администратор
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Акцентный цвет</label>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setField('accent_color', e.target.value)}
                  disabled={saving}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    background: 'var(--surface)',
                  }}
                />
                <input
                  type="text"
                  value={form.accent_color}
                  onChange={(e) => setField('accent_color', e.target.value)}
                  disabled={saving}
                  placeholder="#e8ff5a"
                  style={{
                    ...inputStyle,
                    flex: 1,
                    fontFamily: 'monospace',
                    borderColor: errors.accent_color
                      ? 'var(--danger)'
                      : 'var(--border)',
                  }}
                />
              </div>
              {errors.accent_color && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--danger)',
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={12} /> {errors.accent_color}
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginTop: 6,
                }}
              >
                Цвет кнопок и акцентов на странице магазина
              </div>
            </div>
          </Row>

          <ImageUploader
            label="Логотип"
            value={form.logo}
            onChange={(url) => setField('logo', url)}
            aspect="1/1"
          />

          <ImageUploader
            label="Обложка профиля (для карточки в списке магазинов)"
            value={form.cover}
            onChange={(url) => setField('cover', url)}
            aspect="16/9"
          />
        </div>
      )}

      {/* === HERO === */}
      {activeSection === 'hero' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={hintStyle}>
            Если оставить пустым — будут использованы стандартные тексты MØRA
            MART
          </div>

          <Field
            label="Hero — заголовок"
            value={form.hero_title}
            onChange={(v) => setField('hero_title', v)}
            placeholder="Одежда для тех, кто чувствует себя собой"
            disabled={saving}
          />

          <FieldArea
            label="Hero — подзаголовок"
            value={form.hero_subtitle}
            onChange={(v) => setField('hero_subtitle', v)}
            placeholder="Осознанный подход к дизайну..."
            disabled={saving}
            rows={3}
          />

          <Field
            label="Hero — плашка (сверху)"
            value={form.hero_badge}
            onChange={(v) => setField('hero_badge', v)}
            placeholder="Новая коллекция 2025"
            disabled={saving}
          />

          <ImageUploader
            label="Hero — изображение"
            value={form.hero_image}
            onChange={(url) => setField('hero_image', url)}
            aspect="3/4"
          />
        </div>
      )}

      {/* === LOOKBOOK === */}
      {activeSection === 'lookbook' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={hintStyle}>
            Загрузите до 4 фотографий — они появятся в секции Lookbook на
            странице вашего магазина. Если не загружено ни одного фото, секция
            скроется.
          </div>

          <ImageUploader
            multiple
            maxImages={4}
            label="Фотографии Lookbook"
            value={form.lookbook_images}
            onChange={(urls) => setField('lookbook_images', urls)}
            aspect="3/4"
            disabled={saving}
          />
        </div>
      )}

      {/* === ABOUT === */}
      {activeSection === 'about' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={hintStyle}>
            Если оставить пустым — будет использован стандартный текст MØRA
            MART
          </div>

          <Field
            label="About — заголовок"
            value={form.about_title}
            onChange={(v) => setField('about_title', v)}
            placeholder="Мы создаём одежду с характером"
            disabled={saving}
          />

          <FieldArea
            label="About — текст"
            value={form.about_text}
            onChange={(v) => setField('about_text', v)}
            placeholder="MØRA MART — это больше, чем магазин..."
            disabled={saving}
            rows={6}
          />

          <Field
            label="About — бейдж (жёлтый круг)"
            value={form.about_badge}
            onChange={(v) => setField('about_badge', v)}
            placeholder="100% ORGANIC"
            disabled={saving}
          />

          <ImageUploader
            label="About — изображение"
            value={form.about_image}
            onChange={(url) => setField('about_image', url)}
            aspect="4/5"
          />
        </div>
      )}

      {/* === FOOTER === */}
      {activeSection === 'footer' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <FieldArea
            label="Footer — текст под лого"
            value={form.footer_text}
            onChange={(v) => setField('footer_text', v)}
            placeholder="Осознанная мода для тех, кто ценит качество, стиль и природу."
            disabled={saving}
            rows={3}
          />
          <div style={hintStyle}>
            Копирайт внизу страницы будет: © 2025 {form.name || 'MØRA MART'}
          </div>
        </div>
      )}

      {hasChanges && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'rgba(232,255,90,0.08)',
            border: '1px solid rgba(232,255,90,0.2)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--accent)',
          }}
        >
          <AlertTriangle size={14} /> Есть несохранённые изменения
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          marginTop: 8,
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          style={{
            padding: '14px 24px',
            borderRadius: 100,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {inline ? 'Отменить изменения' : 'Отмена'}
        </button>
        <motion.button
          type="submit"
          whileHover={{ scale: saving ? 1 : 1.03 }}
          whileTap={{ scale: saving ? 1 : 0.97 }}
          disabled={saving}
          style={{
            padding: '14px 28px',
            borderRadius: 100,
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <>
              <Loader2
                size={16}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Сохранение...
            </>
          ) : (
            <>
              <Save size={16} />
              Сохранить
            </>
          )}
        </motion.button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
};

const inputStyle: React.CSSProperties = {
  padding: '14px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
};

const hintStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: 'rgba(232,255,90,0.04)',
  border: '1px solid rgba(232,255,90,0.15)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--muted)',
  lineHeight: 1.5,
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    {children}
  </div>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  hint?: string;
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  inputRef,
  hint,
}: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={labelStyle}>{label}</label>
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...inputStyle,
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        opacity: disabled ? 0.5 : 1,
      }}
    />
    {hint && !error && (
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          fontFamily: 'monospace',
        }}
      >
        {hint}
      </div>
    )}
    {error && (
      <div
        style={{
          fontSize: 12,
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <AlertTriangle size={12} /> {error}
      </div>
    )}
  </div>
);

interface AreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

const FieldArea = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  rows = 4,
}: AreaProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={labelStyle}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{
        ...inputStyle,
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        opacity: disabled ? 0.5 : 1,
        resize: 'vertical',
        minHeight: 80,
        lineHeight: 1.6,
      }}
    />
    {error && (
      <div
        style={{
          fontSize: 12,
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <AlertTriangle size={12} /> {error}
      </div>
    )}
  </div>
);

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled,
}: SelectProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={labelStyle}>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        ...inputStyle,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default SellerForm;