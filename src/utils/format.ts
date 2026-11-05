import { priceFormatter, dateFormatter } from './constants';

export const formatPrice = (price: number): string =>
  priceFormatter.format(price) + ' ₽';

/** Телефон в виде «+7 900 555-35-35» из любых цифр. */
export const formatPhone = (raw?: string | null): string => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length < 11) return String(raw ?? '');
  const d = digits.slice(-10);
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;

  return dateFormatter.format(d);
};

export const pluralize = (
  count: number,
  one: string,
  few: string,
  many: string
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

export const truncate = (text: string, max = 100): string => {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
};

export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};