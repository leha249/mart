-- ============================================================
-- MØRA MART — security hardening (06.11.2026)
-- ============================================================
-- Закрывает находки аудита:
--   C-01 заказы по любому телефону (get_orders_by_phone)
--   C-02 чат по любому телефону (open_chat выдавал токен треда)
--   C-03 вход по коду: лимит запросов и попыток (SMS всё ещё нет)
--   H-01 create_order верил клиентской сумме и товарам
--   H-03 продавец мог сам продлить подписку и снять блокировку
--   M-01 сумма/срок подписки приходили с клиента
--   M-03 нет лимитов на публичные RPC
--   M-05 блокировка продавца не действовала на запись
--   L-04 накрутка purchases / used_count из браузера
-- Плюс: анонимные аналитические RPC, size_charts, data_requests.
--
-- ВАЖНО: применять вместе с фронтендом из этого же коммита.
-- Порядок: сначала миграция, затем перезапуск dev/деплой.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Продавец не может менять служебные поля сам
-- ------------------------------------------------------------
create or replace function public.sellers_protect_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null — это service_role/SQL Editor/владелец БД,
  -- им не мешаем. Ограничение только для живого JWT продавца.
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status;
    new.subscription_until := old.subscription_until;
    new.subscription_plan := old.subscription_plan;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists sellers_protect_admin_fields on public.sellers;
create trigger sellers_protect_admin_fields
  before update on public.sellers
  for each row execute function public.sellers_protect_admin_fields();

-- my_seller_id() теперь даёт доступ только активным продавцам:
-- pending не может публиковать товары, blocked — читать заказы и чаты.
create or replace function public.my_seller_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select id
    from public.sellers
   where user_id = auth.uid()
     and status = 'active'
   limit 1;
$$;

-- ------------------------------------------------------------
-- 2. Заказы: одноразовый токен доступа вместо поиска по телефону
-- ------------------------------------------------------------
alter table public.orders
  add column if not exists access_token uuid not null default gen_random_uuid();

create unique index if not exists orders_access_token_key
  on public.orders (access_token);

-- Ускоряет антиспам-проверку в create_order
create index if not exists orders_phone_digits_idx
  on public.orders ((regexp_replace(customer_phone, '\D', '', 'g')));

-- Прямая вставка в orders закрыта: только через definer-RPC create_order.
drop policy if exists orders_public_insert on public.orders;

create or replace function public.get_orders_by_tokens(p_tokens uuid[])
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  total numeric,
  items jsonb,
  seller_id bigint,
  tracking_number text,
  carrier text,
  payment_status text,
  customer_name text,
  access_token uuid
)
language sql
security definer
set search_path = public
as $$
  select
    o.id::bigint,
    o.created_at,
    o.status::text,
    o.total::numeric,
    o.items,
    o.seller_id::bigint,
    o.tracking_number,
    o.carrier,
    o.payment_status,
    o.customer_name,
    o.access_token
  from public.orders o
  where o.access_token = any (p_tokens)
  order by o.created_at desc
  limit 50;
$$;

revoke all on function public.get_orders_by_tokens(uuid[]) from public;
grant execute on function public.get_orders_by_tokens(uuid[]) to anon, authenticated;

-- Телефон больше не является паролем.
revoke all on function public.get_orders_by_phone(text) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 3. create_order: цена, скидка и состав считаются на сервере
-- ------------------------------------------------------------
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_items jsonb,
  p_total numeric,
  p_seller_id bigint,
  p_promo_code text default null,
  p_promo_discount numeric default null,
  p_marketing_consent boolean default false
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order public.orders;
  v_items jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_total integer := 0;
  v_item record;
  v_product public.products%rowtype;
  v_promo public.promocodes%rowtype;
  v_qty integer;
  v_phone text;
  v_count integer;
begin
  if length(btrim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Укажите имя';
  end if;
  if length(btrim(coalesce(p_customer_name, ''))) > 120 then
    raise exception 'Слишком длинное имя';
  end if;

  v_phone := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
  if length(v_phone) < 10 then
    raise exception 'Укажите корректный телефон';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Корзина пуста';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Слишком много позиций в заказе';
  end if;

  -- Антиспам: не больше 5 заказов с одного телефона за 10 минут.
  select count(*) into v_count
    from public.orders o
   where regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone
     and o.created_at > now() - interval '10 minutes';
  if v_count >= 5 then
    raise exception 'Слишком много заказов. Попробуйте через 10 минут.';
  end if;

  -- Состав и цены берём из БД, клиентские price/name/image игнорируем.
  for v_item in
    select value as item from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item.item->>'quantity')::int, 1);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'Некорректное количество товара';
    end if;

    select * into v_product
      from public.products
     where id = (v_item.item->>'id')::bigint;

    if v_product.id is null then
      raise exception 'Товар не найден';
    end if;
    if not coalesce(v_product.in_stock, true) then
      raise exception 'Товар закончился: %', v_product.name;
    end if;
    if coalesce(v_product.seller_id, -1) <> coalesce(p_seller_id, -1) then
      raise exception 'Товар принадлежит другому продавцу';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_items := v_items || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'image', v_product.image,
      'quantity', v_qty,
      'size', nullif(btrim(coalesce(v_item.item->>'size', '')), '')
    );
  end loop;

  if v_subtotal <= 0 then
    raise exception 'Некорректная сумма заказа';
  end if;

  -- Промокод проверяем здесь, а не на клиенте.
  if btrim(coalesce(p_promo_code, '')) <> '' then
    select * into v_promo
      from public.promocodes
     where upper(code) = upper(btrim(p_promo_code))
     limit 1;

    if v_promo.id is null then
      raise exception 'Промокод не найден';
    end if;
    if not coalesce(v_promo.active, false) then
      raise exception 'Промокод неактивен';
    end if;
    if v_promo.expires_at is not null and v_promo.expires_at <= now() then
      raise exception 'Срок действия промокода истёк';
    end if;
    if v_promo.seller_id is not null
       and v_promo.seller_id <> coalesce(p_seller_id, -1) then
      raise exception 'Промокод другого продавца';
    end if;
    if v_promo.max_uses is not null
       and coalesce(v_promo.used_count, 0) >= v_promo.max_uses then
      raise exception 'Лимит использований промокода исчерпан';
    end if;
    if coalesce(v_promo.min_total, 0) > v_subtotal then
      raise exception 'Сумма заказа меньше минимальной для промокода';
    end if;

    v_discount := least(
      v_subtotal,
      round(v_subtotal * v_promo.discount_percent / 100.0)::int
    );
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

  insert into public.orders (
    customer_name,
    customer_phone,
    customer_email,
    items,
    total,
    seller_id,
    promo_code,
    promo_discount,
    marketing_consent,
    marketing_consent_at
  )
  values (
    btrim(p_customer_name),
    btrim(p_customer_phone),
    nullif(btrim(coalesce(p_customer_email, '')), ''),
    v_items,
    v_total,
    p_seller_id,
    nullif(btrim(coalesce(p_promo_code, '')), ''),
    v_discount,
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() else null end
  )
  returning * into new_order;

  -- Учёт промокода — атомарно, здесь, а не из браузера.
  if v_promo.id is not null then
    update public.promocodes
       set used_count = coalesce(used_count, 0) + 1,
           used_by_order_ids = array_append(
             coalesce(used_by_order_ids, '{}'::bigint[]),
             new_order.id
           )
     where id = v_promo.id;
  end if;

  -- purchases тоже считаем здесь.
  update public.products p
     set purchases = coalesce(p.purchases, 0) + (e.item->>'quantity')::int
    from jsonb_array_elements(v_items) as e(item)
   where p.id = (e.item->>'id')::bigint;

  return new_order;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean) from public;
grant execute on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean) to anon, authenticated;

-- Клиентские счётчики больше не нужны и не должны быть доступны анониму.
revoke all on function public.increment_product_purchases(jsonb) from public, anon, authenticated;
revoke all on function public.increment_promo_usage(bigint) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 4. Чат: токен треда не выдаётся по одному телефону
-- ------------------------------------------------------------
drop function if exists public.open_chat(bigint, text, text);

alter table public.chat_threads
  drop constraint if exists chat_threads_seller_id_customer_phone_key;

create or replace function public.open_chat(
  p_seller_id bigint,
  p_phone text,
  p_name text default null,
  p_token uuid default null
)
returns table (thread_id bigint, token uuid, seller_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  t record;
  v_recent integer;
begin
  if length(digits) < 10 then
    raise exception 'phone required';
  end if;

  -- Продолжаем существующий тред только по его токену (устройство покупателя).
  -- Поля квалифицируем через ct: иначе token конфликтует с OUT-параметром token.
  if p_token is not null then
    select ct.* into t
      from public.chat_threads ct
     where ct.seller_id = p_seller_id
       and ct.customer_phone = digits
       and ct.token = p_token
     limit 1;

    if found then
      return query
        select t.id, t.token, s.name
          from public.sellers s
         where s.id = p_seller_id;
      return;
    end if;
  end if;

  -- Без токена — новый тред, но не больше 5 в сутки на телефон.
  select count(*) into v_recent
    from public.chat_threads
   where customer_phone = digits
     and created_at > now() - interval '1 day';
  if v_recent >= 5 then
    raise exception 'Слишком много обращений. Попробуйте позже.';
  end if;

  insert into public.chat_threads (seller_id, customer_phone, customer_name)
  values (p_seller_id, digits, nullif(btrim(coalesce(p_name, '')), ''))
  returning * into t;

  return query
    select t.id, t.token, s.name
      from public.sellers s
     where s.id = p_seller_id;
end;
$$;

revoke all on function public.open_chat(bigint, text, text, uuid) from public;
grant execute on function public.open_chat(bigint, text, text, uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- 5. Вход покупателя: лимит запросов и попыток (пока тестовый режим)
-- ------------------------------------------------------------
alter table public.customer_codes
  add column if not exists attempts integer not null default 0;

create index if not exists customer_codes_phone_idx
  on public.customer_codes (phone, created_at desc);

create or replace function public.create_customer_code(phone_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  new_code text;
  v_today integer;
begin
  normalized := regexp_replace(phone_input, '[^0-9]', '', 'g');

  if length(normalized) < 10 then
    raise exception 'Некорректный номер телефона';
  end if;

  if exists (
    select 1 from public.customer_codes
     where phone = normalized
       and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'Код уже отправлен. Подождите минуту.';
  end if;

  select count(*) into v_today
    from public.customer_codes
   where phone = normalized
     and created_at > now() - interval '24 hours';
  if v_today >= 5 then
    raise exception 'Слишком много запросов кода. Попробуйте завтра.';
  end if;

  new_code := lpad(floor(random() * 10000)::text, 4, '0');

  delete from public.customer_codes
   where phone = normalized
     and (used = true or expires_at < now());

  insert into public.customer_codes (phone, code, expires_at)
  values (normalized, new_code, now() + interval '5 minutes');

  return new_code;
end;
$$;

create or replace function public.verify_customer_code(phone_input text, code_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  found_id bigint;
begin
  normalized := regexp_replace(phone_input, '[^0-9]', '', 'g');

  select id into found_id
    from public.customer_codes
   where phone = normalized
     and code = code_input
     and used = false
     and expires_at > now()
   order by created_at desc
   limit 1;

  if found_id is null then
    -- Считаем неудачные попытки и после 5 гасим все живые коды номера.
    update public.customer_codes
       set attempts = attempts + 1
     where phone = normalized
       and used = false
       and expires_at > now();

    update public.customer_codes
       set used = true
     where phone = normalized
       and used = false
       and attempts >= 5;

    return false;
  end if;

  update public.customer_codes
     set used = true
   where id = found_id;

  return true;
end;
$$;

revoke all on function public.create_customer_code(text) from public;
revoke all on function public.verify_customer_code(text, text) from public;
grant execute on function public.create_customer_code(text) to anon, authenticated;
grant execute on function public.verify_customer_code(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 5.1. Заявка на подписку: сумма и срок считаются на сервере
-- ------------------------------------------------------------
-- Тариф зашит здесь же: 600 ₽/мес (как SUBSCRIPTION.priceMonth в src/services/subscriptions.ts).
-- Продавец не может прислать amount=0, months=120 и «оплатить» себе десять лет.
create or replace function public.subscription_payments_normalize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.months := least(greatest(coalesce(new.months, 1), 1), 12);
    new.amount := 600 * new.months;
    new.status := 'pending';
    new.confirmed_at := null;
    new.method := 'sbp';
    if public.my_seller_id() is not null then
      new.seller_id := public.my_seller_id();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists subscription_payments_normalize on public.subscription_payments;
create trigger subscription_payments_normalize
  before insert on public.subscription_payments
  for each row execute function public.subscription_payments_normalize();

-- ------------------------------------------------------------
-- 6. Аналитика: аноним не должен видеть выручку платформы
-- ------------------------------------------------------------
create or replace function public.get_revenue_by_day(days_count integer default 30)
returns table (day date, orders_count bigint, revenue bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  return query
  select
    date_trunc('day', o.created_at)::date as day,
    count(*)::bigint as orders_count,
    coalesce(sum(o.total)::bigint, 0) as revenue
  from public.orders o
  where o.status <> 'cancelled'
    and o.created_at >= now() - (days_count || ' days')::interval
    and (public.is_admin() or o.seller_id = public.my_seller_id())
  group by 1
  order by 1 asc;
end;
$$;

create or replace function public.get_top_products(limit_count integer default 5)
returns table (product_id bigint, product_name text, product_image text, sold_count bigint, revenue bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  return query
  select
    (item->>'id')::bigint as product_id,
    (item->>'name')::text as product_name,
    (item->>'image')::text as product_image,
    sum((item->>'quantity')::int)::bigint as sold_count,
    sum(((item->>'price')::int * (item->>'quantity')::int))::bigint as revenue
  from public.orders o,
       jsonb_array_elements(o.items) as item
  where o.status <> 'cancelled'
    and (public.is_admin() or o.seller_id = public.my_seller_id())
  group by 1, 2, 3
  order by sold_count desc
  limit limit_count;
end;
$$;

revoke all on function public.get_revenue_by_day(integer) from public, anon;
revoke all on function public.get_top_products(integer) from public, anon;
grant execute on function public.get_revenue_by_day(integer) to authenticated;
grant execute on function public.get_top_products(integer) to authenticated;

-- ------------------------------------------------------------
-- 7. Справочник размеров правит только админ
-- ------------------------------------------------------------
drop policy if exists size_charts_auth_all on public.size_charts;
drop policy if exists size_charts_admin_all on public.size_charts;
create policy size_charts_admin_all on public.size_charts
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 8. Заявки по 152-ФЗ: админ может их прочитать и закрыть
-- ------------------------------------------------------------
alter table public.data_requests
  add column if not exists status text not null default 'new';
alter table public.data_requests
  add column if not exists processed_at timestamptz;

drop policy if exists data_requests_admin_read on public.data_requests;
create policy data_requests_admin_read on public.data_requests
  for select using (public.is_admin());

drop policy if exists data_requests_admin_update on public.data_requests;
create policy data_requests_admin_update on public.data_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 9. Перезагрузить схему в PostgREST
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

commit;
