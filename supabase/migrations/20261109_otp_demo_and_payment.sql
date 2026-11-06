-- ============================================================
-- MØRA MART — demo-режим OTP и возврат оплаты продавцу
-- 06.11.2026, проект twgslbfnksbrioxgeubb
-- ============================================================
-- Контекст: security-фикс убрал возврат OTP-кода клиенту, из-за чего
-- кабинет покупателя стал недоступен (SMS-провайдера нет). Владелец
-- выбрал: код возвращается ТОЛЬКО когда в БД явно включён demo-флаг.
--
-- Включить demo (локальная разработка):
--   insert into public.app_settings(key, value) values ('otp_demo', 'on')
--   on conflict (key) do update set value = excluded.value, updated_at = now();
--
-- Выключить перед запуском/деплоем:
--   update public.app_settings set value = 'off', updated_at = now()
--    where key = 'otp_demo';
--
-- По умолчанию флага нет → поведение безопасное (return null).
-- Таблица доступна только из SQL Editor (клиентам грантов не выдаём).
--
-- Вторая часть: продавец снова может отметить заказ оплаченным
-- («деньги идут напрямую продавцу»), но откатить «оплачен» назад —
-- только админ. Иначе UI продавца молча не сохранял статус.
-- ============================================================

begin;

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

revoke all on public.app_settings from public, anon, authenticated;
grant all on public.app_settings to service_role;

create or replace function public.otp_demo_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(
    (select s.value = 'on' from public.app_settings s where s.key = 'otp_demo'),
    false
  );
$fn$;

revoke all on function public.otp_demo_enabled() from public, anon, authenticated;

create or replace function public.create_customer_code(phone_input text)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  normalized text;
  new_code text;
  v_today integer;
begin
  normalized := regexp_replace(coalesce(phone_input, ''), '[^0-9]', '', 'g');

  if length(normalized) < 10 or length(normalized) > 15 then
    raise exception 'Некорректный номер телефона';
  end if;

  perform public.check_rate_limit('otp_request', 10, interval '1 hour');

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

  -- Код отдаём ТОЛЬКО при явно включённом demo-флаге.
  -- В обычном режиме он уходит через SMS-провайдера (ещё не подключён).
  if public.otp_demo_enabled() then
    return new_code;
  end if;

  return null;
end;
$fn$;

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

    -- Оплату отмечает продавец (деньги идут ему напрямую), но снять
    -- отметку «оплачен» или вернуть деньги может только админ.
    if old.payment_status = 'paid' and new.payment_status is distinct from 'paid' then
      new.payment_status := old.payment_status;
      new.paid_at := old.paid_at;
    end if;

    if new.payment_status = 'paid' and (old.payment_status is distinct from 'paid') then
      new.paid_at := coalesce(new.paid_at, now());
    end if;
  end if;
  return new;
end;
$fn$;

notify pgrst, 'reload schema';

commit;
