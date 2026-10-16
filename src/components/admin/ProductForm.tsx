import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import ImageUploader from '../ImageUploader';
import { useToast } from '../../context/ToastContext';
import { useCmdS, useEscape } from '../../hooks/useHotkey';
import {
  isValidHex,
  isPositiveNumber,
  isValidRating,
  parseCommaList,
} from '../../utils/validators';
import type { Product } from '../../types/database';

export interface FormState {
  name: string;
  description: string;
  price: string;
  old_price: string;
  category: string;
  images: string[];
  tag: '' | 'NEW' | 'HOT' | 'SALE';
  sizes: string;
  colors: string;
  rating: string;
  reviews: string;
  in_stock: boolean;
}

export const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
  old_price: '',
  category: '',
  images: [],
  tag: '',
  sizes: '',
  colors: '',
  rating: '0',
  reviews: '0',
  in_stock: true,
};

export const formFromProduct = (p: Product): FormState => {
  const imagesSet = new Set<string>();
  if (p.image) imagesSet.add(p.image);
  (p.images ?? []).forEach((img) => {
    if (img) imagesSet.add(img);
  });

  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price),
    old_price: p.old_price ? String(p.old_price) : '',
    category: p.category,
    images: Array.from(imagesSet),
    tag: p.tag ?? '',
    sizes: (p.sizes ?? []).join(', '),
    colors: (p.colors ?? []).join(', '),
    rating: String(p.rating),
    reviews: String(p.reviews),
    in_stock: p.in_stock,
  };
};

interface Props {
  mode: 'create' | 'edit';
  initialForm: FormState;
  initialImages: string[];
  saving: boolean;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
}

const ProductForm = ({
  mode,
  initialForm,
  initialImages,
  saving,
  onSubmit,
  onCancel,
}: Props) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setForm(initialForm);
    setErrors({});
    setTimeout(() => firstInputRef.current?.focus(), 200);
  }, [initialForm]);

  const hasChanges =
    JSON.stringify(form) !== JSON.stringify(initialForm) ||
    JSON.stringify(form.images) !== JSON.stringify(initialImages);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
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
    else if (form.name.length > 100) errs.name = 'Максимум 100 символов';

    if (!form.price) errs.price = 'Введите цену';
    else if (!isPositiveNumber(form.price)) errs.price = 'Цена должна быть > 0';
    else if (Number(form.price) > 1_000_000)
      errs.price = 'Слишком большая цена';

    if (form.old_price) {
      if (!isPositiveNumber(form.old_price))
        errs.old_price = 'Должно быть > 0';
      else if (Number(form.old_price) <= Number(form.price))
        errs.old_price = 'Старая цена должна быть больше новой';
    }

    if (!form.category.trim()) errs.category = 'Введите категорию';
    if (form.images.length === 0) errs.images = 'Загрузите хотя бы одно фото';

    if (form.rating && !isValidRating(form.rating))
      errs.rating = 'Рейтинг от 0 до 5';

    if (form.reviews && Number(form.reviews) < 0)
      errs.reviews = 'Не может быть отрицательным';

    if (form.colors) {
      const colors = parseCommaList(form.colors);
      const invalid = colors.filter((c) => !isValidHex(c));
      if (invalid.length > 0)
        errs.colors = `Некорректные HEX: ${invalid.join(', ')}`;
    }

    return errs;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;

    const errs = validate();
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

  useEscape(handleCancel, !saving);
  useCmdS(() => handleSubmit(), !saving);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
      <div>
        <ImageUploader
          multiple
          value={form.images}
          onChange={(urls) => setField('images', urls)}
          label="Фотографии товара *"
          disabled={saving}
          maxImages={8}
        />
        {errors.images && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <AlertTriangle size={12} /> {errors.images}
          </div>
        )}
      </div>

      <Field
        label="Название *"
        value={form.name}
        onChange={(v) => setField('name', v)}
        placeholder="Oversized Wool Coat"
        error={errors.name}
        disabled={saving}
        inputRef={firstInputRef}
        maxLength={100}
      />

      <Field
        label="Описание"
        value={form.description}
        onChange={(v) => setField('description', v)}
        placeholder="Свободный шерстяной палто..."
        multiline
        disabled={saving}
        maxLength={1000}
      />

      <Row>
        <Field
          label="Цена (₽) *"
          value={form.price}
          onChange={(v) => setField('price', v)}
          placeholder="24900"
          type="number"
          error={errors.price}
          disabled={saving}
        />
        <Field
          label="Старая цена (₽)"
          value={form.old_price}
          onChange={(v) => setField('old_price', v)}
          placeholder="32900"
          type="number"
          error={errors.old_price}
          disabled={saving}
        />
      </Row>

      <Row>
        <Field
          label="Категория *"
          value={form.category}
          onChange={(v) => setField('category', v)}
          placeholder="Outerwear"
          error={errors.category}
          disabled={saving}
          maxLength={50}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle}>Тег</label>
          <select
            value={form.tag}
            onChange={(e) =>
              setField('tag', e.target.value as FormState['tag'])
            }
            disabled={saving}
            style={inputStyle}
          >
            <option value="">Без тега</option>
            <option value="NEW">NEW</option>
            <option value="HOT">HOT</option>
            <option value="SALE">SALE</option>
          </select>
        </div>
      </Row>

      <Field
        label="Размеры (через запятую)"
        value={form.sizes}
        onChange={(v) => setField('sizes', v)}
        placeholder="XS, S, M, L, XL"
        disabled={saving}
      />

      <Field
        label="Цвета (HEX через запятую)"
        value={form.colors}
        onChange={(v) => setField('colors', v)}
        placeholder="#1a1a1a, #8b7355"
        error={errors.colors}
        disabled={saving}
      />

      <Row>
        <Field
          label="Рейтинг (0–5)"
          value={form.rating}
          onChange={(v) => setField('rating', v)}
          placeholder="4.9"
          type="number"
          error={errors.rating}
          disabled={saving}
        />
        <Field
          label="Отзывов"
          value={form.reviews}
          onChange={(v) => setField('reviews', v)}
          placeholder="128"
          type="number"
          error={errors.reviews}
          disabled={saving}
        />
      </Row>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: 14,
          opacity: saving ? 0.5 : 1,
        }}
      >
        <input
          type="checkbox"
          checked={form.in_stock}
          onChange={(e) => setField('in_stock', e.target.checked)}
          disabled={saving}
          style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
        />
        В наличии
      </label>

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
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginRight: 'auto',
          }}
        >
          <kbd
            style={{
              padding: '2px 6px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            Ctrl/Cmd+S
          </kbd>{' '}
          сохранить ·{' '}
          <kbd
            style={{
              padding: '2px 6px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'monospace',
            }}
          >
            Esc
          </kbd>{' '}
          отмена
        </div>

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

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    {children}
  </div>
);

const FieldError = ({ message }: { message: string }) => (
  <div
    style={{
      fontSize: 12,
      color: 'var(--danger)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: -12,
    }}
  >
    <AlertTriangle size={12} /> {message}
  </div>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
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
  multiline,
  error,
  disabled,
  inputRef,
  maxLength,
}: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={labelStyle}>
      {label}
      {maxLength && value.length > 0 && (
        <span style={{ float: 'right', fontSize: 10, color: 'var(--muted)' }}>
          {value.length}/{maxLength}
        </span>
      )}
    </label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        disabled={disabled}
        style={{
          ...inputStyle,
          borderColor: error ? 'var(--danger)' : 'var(--border)',
          resize: 'vertical',
          minHeight: 80,
          opacity: disabled ? 0.5 : 1,
        }}
      />
    ) : (
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        step={type === 'number' ? 'any' : undefined}
        style={{
          ...inputStyle,
          borderColor: error ? 'var(--danger)' : 'var(--border)',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    )}
    {error && <FieldError message={error} />}
  </div>
);

export default ProductForm;