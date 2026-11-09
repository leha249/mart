-- ============================================================
-- MØRA MART — вход покупателя по номеру телефона
-- 09.11.2026, проект twgslbfnksbrioxgeubb
-- ============================================================
-- Единая точка входа: страница /login-customer с двумя вкладками
-- («Вход» и «Регистрация»). Вход ищет профиль по телефону.
--
-- ОГОВОРКА: пока не подключён SMS, телефон не подтверждается —
-- вход по номеру равен входу по знанию номера. Закроется вместе с SMS
-- (код на телефон + подписанная серверная сессия).
-- ============================================================

begin;

create or replace function public.customer_login(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_row public.customers%rowtype;
begin
  if char_length(v_phone) < 10 or char_length(v_phone) > 15 then
    raise exception 'Некорректный номер телефона';
  end if;

  -- Антибрутфорс по IP: 30 попыток входа в час.
  perform public.check_rate_limit('customer_login', 30, interval '1 hour');

  select * into v_row
    from public.customers
   where phone = v_phone
   limit 1;

  if v_row.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'phone', v_row.phone,
    'first_name', v_row.first_name,
    'last_name', v_row.last_name,
    'email', v_row.email
  );
end;
$fn$;

revoke all on function public.customer_login(text) from public;
grant execute on function public.customer_login(text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
