import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertTriangle, Wand2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { categoriesService } from '../../services/categories';
import { generateSlug, isValidSlug } from '../../utils/slug';
import type { Category } from '../../types/database';

export interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  sort_order: string;
}

export const emptyCategoryForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  sort_order: '0',
};

export const categoryFormFrom = (c: Category): CategoryFormState => ({
  name: c.name,
  slug: c.slug,
  description: c.description ?? '',
  sort_order: String(c.sort_order),
});

interface Props {
  mode: 'create' | 'edit';
  initialForm: CategoryFormState;
  editingId?: number;
  saving: boolean;
  onSubmit: (form: CategoryFormState) => void;
  onCancel: () => void;
}

const CategoryForm = ({
  mode,
  initialForm,
  editingId,
  saving,
  onSubmit,
  onCancel,
}: Props) => {
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugAutoMode, setSlugAutoMode] = useState(!initialForm.slug);
  const [checking, setChecking] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setForm(initialForm);
    setErrors({});
    setSlugAutoMode(!initialForm.slug);
    setTimeout(() => firstInputRef.current?.focus(), 200);
  }, [initialForm]);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const setField = <K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K]
  ) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Если меняем name и slug в авто-режиме
      if (key === 'name' && slugAutoMode) {
        // Если name пустой — очищаем slug
        next.slug = String(value).trim()
          ? generateSlug(String(value))
          : '';
      }
      return next;
    });
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const handleRegenerateSlug = () => {
    if (!form.name.trim()) return;
    setForm((f) => ({ ...f, slug: generateSlug(f.name) }));
    setSlugAutoMode(true);
  };

  const validate = async (): Promise<Record<string, string>> => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = 'Введите название';
    else if (form.name.length > 50) errs.name = 'Максимум 50 символов';

    if (!form.slug.trim()) errs.slug = 'Введите slug';
    else if (!isValidSlug(form.slug))
      errs.slug = 'Только строчные латинские буквы, цифры и дефисы';

    const order = Number(form.sort_order);
    if (isNaN(order) || order < 0) errs.sort_order = 'Должно быть ≥ 0';

    if (Object.keys(errs).length === 0) {
      setChecking(true);
      try {
        const [nameTaken, slugTaken] = await Promise.all([
          categoriesService.isNameTaken(form.name, editingId),
          categoriesService.isSlugTaken(form.slug, editingId),
        ]);
        if (nameTaken) errs.name = 'Такое название уже есть';
        if (slugTaken) errs.slug = 'Такой slug уже используется';
      } catch (e) {
        console.warn('Ошибка проверки уникальности:', e);
      } finally {
        setChecking(false);
      }
    }

    return errs;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving || checking) return;

    const errs = await validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      addToast('Проверьте поля формы', 'error');
      return;
    }

    onSubmit(form);
  };

  const handleCancel = () => {
    if (saving) return;
    if (hasChanges) {
      const ok = window.confirm(
        'Есть несохранённые изменения. Закрыть без сохранения?'
      );
      if (!ok) return;
    }
    onCancel();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) handleCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, hasChanges]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
      <Field
        label="Название *"
        value={form.name}
        onChange={(v) => setField('name', v)}
        placeholder="Одежда"
        error={errors.name}
        disabled={saving}
        inputRef={firstInputRef}
        maxLength={50}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Slug *</span>
          <button
            type="button"
            onClick={handleRegenerateSlug}
            disabled={!form.name.trim() || saving}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 11,
              cursor: !form.name.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'inherit',
              textTransform: 'none',
              letterSpacing: 0,
              opacity: !form.name.trim() ? 0.5 : 1,
              padding: 0,
            }}
          >
            <Wand2 size={11} /> Сгенерировать
          </button>
        </label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => {
            setSlugAutoMode(false);
            setField('slug', e.target.value);
          }}
          placeholder="odezhda"
          disabled={saving}
          style={{
            padding: '14px 16px',
            background: 'var(--surface)',
            border: '1px solid',
            borderColor: errors.slug ? 'var(--danger)' : 'var(--border)',
            borderRadius: 12,
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'monospace',
            outline: 'none',
            width: '100%',
            opacity: saving ? 0.5 : 1,
          }}
        />
        {errors.slug && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={12} /> {errors.slug}
          </div>
        )}
        {!errors.slug && form.slug && slugAutoMode && (
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Генерируется автоматически из названия
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          Описание
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="Краткое описание категории..."
          rows={3}
          maxLength={300}
          disabled={saving}
          style={{
            padding: '14px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
            minHeight: 80,
            opacity: saving ? 0.5 : 1,
          }}
        />
      </div>

      <Field
        label="Порядок сортировки"
        value={form.sort_order}
        onChange={(v) => setField('sort_order', v)}
        placeholder="0"
        type="number"
        error={errors.sort_order}
        disabled={saving}
      />

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
          marginTop: 12,
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
          Отмена
        </button>
        <motion.button
          type="submit"
          whileHover={{ scale: saving || checking ? 1 : 1.03 }}
          whileTap={{ scale: saving || checking ? 1 : 0.97 }}
          disabled={saving || checking}
          style={{
            padding: '14px 28px',
            borderRadius: 100,
            border: 'none',
            background: 'var(--accent)',
            color: '#000',
            fontSize: 14,
            fontWeight: 700,
            cursor: saving || checking ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saving || checking ? 0.7 : 1,
          }}
        >
          {saving || checking ? (
            <>
              <Loader2
                size={16}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              {checking ? 'Проверка...' : 'Сохранение...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
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

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  maxLength?: number;
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  disabled,
  inputRef,
  maxLength,
}: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label
      style={{
        fontSize: 12,
        color: 'var(--muted)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </label>
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      style={{
        padding: '14px 16px',
        background: 'var(--surface)',
        border: '1px solid',
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        borderRadius: 12,
        color: 'var(--text)',
        fontSize: 14,
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
        opacity: disabled ? 0.5 : 1,
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

export default CategoryForm;