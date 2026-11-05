-- ============================================================
-- MØRA MART — чат покупатель ↔ продавец
-- ============================================================
-- Покупатель не авторизован в Supabase Auth (вход по телефону),
-- поэтому общается через RPC с секретным токеном треда.
-- Продавец — обычный authenticated, ходит в таблицы через RLS.
-- ============================================================

create table if not exists public.chat_threads (
  id bigserial primary key,
  seller_id bigint not null references public.sellers(id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (seller_id, customer_phone)
);

create table if not exists public.chat_messages (
  id bigserial primary key,
  thread_id bigint not null references public.chat_threads(id) on delete cascade,
  sender text not null check (sender in ('customer', 'seller')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_id, created_at);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- Продавец видит только свои треды и сообщения
drop policy if exists chat_threads_seller_read on public.chat_threads;
create policy chat_threads_seller_read on public.chat_threads
  for select using (seller_id = public.my_seller_id());

drop policy if exists chat_threads_seller_update on public.chat_threads;
create policy chat_threads_seller_update on public.chat_threads
  for update using (seller_id = public.my_seller_id())
  with check (seller_id = public.my_seller_id());

drop policy if exists chat_messages_seller_read on public.chat_messages;
create policy chat_messages_seller_read on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and t.seller_id = public.my_seller_id()
    )
  );

drop policy if exists chat_messages_seller_insert on public.chat_messages;
create policy chat_messages_seller_insert on public.chat_messages
  for insert with check (
    sender = 'seller'
    and exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and t.seller_id = public.my_seller_id()
    )
  );

-- Админ — для разбора жалоб
drop policy if exists chat_admin_all on public.chat_threads;
create policy chat_admin_all on public.chat_threads
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- RPC для покупателя ----------

-- Открыть (или создать) тред. Возвращает id, token и имя продавца.
create or replace function public.open_chat(
  p_seller_id bigint,
  p_phone text,
  p_name text default null
)
returns table (thread_id bigint, token uuid, seller_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  t record;
begin
  if length(digits) < 10 then
    raise exception 'phone required';
  end if;

  select * into t from public.chat_threads
   where seller_id = p_seller_id and customer_phone = digits
   limit 1;

  if not found then
    insert into public.chat_threads (seller_id, customer_phone, customer_name)
    values (p_seller_id, digits, nullif(btrim(coalesce(p_name, '')), ''))
    returning * into t;
  end if;

  return query
    select t.id, t.token, s.name
      from public.sellers s
     where s.id = p_seller_id;
end;
$$;

-- Сообщения треда по токену
create or replace function public.chat_messages_by_token(
  p_thread_id bigint,
  p_token uuid
)
returns table (id bigint, sender text, body text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select m.id, m.sender, m.body, m.created_at
    from public.chat_messages m
    join public.chat_threads t on t.id = m.thread_id
   where t.id = p_thread_id and t.token = p_token
   order by m.created_at asc
   limit 500;
$$;

-- Отправить сообщение от покупателя
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

  insert into public.chat_messages (thread_id, sender, body)
  values (p_thread_id, 'customer', left(btrim(p_body), 2000))
  returning id into new_id;

  update public.chat_threads
     set last_message_at = now()
   where id = p_thread_id;

  return new_id;
end;
$$;

revoke all on function public.open_chat(bigint, text, text) from public;
revoke all on function public.chat_messages_by_token(bigint, uuid) from public;
revoke all on function public.send_chat_message(bigint, uuid, text) from public;

grant execute on function public.open_chat(bigint, text, text) to anon, authenticated;
grant execute on function public.chat_messages_by_token(bigint, uuid) to anon, authenticated;
grant execute on function public.send_chat_message(bigint, uuid, text) to anon, authenticated;

-- Проверка
-- select * from public.open_chat(2, '+79005553535', 'Тест');
