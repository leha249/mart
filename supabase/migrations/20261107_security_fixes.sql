-- ============================================================
-- MØRA MART — закрытие дыр, найденных аудитом 06.11.2026
-- ПРИМЕНЕНО к проекту twgslbfnksbrioxgeubb 06.11.2026.
-- ============================================================
-- Что внутри:
--   1. create_order_single / order_subtotal / promo_discount_for
--      больше не исполняются anon и authenticated (раньше revoke
--      from public не снимал гранты Supabase).
--   2. sellers: anon получает только публичные колонки
--      (user_id, commission_percent, subscription_* закрыты).
--   3. order_subtotal: понятная ошибка на пустую/отрицательную цену.
--   4. create_orders_batch: промокод проверяется по каждому магазину
--      всегда (было `and v_n > 1`), + advisory lock по телефону.
--   5. orders_protect_money: продавец не меняет сумму, комиссию,
--      позиции, токен и данные покупателя.
--   6. orders_check_promo_owner: промокод чужого продавца не проходит.
--   7. products_protect_stats + update_product_rating: рейтинг,
--      число отзывов и purchases пишутся только сервером.
--   8. reviews_public_insert: отзыв нельзя опубликовать мимо модерации.
--   9. Индексы под горячие запросы.
-- Отдельно (не входит в эту транзакцию, применено тем же днём):
--   update storage.buckets set file_size_limit = 5242880,
--     allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
--   where id = 'products';
-- ============================================================
begin;

-- 1. внутренние функции — только для сервера
revoke all on function public.create_order_single(text, text, text, jsonb, bigint, integer, text, boolean) from public, anon, authenticated;
revoke all on function public.order_subtotal(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.promo_discount_for(text, bigint, integer, boolean) from public, anon, authenticated;

-- 2. sellers: anon видит только публичные колонки
revoke select on public.sellers from anon;
grant select (
  id, name, slug, description, logo, cover, phone, email, status,
  hero_title, hero_subtitle, hero_image, hero_badge,
  about_title, about_text, about_image, about_badge,
  footer_text, accent_color, lookbook_images,
  legal_name, legal_type, ogrnip, inn, legal_address,
  created_at, updated_at
) on public.sellers to anon;

-- 3. order_subtotal: понятная ошибка на пустую/отрицательную цену
create or replace function public.order_subtotal(p_items jsonb, p_seller_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
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
    if v_product.price is null or v_product.price < 0 then
      raise exception 'Некорректная цена товара: %', v_product.name;
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
$fn$;

-- 4. create_orders_batch: промокод проверяется по каждому магазину всегда
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
as $fn$
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

  -- сериализуем заказы одного телефона: два параллельных batch
  -- больше не обходят лимит 5/10 минут
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

  select pd.promo_id, pd.discount into v_promo_id, v_discount_total
    from public.promo_discount_for(p_promo_code, null, v_total_sub, false) pd;

  -- Промокод — один раз на всю корзину. Если он принадлежит продавцу,
  -- он должен проходить в КАЖДОМ магазине корзины, иначе batch падает.
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
$fn$;

-- 5. защита денежных полей заказа
create or replace function public.orders_protect_money()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
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
  end if;
  return new;
end;
$fn$;

drop trigger if exists orders_protect_money on public.orders;
create trigger orders_protect_money
  before update on public.orders
  for each row execute function public.orders_protect_money();

-- 6. промокод применяется только в магазине своего продавца
create or replace function public.orders_check_promo_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.promo_code is null or btrim(new.promo_code) = '' then
    return new;
  end if;

  if not exists (
    select 1 from public.promocodes p
     where upper(p.code) = upper(btrim(new.promo_code))
  ) then
    return new;  -- неизвестный код: пусть решает вызывающий RPC
  end if;

  if not exists (
    select 1 from public.promocodes p
     where upper(p.code) = upper(btrim(new.promo_code))
       and (p.seller_id is null or p.seller_id = new.seller_id)
  ) then
    raise exception 'Промокод принадлежит другому продавцу'
      using errcode = 'P0001',
            hint = 'Промокод действует только в магазине, который его выдал.';
  end if;

  return new;
end;
$fn$;

drop trigger if exists orders_check_promo_owner on public.orders;
create trigger orders_check_promo_owner
  before insert on public.orders
  for each row execute function public.orders_check_promo_owner();

-- 7. рейтинг и счётчики товара — только из отзывов
create or replace function public.products_protect_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
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
$fn$;

drop trigger if exists products_protect_stats on public.products;
create trigger products_protect_stats
  before update on public.products
  for each row execute function public.products_protect_stats();

create or replace function public.update_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  target_product_id bigint;
begin
  if (tg_op = 'DELETE') then
    target_product_id := old.product_id;
  else
    target_product_id := new.product_id;
  end if;

  perform set_config('mora.recalc_stats', 'on', true);

  update public.products
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 1)
             from public.reviews r
            where r.product_id = target_product_id and r.approved = true
         ), 0),
         reviews = (
           select count(*)
             from public.reviews r
            where r.product_id = target_product_id and r.approved = true
         )
   where id = target_product_id;

  perform set_config('mora.recalc_stats', 'off', true);
  return coalesce(new, old);
end;
$fn$;

-- 8. отзыв нельзя опубликовать мимо модерации
drop policy if exists reviews_public_insert on public.reviews;
create policy reviews_public_insert on public.reviews
  for insert
  with check (approved = false);

-- 9. индексы
create index if not exists orders_seller_created_idx on public.orders (seller_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_created_idx on public.orders ((regexp_replace(customer_phone, '\D', '', 'g')), created_at desc);
create index if not exists products_seller_created_idx on public.products (seller_id, created_at desc);
create index if not exists products_popular_idx on public.products (purchases desc, rating desc) where in_stock;
create index if not exists reviews_product_approved_idx on public.reviews (product_id, approved);
create index if not exists commission_payments_seller_status_idx on public.commission_payments (seller_id, status);
create index if not exists chat_threads_seller_phone_idx on public.chat_threads (seller_id, customer_phone);
create index if not exists promocodes_upper_code_idx on public.promocodes (upper(code));
create index if not exists categories_seller_sort_idx on public.categories (seller_id, sort_order);

notify pgrst, 'reload schema';

commit;
