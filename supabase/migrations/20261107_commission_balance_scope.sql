-- ============================================================
-- MØRA MART — доработки после аудита 06.11.2026 (часть 2)
-- ПРИМЕНЕНО к проекту twgslbfnksbrioxgeubb 06.11.2026.
-- ============================================================
-- 1. seller_commission_balance: продавец видит только себя,
--    админ — всех (раньше view отдавал строки всех активных магазинов).
-- 2. create_order (одиночный путь): advisory lock по телефону —
--    два параллельных запроса больше не обходят лимит 5/10 минут.
-- ============================================================

begin;

create or replace view public.seller_commission_balance
with (security_invoker = true) as
select seller_id, accrued, paid, (accrued - paid) as debt
from (
  select s.id as seller_id,
         coalesce((
           select sum(o.commission_amount)::integer
             from public.orders o
            where o.seller_id = s.id and o.status <> 'cancelled'
         ), 0) as accrued,
         coalesce((
           select sum(cp.amount)::integer
             from public.commission_payments cp
            where cp.seller_id = s.id and cp.status = 'confirmed'
         ), 0) as paid
    from public.sellers s
   where s.id = public.my_seller_id() or public.is_admin()
) b;

revoke all on public.seller_commission_balance from public, anon;
grant select on public.seller_commission_balance to authenticated;

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
as $fn$
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
$fn$;

revoke all on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean)
  from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean)
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
