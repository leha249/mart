-- ============================================================
-- MØRA MART — создание заказа через RPC
-- ============================================================
-- Проблема: прямой insert в orders от анонима возвращал
-- «new row violates row-level security policy», потому что
-- PostgREST при return=representation требует ещё и SELECT,
-- а читать заказы анониму нельзя (и должно быть нельзя).
--
-- Решение: security definer функция, которая вставляет заказ
-- и возвращает созданную строку. Читать чужие заказы по-прежнему
-- нельзя, продавец видит только свои.
-- ============================================================

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
begin
  if length(btrim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'customer name required';
  end if;
  if length(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g')) < 10 then
    raise exception 'customer phone required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order items required';
  end if;
  if coalesce(p_total, 0) < 0 then
    raise exception 'invalid total';
  end if;

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
    p_items,
    p_total,
    p_seller_id,
    p_promo_code,
    p_promo_discount,
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() else null end
  )
  returning * into new_order;

  return new_order;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean) from public;
grant execute on function public.create_order(text, text, text, jsonb, numeric, bigint, text, numeric, boolean) to anon, authenticated;

-- Проверка:
-- select id, total, seller_id from public.create_order(
--   'Тест', '+79005553535', null, '[{"id":2,"name":"x","price":100,"image":"y","quantity":1}]'::jsonb,
--   100, 2, null, null, false);
