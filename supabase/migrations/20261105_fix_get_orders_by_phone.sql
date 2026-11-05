-- ============================================================
-- MØRA MART — фикс функции get_orders_by_phone
-- ============================================================
-- Симптом: в кабинете покупателя и на странице «Мои заказы»
-- появляется «Не удалось загрузить заказы», а RPC отдаёт:
--   42804: Returned type integer does not match expected type
--          numeric in column 4 (structure of query does not match
--          function result type)
--
-- Причина: функция объявляет колонку total как numeric, а тело
-- возвращает integer (или наоборот тип в orders.total изменился).
-- Лечится явными приведениями типов во всех колонках.
--
-- Бонус: телефон сравнивается только по цифрам, поэтому
-- «+7 900 555-35-35», «89005553535» и «+79005553535» — одно и то же.
--
-- Применить: Supabase → SQL Editor → New query → вставить → Run.
-- ============================================================

-- 1. Удаляем все существующие перегрузки функции
do $$
declare
  r record;
begin
  for r in
    select oid::regprocedure as sig
    from pg_proc
    where proname = 'get_orders_by_phone'
      and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function ' || r.sig;
  end loop;
end $$;

-- 2. Создаём заново с явными приведениями типов
create or replace function public.get_orders_by_phone(phone_input text)
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  total numeric,
  items jsonb,
  seller_id bigint
)
language sql
security definer
set search_path = public
as $$
  select
    o.id::bigint        as id,
    o.created_at        as created_at,
    o.status::text      as status,
    o.total::numeric    as total,
    o.items             as items,
    o.seller_id::bigint as seller_id
  from public.orders o
  where length(regexp_replace(coalesce(phone_input, ''), '\D', '', 'g')) >= 10
    and regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g')
      = regexp_replace(coalesce(phone_input, ''), '\D', '', 'g')
  order by o.created_at desc
  limit 20;
$$;

-- 3. Права: функцию должны вызывать и гость, и авторизованный покупатель
revoke all on function public.get_orders_by_phone(text) from public;
grant execute on function public.get_orders_by_phone(text) to anon, authenticated;

-- 4. Проверка (подставьте свой номер)
-- select * from public.get_orders_by_phone('+7 900 555-35-35');
