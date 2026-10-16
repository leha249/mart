import type { Order, Review, Promocode } from '../types/database';
import { ORDER_STATUS_LABELS } from '../types/database';

const escapeCSV = (val: unknown): string => {
  const s = String(val ?? '').replace(/"/g, '""');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s}"`;
  }
  return s;
};

const downloadCSV = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const toCSV = (headers: string[], rows: (string | number | null)[][]): string => {
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((r) => r.map(escapeCSV).join(',')),
  ];
  return '\uFEFF' + lines.join('\n');
};

export const exportOrdersToCSV = (orders: Order[]): void => {
  const csv = toCSV(
    ['ID', 'Дата', 'Имя', 'Телефон', 'Email', 'Товары', 'Сумма', 'Статус'],
    orders.map((o) => [
      o.id,
      new Date(o.created_at).toLocaleString('ru-RU'),
      o.customer_name,
      o.customer_phone,
      o.customer_email ?? '',
      o.items
        .map(
          (i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}`
        )
        .join('; '),
      o.total,
      ORDER_STATUS_LABELS[o.status],
    ])
  );

  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `mora-orders-${date}.csv`);
};

export const exportReviewsToCSV = (reviews: Review[]): void => {
  const csv = toCSV(
    ['ID', 'Товар ID', 'Автор', 'Оценка', 'Текст', 'Одобрен', 'Дата'],
    reviews.map((r) => [
      r.id,
      r.product_id,
      r.author_name,
      r.rating,
      r.text,
      r.approved ? 'Да' : 'Нет',
      new Date(r.created_at).toLocaleString('ru-RU'),
    ])
  );

  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `mora-reviews-${date}.csv`);
};

export const exportPromocodesToCSV = (promos: Promocode[]): void => {
  const csv = toCSV(
    [
      'ID',
      'Код',
      'Скидка %',
      'Мин. сумма',
      'Использовано',
      'Макс. использований',
      'Срок до',
      'Активен',
      'Создан',
    ],
    promos.map((p) => [
      p.id,
      p.code,
      p.discount_percent,
      p.min_total,
      p.used_count,
      p.max_uses ?? '∞',
      p.expires_at
        ? new Date(p.expires_at).toLocaleString('ru-RU')
        : '—',
      p.active ? 'Да' : 'Нет',
      new Date(p.created_at).toLocaleString('ru-RU'),
    ])
  );

  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `mora-promocodes-${date}.csv`);
};