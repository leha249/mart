-- ============================================================
-- MØRA MART — регистрация покупателя перед заказом
-- 06.11.2026, проект twgslbfnksbrioxgeubb
-- ============================================================
-- Заказ теперь оформляется только из зарегистрированного кабинета:
-- имя, фамилия, телефон и email берутся из профиля покупателя,
-- а не вводятся руками на checkout.
--
-- Таблица закрыта от клиента полностью: доступ только через RPC.
-- ============================================================

begin;

create table if not exists public.customers (
  id bigserial primary key,
  phone text not null unique,
  first_name text not null,
  last_name text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_phone_chk check (phone ~ '^[0-9]{10,15}$'),
  constraint customers_first_name_chk check (char_length(btrim(first_name)) between 1 and 60),
  constraint customers_last_name_chk check (char_length(btrim(last_name)) between 1 and 60),
  constraint customers_email_chk check (
    email is null or (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  )
);

create index if not exists customers_phone_idx on public.customers (phone);

alter table public.customers enable row level security;
revoke all on public.customers from public, anon, authenticated;

-- Регистрация (или обновление профиля по тому же телефону).
create or replace function public.register_customer(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_first text := btrim(coalesce(p_first_name, ''));
  v_last  text := btrim(coalesce(p_last_name, ''));
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_row public.customers%rowtype;
begin
  if char_length(v_first) < 1 or char_length(v_first) > 60 then
    raise exception 'Укажите имя';
  end if;
  if char_length(v_last) < 1 or char_length(v_last) > 60 then
    raise exception 'Укажите фамилию';
  end if;
  if char_length(v_phone) < 10 or char_length(v_phone) > 15 then
    raise exception 'Укажите корректный телефон';
  end if;
  if v_email is not null
     and (char_length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Укажите корректный email';
  end if;

  -- Антиспам: не больше 10 регистраций с одного IP в час.
  perform public.check_rate_limit('customer_register', 10, interval '1 hour');

  insert into public.customers (phone, first_name, last_name, email)
  values (v_phone, v_first, v_last, v_email)
  on conflict (phone) do update
     set first_name = excluded.first_name,
         last_name  = excluded.last_name,
         email      = coalesce(excluded.email, public.customers.email),
         updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'phone', v_row.phone,
    'first_name', v_row.first_name,
    'last_name', v_row.last_name,
    'email', v_row.email
  );
end;
$fn$;

revoke all on function public.register_customer(text, text, text, text) from public;
grant execute on function public.register_customer(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
