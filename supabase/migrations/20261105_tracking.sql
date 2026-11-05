-- ============================================================
-- MØRA MART — ручной трекинг без API перевозчиков
-- ============================================================
-- Продавец оформляет доставку сам (СДЭК / Почта / постамат / лично)
-- и вписывает трек-номер в заказ. Покупатель видит его в кабинете.
-- Никаких договоров и API не нужно.
-- ============================================================

alter table public.orders
  add column if not exists tracking_number text;

alter table public.orders
  add column if not exists carrier text;

comment on column public.orders.tracking_number is
  'Трек-номер, вписанный продавцом вручную';
comment on column public.orders.carrier is
  'cdek | post | boxberry | other — для ссылки на отслеживание';

-- Продавец может менять трек только в своих заказах (политика update уже есть)
-- Проверка:
-- select id, carrier, tracking_number from public.orders order by id desc limit 5;
