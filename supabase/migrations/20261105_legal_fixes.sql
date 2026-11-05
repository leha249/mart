-- ============================================================
-- MØRA MART — правки по 152-ФЗ (05.11.2026)
-- ============================================================
-- 1. ИНН продавца (для самозанятого — обязательный идентификатор)
-- 2. Таблица запросов субъектов ПД: заявка сначала пишется в базу,
--    и только потом уходит письмом
-- 3. Время согласия на рекламную рассылку — чтобы факт согласия
--    можно было доказать
-- Применить: Supabase → SQL Editor → Run (или через Management API)
-- ============================================================

-- 1. ИНН продавца
alter table public.sellers
  add column if not exists inn text;

comment on column public.sellers.inn is
  'ИНН продавца: 12 цифр для самозанятого/ИП, 10 для ООО';

-- 2. Запросы субъектов ПД (доступ, удаление, отзыв согласия)
create table if not exists public.data_requests (
  id bigserial primary key,
  contact text not null,
  request_type text not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint data_requests_type_check
    check (request_type in ('access', 'delete', 'revoke_consent'))
);

comment on table public.data_requests is
  'Запросы по 152-ФЗ: доступ к данным, удаление, отзыв согласия';

alter table public.data_requests enable row level security;

-- Гость может только создать заявку. Читать — только владелец/сервисный ключ.
drop policy if exists data_requests_insert on public.data_requests;
create policy data_requests_insert on public.data_requests
  for insert
  with check (
    length(btrim(contact)) between 3 and 200
    and length(coalesce(comment, '')) <= 2000
  );

-- 3. Время согласия на рекламу
alter table public.orders
  add column if not exists marketing_consent_at timestamptz;

comment on column public.orders.marketing_consent_at is
  'Момент, когда покупатель поставил галочку согласия на рекламные сообщения';

-- Проверка
-- select column_name from information_schema.columns
--  where table_name in ('sellers','orders') and column_name in ('inn','marketing_consent_at');
-- select * from public.data_requests order by created_at desc limit 5;
