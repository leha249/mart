import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { Promocode } from '../../types/database';

export interface PromoFormState {
  code: string;
  discount_percent: string;
  min_total: string;
  max_uses: string;
  expires_at: string;
  active: boolean;
}

export const emptyPromoForm: PromoFormState = {
  code: '',
  discount_percent: '10',
  min_total: '0',
  max_uses: '',
  expires_at: '',
  active: true,
};

export const promoFormFrom = (p: Promocode): PromoFormState => ({
  code: p.code,
  discount_percent: String(p.discount_percent),
  min_total: String(p.min_total),
  max_uses: p.max_uses !== null ? String(p.max_uses) : '',
  expires_at: p.expires_at
    ? new Date(p.expires_at).toISOString().slice(0, 16)
    : '',
  active: p.active,
});

interface Props {
  mode: 'create' | 'edit';
  initialForm: PromoFormState;
  saving: boolean;
  onSubmit: (form: PromoFormState) => void;
  onCancel: () => void;
}

const PromocodeForm = ({
  mode,
  initialForm,
  saving,
  onSubmit,
  onCancel,
}: Props) => {
  const [form, setForm] = useState<PromoFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setForm(initialForm);
    setErrors({});
    setTimeout(() => firstRef.current?.focus(), 200);
  }, [initialForm]);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const setField = <K extends keyof PromoFormState>(
    key: K,
    value: PromoFormState[K]
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
    const code = form.code.trim().toUpperCase();

    if (!code) errs.code = 'Введите код';
    else if (code.length < 3) errs.code = 'Минимум 3 символа';
    else if (code.length > 20) errs.code = 'Максимум 20 символов';
    else if (!/^[A-Z0-9_-]+$/.test(code))
      errs.code = 'Только A-Z, 0-9, _ и -';

    const disc = Number(form.discount_percent);
    if (!disc || disc <= 0 || disc > 100)
      errs.discount_percent = 'Скидка от 1 до 100%';

    const minTotal = Number(form.min_total);
    if (isNaN(minTotal) || minTotal < 0) errs.min_total = 'Минимум 0';

    if (form.max_uses) {
      const maxUses = Number(form.max_uses);
      if (isNaN(maxUses) || maxUses < 1)
        errs.max_uses = 'Минимум 1 использование';
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
      const ok = window.confirm('Есть несохранённые изменения. Закрыть?');
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
        label="Код промокода *"
        value={form.code}
        onChange={(v) => setField('code', v.toUpperCase())}
        placeholder="SUMMER20"
        error={errors.code}
        disabled={saving}
        inputRef={firstRef}
        maxLength={20}
      />

      <Row>
        <Field
          label="Скидка (%) *"
          value={form.discount_percent}
          onChange={(v) => setField('discount_percent', v)}
          placeholder="10"
          type="number"
          error={errors.discount_percent}
          disabled={saving}
        />
        <Field
          label="Мин. сумма (₽)"
          value={form.min_total}
          onChange={(v) => setField('min_total', v)}
          placeholder="0"
          type="number"
          error={errors.min_total}
          disabled={saving}
        />
      </Row>

      <Row>
        <Field
          label="Макс. использований"
          value={form.max_uses}
          onChange={(v) => setField('max_uses', v)}
          placeholder="Пусто = без лимита"
          type="number"
          error={errors.max_uses}
          disabled={saving}
        />
        <Field
          label="Действителен до"
          value={form.expires_at}
          onChange={(v) => setField('expires_at', v)}
          type="datetime-local"
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
          checked={form.active}
          onChange={(e) => setField('active', e.target.checked)}
          disabled={saving}
          style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
        />
        Активен
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
    <label style={labelStyle}>{label}</label>
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      style={{
        ...inputStyle,
        borderColor: error ? 'var(--danger)' : 'var(--border)',
        opacity: disabled ? 0.5 : 1,
        colorScheme: type === 'datetime-local' ? 'dark' : undefined,
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

export default PromocodeForm;