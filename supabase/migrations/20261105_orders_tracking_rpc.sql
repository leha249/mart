-- get_orders_by_phone + поля трекинга
drop function if exists public.get_orders_by_phone(text);

create or replace function public.get_orders_by_phone(phone_input text)
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  total numeric,
  items jsonb,
  seller_id bigint,
  tracking_number text,
  carrier text,
  payment_status text
)
language sql
security definer
set search_path = public
as $fn$
  select
    o.id::bigint        as id,
    o.created_at        as created_at,
    o.status::text      as status,
    o.total::numeric    as total,
    o.items             as items,
    o.seller_id::bigint as seller_id,
    o.tracking_number   as tracking_number,
    o.carrier           as carrier,
    o.payment_status    as payment_status
  from public.orders o
  where length(regexp_replace(coalesce(phone_input, ''), '\D', '', 'g')) >= 10
    and regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g')
      = regexp_replace(coalesce(phone_input, ''), '\D', '', 'g')
  order by o.created_at desc
  limit 20;
$fn$;

revoke all on function public.get_orders_by_phone(text) from public;
grant execute on function public.get_orders_by_phone(text) to anon, authenticated;
