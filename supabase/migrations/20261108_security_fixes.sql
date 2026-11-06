-- 20261108_security_fixes.sql
-- Точечные фиксы по итогам red-team прогона 06.11.2026.

-- =====================================================================
-- 1. Промокоды: закрыть публичный листинг (утечка всех кодов + used_by_order_ids)
-- =====================================================================
drop policy if exists promocodes_public_read on public.promocodes;
revoke select on public.promocodes from anon;

-- Проверка кода без раскрытия таблицы: отдаём только то, что нужно корзине.
create or replace function public.promo_validate(
  p_code text,
  p_seller_id bigint default null,
  p_subtotal integer default 0
)
returns table(
  valid boolean,
  discount integer,
  percent integer,
  min_total integer,
  code text,
  expires_at timestamptz,
  seller_id bigint,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.promocodes%rowtype;
begin
  perform public.check_rate_limit('promo_validate', 60, interval '10 minutes');

  if btrim(coalesce(p_code, '')) = '' then
    return query select false, 0, 0, 0, null::text, null::timestamptz, null::bigint,
      'Введите промокод'::text;
    return;
  end if;

  select * into v
    from public.promocodes pr
   where upper(pr.code) = upper(btrim(p_code))
   limit 1;

  if v.id is null then
    return query select false, 0, 0, 0, null::text, null::timestamptz, null::bigint,
      'Промокод не найден'::text;
    return;
  end if;

  if not coalesce(v.active, false) then
    return query select false, 0, v.discount_percent, coalesce(v.min_total, 0),
      v.code, v.expires_at, v.seller_id, 'Промокод неактивен'::text;
    return;
  end if;

  if v.expires_at is not null and v.expires_at <= now() then
    return query select false, 0, v.discount_percent, coalesce(v.min_total, 0),
      v.code, v.expires_at, v.seller_id, 'Промокод истёк'::text;
    return;
  end if;

  if p_seller_id is not null
     and v.seller_id is not null
     and v.seller_id <> p_seller_id then
    return query select false, 0, v.discount_percent, coalesce(v.min_total, 0),
      v.code, v.expires_at, v.seller_id, 'Промокод другого продавца'::text;
    return;
  end if;

  if v.max_uses is not null and coalesce(v.used_count, 0) >= v.max_uses then
    return query select false, 0, v.discount_percent, coalesce(v.min_total, 0),
      v.code, v.expires_at, v.seller_id, 'Лимит использований исчерпан'::text;
    return;
  end if;

  if coalesce(v.min_total, 0) > coalesce(p_subtotal, 0) then
    return query select false, 0, v.discount_percent, coalesce(v.min_total, 0),
      v.code, v.expires_at, v.seller_id,
      ('Минимальная сумма — ' || coalesce(v.min_total, 0) || ' ₽')::text;
    return;
  end if;

  return query
    select true,
           least(coalesce(p_subtotal, 0),
                 round(coalesce(p_subtotal, 0) * v.discount_percent / 100.0)::int),
           v.discount_percent,
           coalesce(v.min_total, 0),
           v.code,
           v.expires_at,
           v.seller_id,
           ('Скидка −' || v.discount_percent || '%')::text;
end;
$$;

revoke all on function public.promo_validate(text, bigint, integer) from public;
grant execute on function public.promo_validate(text, bigint, integer) to anon, authenticated;

-- =====================================================================
-- 2. Промокоды: гонка max_uses (5 параллельных заказов проходили лимит 1)
--    Сериализуем по коду промокода на время транзакции заказа.
-- =====================================================================
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
  v_phone text;
  v_count integer;
  v_subtotal integer;
  v_promo_id bigint;
  v_discount integer;
  new_order public.orders;
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

  perform pg_advisory_xact_lock(hashtext('mora-order:' || v_phone));

  select count(*) into v_count
    from public.orders o
   where regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone
     and o.created_at > now() - interval '10 minutes';
  if v_count >= 5 then
    raise exception 'Слишком много заказов. Попробуйте через 10 минут.';
  end if;

  v_subtotal := public.order_subtotal(p_items, p_seller_id);

  -- защита от гонки лимита использований промокода
  if btrim(coalesce(p_promo_code, '')) <> '' then
    perform pg_advisory_xact_lock(
      hashtext('mora-promo:' || upper(btrim(p_promo_code)))
    );
  end if;

  select pd.promo_id, pd.discount into v_promo_id, v_discount
    from public.promo_discount_for(p_promo_code, p_seller_id, v_subtotal) pd;

  new_order := public.create_order_single(
    p_customer_name, p_customer_phone, p_customer_email,
    p_items, p_seller_id, v_discount, p_promo_code, p_marketing_consent
  );

  if v_promo_id is not null then
    update public.promocodes
       set used_count = coalesce(used_count, 0) + 1,
           used_by_order_ids = array_append(
             coalesce(used_by_order_ids, '{}'::bigint[]), new_order.id)
     where id = v_promo_id;
  end if;

  return new_order;
end;
$$;

create or replace function public.create_orders_batch(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_groups jsonb,
  p_promo_code text default null,
  p_marketing_consent boolean default false
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_count integer;
  v_n integer;
  v_idx integer;
  v_group jsonb;
  v_seller bigint;
  v_items jsonb;
  v_subtotal integer;
  v_subtotals integer[] := '{}';
  v_total_sub integer := 0;
  v_promo_id bigint;
  v_discount_total integer := 0;
  v_remaining integer := 0;
  v_discount integer;
  v_order public.orders;
  v_order_ids bigint[] := '{}';
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

  if p_groups is null or jsonb_typeof(p_groups) <> 'array'
     or jsonb_array_length(p_groups) = 0 then
    raise exception 'Корзина пуста';
  end if;
  v_n := jsonb_array_length(p_groups);
  if v_n > 20 then
    raise exception 'Слишком много магазинов в заказе';
  end if;

  perform pg_advisory_xact_lock(hashtext('mora-order:' || v_phone));

  select count(*) into v_count
    from public.orders o
   where regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone
     and o.created_at > now() - interval '10 minutes';
  if v_count + v_n > 5 then
    raise exception 'Слишком много заказов. Попробуйте через 10 минут.';
  end if;

  for v_idx in 0..v_n - 1 loop
    v_group := p_groups->v_idx;
    v_seller := nullif(v_group->>'seller_id', '')::bigint;
    v_items := v_group->'items';
    v_subtotal := public.order_subtotal(v_items, v_seller);
    v_subtotals := array_append(v_subtotals, v_subtotal);
    v_total_sub := v_total_sub + v_subtotal;
  end loop;

  -- защита от гонки лимита использований промокода
  if btrim(coalesce(p_promo_code, '')) <> '' then
    perform pg_advisory_xact_lock(
      hashtext('mora-promo:' || upper(btrim(p_promo_code)))
    );
  end if;

  select pd.promo_id, pd.discount into v_promo_id, v_discount_total
    from public.promo_discount_for(p_promo_code, null, v_total_sub, false) pd;

  if v_promo_id is not null then
    for v_idx in 0..v_n - 1 loop
      v_group := p_groups->v_idx;
      v_seller := nullif(v_group->>'seller_id', '')::bigint;
      perform public.promo_discount_for(p_promo_code, v_seller, v_subtotals[v_idx + 1]);
    end loop;
  end if;

  v_remaining := v_discount_total;

  for v_idx in 0..v_n - 1 loop
    v_group := p_groups->v_idx;
    v_seller := nullif(v_group->>'seller_id', '')::bigint;
    v_items := v_group->'items';

    if v_idx = v_n - 1 then
      v_discount := v_remaining;
    else
      v_discount := round(v_discount_total * v_subtotals[v_idx + 1]::numeric / v_total_sub)::int;
    end if;
    v_discount := least(greatest(v_discount, 0), v_subtotals[v_idx + 1]);
    v_remaining := v_remaining - v_discount;

    v_order := public.create_order_single(
      p_customer_name, p_customer_phone, p_customer_email,
      v_items, v_seller, v_discount, p_promo_code, p_marketing_consent
    );

    v_order_ids := array_append(v_order_ids, v_order.id);
    return next v_order;
  end loop;

  if v_promo_id is not null then
    update public.promocodes
       set used_count = coalesce(used_count, 0) + 1,
           used_by_order_ids = array_cat(
             coalesce(used_by_order_ids, '{}'::bigint[]), v_order_ids)
     where id = v_promo_id;
  end if;
end;
$$;

-- =====================================================================
-- 3. Заказы: продавец не должен менять платёжные поля
-- =====================================================================
create or replace function public.orders_protect_money()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.total              := old.total;
    new.items              := old.items;
    new.seller_id          := old.seller_id;
    new.commission_percent := old.commission_percent;
    new.commission_amount  := old.commission_amount;
    new.promo_code         := old.promo_code;
    new.promo_discount     := old.promo_discount;
    new.access_token       := old.access_token;
    new.customer_name      := old.customer_name;
    new.customer_phone     := old.customer_phone;
    new.customer_email     := old.customer_email;
    new.marketing_consent  := old.marketing_consent;
    -- платёжный статус подтверждает только админ
    new.payment_status     := old.payment_status;
    new.paid_at            := old.paid_at;
  end if;
  return new;
end;
$$;

-- =====================================================================
-- 4. Товары: продавец не может подделать статистику при INSERT
-- =====================================================================
create or replace function public.products_protect_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.is_admin() then
      new.rating    := 0;
      new.reviews   := 0;
      new.purchases := 0;
    end if;
    return new;
  end if;

  if current_setting('mora.recalc_stats', true) = 'on' then
    return new;
  end if;

  if auth.uid() is not null and not public.is_admin() then
    new.rating    := old.rating;
    new.reviews   := old.reviews;
    new.purchases := old.purchases;
  end if;
  return new;
end;
$$;

drop trigger if exists products_protect_stats on public.products;
create trigger products_protect_stats
  before insert or update on public.products
  for each row execute function public.products_protect_stats();

-- =====================================================================
-- 5. Отзывы: ограничения длины (анонимный INSERT принимал 200 КБ текста)
-- =====================================================================
alter table public.reviews drop constraint if exists reviews_author_len_check;
alter table public.reviews
  add constraint reviews_author_len_check
  check (char_length(btrim(author_name)) between 1 and 80);

alter table public.reviews drop constraint if exists reviews_text_len_check;
alter table public.reviews
  add constraint reviews_text_len_check
  check (char_length(btrim(text)) between 1 and 2000);

-- =====================================================================
-- 6. Чат: продавец не может переписывать сообщения и токен треда
-- =====================================================================
create or replace function public.chat_messages_protect_body()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.body       := old.body;
    new.sender     := old.sender;
    new.thread_id  := old.thread_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_protect_body on public.chat_messages;
create trigger chat_messages_protect_body
  before update on public.chat_messages
  for each row execute function public.chat_messages_protect_body();

create or replace function public.chat_threads_protect_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.token          := old.token;
    new.customer_phone := old.customer_phone;
    new.customer_name  := old.customer_name;
    new.seller_id      := old.seller_id;
    new.created_at     := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists chat_threads_protect_fields on public.chat_threads;
create trigger chat_threads_protect_fields
  before update on public.chat_threads
  for each row execute function public.chat_threads_protect_fields();

-- =====================================================================
-- 7. Платежи комиссии: разумные границы суммы/комментария
-- =====================================================================
alter table public.commission_payments
  drop constraint if exists commission_payments_amount_check;
alter table public.commission_payments
  add constraint commission_payments_amount_check
  check (amount > 0 and amount <= 10000000);

alter table public.commission_payments
  drop constraint if exists commission_payments_comment_check;
alter table public.commission_payments
  add constraint commission_payments_comment_check
  check (char_length(coalesce(comment, '')) <= 500);
