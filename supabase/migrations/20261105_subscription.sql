-- ============================================================
-- MØRA MART — подписка продавцов + закрытие дыр в RLS
-- ============================================================
-- 1. Подписка: trial 30 дней, 600 ₽/мес, оплата переводом,
--    подтверждает админ. Просрочка → товары пропадают с витрины.
-- 2. Убираем политики «true», из-за которых любой авторизованный
--    мог читать все заказы и удалять чужие товары/промокоды.
-- ============================================================

-- ---------- 1. ПОДПИСКА ----------
alter table public.sellers
  add column if not exists subscription_until timestamptz
    not null default (now() + interval '30 days');

alter table public.sellers
  add column if not exists subscription_plan text
    not null default 'trial';

comment on column public.sellers.subscription_until is
  'До какой даты оплачена подписка (включая trial). После — витрина скрыта.';

create table if not exists public.subscription_payments (
  id bigserial primary key,
  seller_id bigint not null references public.sellers(id) on delete cascade,
  amount numeric not null,
  months int not null default 1,
  method text not null default 'sbp',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.subscription_payments enable row level security;

drop policy if exists sp_seller_insert on public.subscription_payments;
create policy sp_seller_insert on public.subscription_payments
  for insert with check (
    seller_id = public.my_seller_id() and status = 'pending'
  );

drop policy if exists sp_seller_read on public.subscription_payments;
create policy sp_seller_read on public.subscription_payments
  for select using (seller_id = public.my_seller_id());

drop policy if exists sp_admin_all on public.subscription_payments;
create policy sp_admin_all on public.subscription_payments
  for all using (public.is_admin()) with check (public.is_admin());

-- Подтверждение оплаты: админ нажимает кнопку — подписка продлевается
create or replace function public.confirm_subscription_payment(payment_id bigint)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  new_until timestamptz;
begin
  if not public.is_admin() then
    raise exception 'only admin can confirm payments';
  end if;

  select * into p from public.subscription_payments where id = payment_id;
  if not found then
    raise exception 'payment not found';
  end if;
  if p.status <> 'pending' then
    raise exception 'payment already processed';
  end if;

  update public.subscription_payments
     set status = 'confirmed', confirmed_at = now()
   where id = payment_id;

  update public.sellers
     set subscription_until = greatest(coalesce(subscription_until, now()), now())
                              + (p.months || ' months')::interval,
         subscription_plan = 'paid'
   where id = p.seller_id
  returning subscription_until into new_until;

  return new_until;
end;
$$;

revoke all on function public.confirm_subscription_payment(bigint) from public;
grant execute on function public.confirm_subscription_payment(bigint) to authenticated;

-- ---------- 2. ЗАКРЫТИЕ ДЫР В RLS ----------

-- products: любой авторизованный мог читать/править/удалять всё
drop policy if exists "products_select_all" on public.products;
drop policy if exists "products_insert_auth" on public.products;
drop policy if exists "products_update_auth" on public.products;
drop policy if exists "products_delete_auth" on public.products;
drop policy if exists "..." on public.products;

-- orders: любой авторизованный читал и правил ВСЕ заказы (включая чужих покупателей)
drop policy if exists "orders_select_auth" on public.orders;
drop policy if exists "orders_update_auth" on public.orders;
drop policy if exists "orders_insert_all" on public.orders;

-- categories
drop policy if exists "categories_select_all" on public.categories;
drop policy if exists "categories_insert_auth" on public.categories;
drop policy if exists "categories_update_auth" on public.categories;
drop policy if exists "categories_delete_auth" on public.categories;

-- promocodes
drop policy if exists "promocodes_all_auth" on public.promocodes;
drop policy if exists "promocodes_select_all" on public.promocodes;

-- reviews
drop policy if exists "reviews_select_auth_all" on public.reviews;
drop policy if exists "reviews_select_public" on public.reviews;
drop policy if exists "reviews_insert_all" on public.reviews;
drop policy if exists "reviews_update_auth" on public.reviews;
drop policy if exists "reviews_delete_auth" on public.reviews;

-- ---------- 3. ВИТРИНА ЗАВИСИТ ОТ ПОДПИСКИ ----------

drop policy if exists sellers_public_read on public.sellers;
create policy sellers_public_read on public.sellers
  for select using (
    status = 'active' and subscription_until > now()
  );

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
          and s.subscription_until > now()
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
        and s.subscription_until > now()
    )
  );

-- ---------- 4. ПРОВЕРКА ----------
-- select name, subscription_until, subscription_until > now() as paid
--   from public.sellers;
-- select tablename, policyname, cmd from pg_policies
--  where schemaname='public' and qual = 'true';
