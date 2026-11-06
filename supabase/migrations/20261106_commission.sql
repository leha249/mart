-- ============================================================
-- MØRA MART — комиссия вместо подписки (06.11.2026)
-- ============================================================
-- 1. Подписка больше не управляет витриной: продавец платит
--    процент с заказов, а не 600 ₽/мес.
-- 2. Комиссия считается и фиксируется в момент заказа.
-- 3. Заказ по нескольким продавцам создаётся одной транзакцией.
-- 4. Storage: файлы грузятся в папку пользователя.
-- 5. Публичная витрина продавца — через view без служебных полей.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Комиссия продавца
-- ------------------------------------------------------------
alter table public.sellers
  add column if not exists commission_percent numeric(5,2)
    not null default 10
    check (commission_percent >= 0 and commission_percent <= 50);

comment on column public.sellers.commission_percent is
  'Процент комиссии платформы с суммы заказа. 0..50, по умолчанию 10.';

alter table public.orders
  add column if not exists commission_percent numeric(5,2) not null default 0;
alter table public.orders
  add column if not exists commission_amount integer not null default 0;

comment on column public.orders.commission_amount is
  'Комиссия платформы по этому заказу, рубли. Считается в create_order.';

-- Продавец не может сам поставить себе комиссию 0.
create or replace function public.sellers_protect_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status;
    new.subscription_until := old.subscription_until;
    new.subscription_plan := old.subscription_plan;
    new.commission_percent := old.commission_percent;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

-- Витрина больше не зависит от подписки.
drop policy if exists sellers_public_read on public.sellers;
create policy sellers_public_read on public.sellers
  for select using (status = 'active');

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (
    in_stock = true
    and (
      seller_id is null
      or exists (
        select 1 from public.sellers s
        where s.id = products.seller_id
          and s.status = 'active'
      )
    )
  );

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (
    seller_id is null
    or exists (
      select 1 from public.sellers s
      where s.id = categories.seller_id
        and s.status = 'active'
    )
  );

-- ------------------------------------------------------------
-- 2. Платежи комиссии
-- ------------------------------------------------------------
create table if not exists public.commission_payments (
  id bigserial primary key,
  seller_id bigint not null references public.sellers(id) on delete cascade,
  amount integer not null check (amount > 0),
  method text not null default 'sbp',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.commission_payments enable row level security;

drop policy if exists cp_seller_read on public.commission_payments;
create policy cp_seller_read on public.commission_payments
  for select using (seller_id = public.my_seller_id());

drop policy if exists cp_seller_insert on public.commission_payments;
create policy cp_seller_insert on public.commission_payments
  for insert with check (
    seller_id = public.my_seller_id() and status = 'pending'
  );

drop policy if exists cp_admin_all on public.commission_payments;
create policy cp_admin_all on public.commission_payments
  for all using (public.is_admin()) with check (public.is_admin());

-- Сумму и продавца не подменяют из браузера.
create or replace function public.commission_payments_normalize()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.seller_id := public.my_seller_id();
    new.status := 'pending';
    new.confirmed_at := null;
    new.method := coalesce(nullif(btrim(new.method), ''), 'sbp');
    if new.amount is null or new.amount <= 0 then
      raise exception 'Некорректная сумма';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists commission_payments_normalize on public.commission_payments;
create trigger commission_payments_normalize
  before insert on public.commission_payments
  for each row execute function public.commission_payments_normalize();

create or replace function public.confirm_commission_payment(payment_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'only admin can confirm commission payments';
  end if;

  update public.commission_payments
     set status = 'confirmed', confirmed_at = now()
   where id = payment_id and status = 'pending';

  if not found then
    raise exception 'payment not found or already processed';
  end if;
end;
$$;

revoke all on function public.confirm_commission_payment(bigint) from public;
grant execute on function public.confirm_commission_payment(bigint) to authenticated;

-- Баланс: начислено / оплачено / долг.
create or replace view public.seller_commission_balance
with (security_invoker = true) as
select
  b.seller_id,
  b.accrued,
  b.paid,
  (b.accrued - b.paid) as debt
from (
  select
    s.id as seller_id,
    coalesce((
      select sum(o.commission_amount)::int
        from public.orders o
       where o.seller_id = s.id and o.status <> 'cancelled'
    ), 0) as accrued,
    coalesce((
      select sum(cp.amount)::int
        from public.commission_payments cp
       where cp.seller_id = s.id and cp.status = 'confirmed'
    ), 0) as paid
  from public.sellers s
) b;

revoke all on public.seller_commission_balance from public, anon;
grant select on public.seller_commission_balance to authenticated;

-- ------------------------------------------------------------
-- 3. Расчёт заказа: общие функции
-- ------------------------------------------------------------
create or replace function public.order_subtotal(
  p_items jsonb,
  p_seller_id bigint
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sum integer := 0;
  v_item record;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Корзина пуста';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Слишком много позиций в заказе';
  end if;
  if p_seller_id is not null and not exists (
    select 1 from public.sellers where id = p_seller_id and status = 'active'
  ) then
    raise exception 'Магазин недоступен';
  end if;

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

    v_sum := v_sum + (v_product.price * v_qty);
  end loop;

  if v_sum <= 0 then
    raise exception 'Некорректная сумма заказа';
  end if;
  return v_sum;
end;
$$;

revoke all on function public.order_subtotal(jsonb, bigint) from public;

drop function if exists public.promo_discount_for(text, bigint, integer);

create or replace function public.promo_discount_for(
  p_code text,
  p_seller_id bigint,
  p_subtotal integer,
  p_check_seller boolean default true
)
returns table (promo_id bigint, discount integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promocodes%rowtype;
begin
  if btrim(coalesce(p_code, '')) = '' then
    return query select null::bigint, 0;
    return;
  end if;

  select * into v_promo
    from public.promocodes pr
   where upper(pr.code) = upper(btrim(p_code))
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
  if p_check_seller
     and v_promo.seller_id is not null
     and v_promo.seller_id <> coalesce(p_seller_id, -1) then
    raise exception 'Промокод другого продавца';
  end if;
  if v_promo.max_uses is not null
     and coalesce(v_promo.used_count, 0) >= v_promo.max_uses then
    raise exception 'Лимит использований промокода исчерпан';
  end if;
  if coalesce(v_promo.min_total, 0) > p_subtotal then
    raise exception 'Сумма заказа меньше минимальной для промокода';
  end if;

  return query
    select v_promo.id,
           least(p_subtotal, round(p_subtotal * v_promo.discount_percent / 100.0)::int);
end;
$$;

revoke all on function public.promo_discount_for(text, bigint, integer, boolean) from public;

-- Одна группа продавца: скидка уже посчитана вызывающей стороной.
create or replace function public.create_order_single(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_items jsonb,
  p_seller_id bigint,
  p_discount integer,
  p_promo_code text,
  p_marketing_consent boolean
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order public.orders;
  v_items jsonb := '[]'::jsonb;
  v_subtotal integer;
  v_discount integer;
  v_total integer;
  v_item record;
  v_product public.products%rowtype;
  v_qty integer;
  v_pct numeric(5,2) := 0;
  v_commission integer := 0;
begin
  v_subtotal := public.order_subtotal(p_items, p_seller_id);

  v_discount := least(greatest(coalesce(p_discount, 0), 0), v_subtotal);
  v_total := v_subtotal - v_discount;

  if p_seller_id is not null then
    select coalesce(commission_percent, 10) into v_pct
      from public.sellers where id = p_seller_id;
    v_pct := coalesce(v_pct, 10);
    v_commission := round(v_total * v_pct / 100.0)::int;
  end if;

  -- Состав собираем по данным БД (цена/название/картинка — серверные).
  for v_item in
    select value as item from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item.item->>'quantity')::int, 1);
    select * into v_product from public.products
     where id = (v_item.item->>'id')::bigint;

    v_items := v_items || jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'image', v_product.image,
      'quantity', v_qty,
      'size', nullif(btrim(coalesce(v_item.item->>'size', '')), '')
    );
  end loop;

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
    marketing_consent_at,
    commission_percent,
    commission_amount
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
    case when coalesce(p_marketing_consent, false) then now() else null end,
    v_pct,
    v_commission
  )
  returning * into new_order;

  update public.products p
     set purchases = coalesce(p.purchases, 0) + (e.item->>'quantity')::int
    from jsonb_array_elements(v_items) as e(item)
   where p.id = (e.item->>'id')::bigint;

  return new_order;
end;
$$;

revoke all on function public.create_order_single(text, text, text, jsonb, bigint, integer, text, boolean) from public;

-- ------------------------------------------------------------
-- 4. Одиночный заказ (прежняя сигнатура)
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

  select count(*) into v_count
    from public.orders o
   where regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone
     and o.created_at > now() - interval '10 minutes';
  if v_count >= 5 then
    raise exception 'Слишком много заказов. Попробуйте через 10 минут.';
  end if;

  v_subtotal := public.order_subtotal(p_items, p_seller_id);

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

revoke all on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean) from public;
grant execute on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean) to anon, authenticated;

-- ------------------------------------------------------------
-- 5. Атомарный заказ по нескольким продавцам
-- ------------------------------------------------------------
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

  select count(*) into v_count
    from public.orders o
   where regexp_replace(o.customer_phone, '\D', '', 'g') = v_phone
     and o.created_at > now() - interval '10 minutes';
  if v_count + v_n > 5 then
    raise exception 'Слишком много заказов. Попробуйте через 10 минут.';
  end if;

  -- Первый проход: проверяем состав и считаем суммы.
  for v_idx in 0..v_n - 1 loop
    v_group := p_groups->v_idx;
    v_seller := nullif(v_group->>'seller_id', '')::bigint;
    v_items := v_group->'items';
    v_subtotal := public.order_subtotal(v_items, v_seller);
    v_subtotals := array_append(v_subtotals, v_subtotal);
    v_total_sub := v_total_sub + v_subtotal;
  end loop;

  -- Промокод — один раз на всю корзину, скидка распределяется пропорционально.
  -- Проверку принадлежности продавцу делаем ниже по каждому магазину.
  select pd.promo_id, pd.discount into v_promo_id, v_discount_total
    from public.promo_discount_for(p_promo_code, null, v_total_sub, false) pd;

  -- Промокод конкретного продавца проверяем по каждому магазину.
  if v_promo_id is not null and v_n > 1 then
    for v_idx in 0..v_n - 1 loop
      v_group := p_groups->v_idx;
      v_seller := nullif(v_group->>'seller_id', '')::bigint;
      perform public.promo_discount_for(p_promo_code, v_seller, v_subtotals[v_idx + 1]);
    end loop;
  end if;

  v_remaining := v_discount_total;

  -- Второй проход: вставляем всё в одной транзакции.
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

revoke all on function public.create_orders_batch(text, text, text, jsonb, text, boolean) from public;
grant execute on function public.create_orders_batch(text, text, text, jsonb, text, boolean) to anon, authenticated;

-- ------------------------------------------------------------
-- 6. Публичная витрина продавца без служебных полей
-- ------------------------------------------------------------
drop view if exists public.sellers_public;

create view public.sellers_public
with (security_invoker = true) as
select
  s.id,
  s.name,
  s.slug,
  s.description,
  s.logo,
  s.cover,
  s.phone,
  s.email,
  s.status,
  s.hero_title,
  s.hero_subtitle,
  s.hero_image,
  s.hero_badge,
  s.about_title,
  s.about_text,
  s.about_image,
  s.about_badge,
  s.footer_text,
  s.accent_color,
  s.lookbook_images,
  s.legal_name,
  s.legal_type,
  s.ogrnip,
  s.inn,
  s.legal_address,
  s.created_at,
  s.updated_at
from public.sellers s;

revoke all on public.sellers_public from public, anon;
grant select on public.sellers_public to anon, authenticated;

-- ------------------------------------------------------------
-- 7. Storage: файлы только в своей папке
-- ------------------------------------------------------------
drop policy if exists "Auth insert products bucket" on storage.objects;
create policy "Auth insert products bucket" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'products'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "Auth update products bucket" on storage.objects;
create policy "Auth update products bucket" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'products'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'products'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "Auth delete products bucket" on storage.objects;
create policy "Auth delete products bucket" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'products'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ------------------------------------------------------------
-- 8. Перезагрузка схемы
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

commit;
