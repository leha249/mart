/** Ссылки на отслеживание по трек-номеру для разных перевозчиков. */

export const CARRIERS = [
  { value: 'cdek', label: 'СДЭК' },
  { value: 'post', label: 'Почта России' },
  { value: 'boxberry', label: 'Boxberry' },
  { value: 'yandex', label: 'Яндекс Доставка' },
  { value: 'other', label: 'Другое' },
] as const;

export const carrierLabel = (carrier?: string | null): string =>
  CARRIERS.find((c) => c.value === carrier)?.label ?? 'Доставка';

/** Куда вести по клику на трек-номер. */
export const trackingUrl = (
  carrier?: string | null,
  number?: string | null
): string | null => {
  if (!number) return null;
  const n = encodeURIComponent(number.trim());

  switch (carrier) {
    case 'cdek':
      return `https://www.cdek.ru/ru/tracking?order_id=${n}`;
    case 'post':
      return `https://www.pochta.ru/tracking#${n}`;
    case 'boxberry':
      return `https://boxberry.ru/tracking-page?id=${n}`;
    case 'yandex':
      return `https://dostavka.yandex.ru/order/${n}`;
    default:
      return null;
  }
};
