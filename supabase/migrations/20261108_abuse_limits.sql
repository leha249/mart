-- 20261108_abuse_limits.sql
-- Анти-абьюз: лимиты запросов по IP для анонимных RPC/вставок.
-- Все функции SECURITY DEFINER, таблица rate_limits недоступна anon/authenticated.

create table if not exists public.rate_limits (
  id bigserial primary key,
  bucket text not null,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on public.rate_limits (bucket, ip, created_at desc);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
revoke all on sequence public.rate_limits_id_seq from anon, authenticated;

create or replace function public.client_ip()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  h jsonb;
  ip text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    h := null;
  end;

  ip := coalesce(h ->> 'x-forwarded-for', h ->> 'cf-connecting-ip', '');
  ip := btrim(split_part(ip, ',', 1));
  if ip = '' then
    ip := 'unknown';
  end if;

  return left(ip, 64);
end;
$$;

create or replace function public.check_rate_limit(
  p_bucket text,
  p_max integer,
  p_window interval
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.client_ip();
  v_count integer;
begin
  if p_max is null or p_max <= 0 then
    return;
  end if;

  -- лёгкая уборка старых записей
  delete from public.rate_limits where created_at < now() - interval '2 days';

  select count(*) into v_count
    from public.rate_limits
   where bucket = p_bucket
     and ip = v_ip
     and created_at > now() - p_window;

  if v_count >= p_max then
    raise exception 'Слишком много запросов. Попробуйте позже.'
      using errcode = 'P0001';
  end if;

  insert into public.rate_limits (bucket, ip) values (p_bucket, v_ip);
end;
$$;

revoke all on function public.client_ip() from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, interval) from public, anon, authenticated;

-- ---------- отзывы: лимит на анонимные вставки ----------
create or replace function public.reviews_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.check_rate_limit('review', 10, interval '10 minutes');
  return new;
end;
$$;

drop trigger if exists reviews_rate_limit on public.reviews;
create trigger reviews_rate_limit
  before insert on public.reviews
  for each row execute function public.reviews_rate_limit();

-- ---------- заявки 152-ФЗ: лимит + запрет подмены статуса ----------
create or replace function public.data_requests_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.check_rate_limit('data_request', 5, interval '1 hour');
  if auth.uid() is null or not public.is_admin() then
    new.status := 'new';
    new.processed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists data_requests_guard on public.data_requests;
create trigger data_requests_guard
  before insert on public.data_requests
  for each row execute function public.data_requests_guard();

-- ---------- OTP: код больше не возвращается клиенту + лимиты по IP ----------
create or replace function public.create_customer_code(phone_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
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

  -- Важно: код никогда не возвращается вызывающему. Отправка — через SMS-провайдера.
  return null;
end;
$$;

create or replace function public.verify_customer_code(phone_input text, code_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  found_id bigint;
begin
  normalized := regexp_replace(coalesce(phone_input, ''), '[^0-9]', '', 'g');

  perform public.check_rate_limit('otp_verify', 30, interval '1 hour');

  select id into found_id
    from public.customer_codes
   where phone = normalized
     and code = code_input
     and used = false
     and expires_at > now()
   order by created_at desc
   limit 1;

  if found_id is null then
    update public.customer_codes
       set attempts = attempts + 1
     where phone = normalized
       and used = false
       and expires_at > now();

    update public.customer_codes
       set used = true
     where phone = normalized
       and used = false
       and attempts >= 5;

    return false;
  end if;

  update public.customer_codes
     set used = true
   where id = found_id;

  return true;
end;
$$;

-- ---------- чат: лимиты и проверки ----------
create or replace function public.open_chat(
  p_seller_id bigint,
  p_phone text,
  p_name text default null,
  p_token uuid default null
)
returns table(thread_id bigint, token uuid, seller_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  t record;
  v_recent integer;
begin
  if length(digits) < 10 or length(digits) > 15 then
    raise exception 'phone required';
  end if;

  if not exists (
    select 1 from public.sellers
     where id = p_seller_id and status = 'active'
  ) then
    raise exception 'Магазин недоступен';
  end if;

  if length(btrim(coalesce(p_name, ''))) > 80 then
    raise exception 'Слишком длинное имя';
  end if;

  perform public.check_rate_limit('chat_open', 20, interval '1 hour');

  if p_token is not null then
    select ct.* into t
      from public.chat_threads ct
     where ct.seller_id = p_seller_id
       and ct.customer_phone = digits
       and ct.token = p_token
     limit 1;

    if found then
      return query
        select t.id, t.token, s.name
          from public.sellers s
         where s.id = p_seller_id;
      return;
    end if;
  end if;

  select count(*) into v_recent
    from public.chat_threads
   where customer_phone = digits
     and created_at > now() - interval '1 day';
  if v_recent >= 5 then
    raise exception 'Слишком много обращений. Попробуйте позже.';
  end if;

  insert into public.chat_threads (seller_id, customer_phone, customer_name)
  values (p_seller_id, digits, nullif(btrim(coalesce(p_name, '')), ''))
  returning * into t;

  return query
    select t.id, t.token, s.name
      from public.sellers s
     where s.id = p_seller_id;
end;
$$;

create or replace function public.send_chat_message(
  p_thread_id bigint,
  p_token uuid,
  p_body text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
  t record;
begin
  select * into t from public.chat_threads
   where id = p_thread_id and token = p_token;

  if not found then
    raise exception 'chat not found';
  end if;

  if length(btrim(coalesce(p_body, ''))) = 0 then
    raise exception 'empty message';
  end if;

  perform public.check_rate_limit('chat_msg:' || p_thread_id::text, 20, interval '1 minute');

  insert into public.chat_messages (thread_id, sender, body)
  values (p_thread_id, 'customer', left(btrim(p_body), 2000))
  returning id into new_id;

  update public.chat_threads
     set last_message_at = now()
   where id = p_thread_id;

  return new_id;
end;
$$;
