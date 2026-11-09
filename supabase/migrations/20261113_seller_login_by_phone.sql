-- ============================================================
-- MØRA MART — вход продавца по телефону
-- 09.11.2026, проект twgslbfnksbrioxgeubb
-- ============================================================
-- Вход продавца принимает email ИЛИ телефон. Supabase Auth умеет
-- входить только по email, поэтому телефон резолвится в email
-- магазина этим RPC (только для существующих продавцов).
-- Лимит 30 запросов в час на IP — от перебора номеров.
-- ============================================================

begin;

create or replace function public.seller_login_email(p_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_norm text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_email text;
begin
  if char_length(v_norm) < 10 or char_length(v_norm) > 15 then
    return null;
  end if;

  perform public.check_rate_limit('seller_login_lookup', 30, interval '1 hour');

  select email into v_email
    from public.sellers
   where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = v_norm
     and email is not null
   limit 1;

  return v_email;
end;
$fn$;

revoke all on function public.seller_login_email(text) from public;
grant execute on function public.seller_login_email(text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
