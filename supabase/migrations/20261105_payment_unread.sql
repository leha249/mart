-- ============================================================
-- MØRA MART — статус оплаты заказа + непрочитанные сообщения
-- ============================================================

-- 1. Статус оплаты (деньги идут напрямую продавцу, платформа только фиксирует)
alter table public.orders
  add column if not exists payment_status text
    not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded'));

alter table public.orders
  add column if not exists paid_at timestamptz;

comment on column public.orders.payment_status is
  'unpaid | paid | refunded — отмечает продавец вручную';

-- 2. Продавец может помечать сообщения прочитанными
drop policy if exists chat_messages_seller_update on public.chat_messages;
create policy chat_messages_seller_update on public.chat_messages
  for update using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and t.seller_id = public.my_seller_id()
    )
  );

-- 3. Функция: сколько непрочитанных у продавца
create or replace function public.unread_chat_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)
    from public.chat_messages m
    join public.chat_threads t on t.id = m.thread_id
   where t.seller_id = public.my_seller_id()
     and m.sender = 'customer'
     and m.read_at is null;
$$;

grant execute on function public.unread_chat_count() to authenticated;

-- Проверка
-- select public.unread_chat_count();
