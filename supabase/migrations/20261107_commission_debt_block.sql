-- ============================================================
-- MØRA MART — блокировка новых заказов при просроченном долге
-- по комиссии (п. 5 раздела 22.4 moramart.md)
-- ============================================================
-- НЕ ПРИМЕНЕНО. Только текст миграции для ревью.
--
-- Правило: если у продавца есть непогашенная комиссия, и самая
-- старая неоплаченная позиция долга старше N дней — новые заказы
-- этого продавца не принимаются.
--
-- Как считается долг:
--   начисления = orders.commission_amount по незаменённым заказам;
--   оплаты     = commission_payments.status = 'confirmed';
--   оплаты списываются по FIFO (сначала самые старые начисления).
-- Первое начисление, не покрытое оплатами, и есть «начало долга».
--
-- Почему триггер на orders, а не правка RPC:
--   create_order_single / create_orders_batch / create_order и любой
--   прямой insert вставляют строку в orders. BEFORE INSERT-триггер
--   срабатывает внутри всех этих путей и, при исключении, откатывает
--   всю транзакцию батча — частичных заказов не будет.
--
-- Безопасность для существующих данных: миграция ничего не
-- обновляет и не удаляет; старые заказы не пересчитываются.
-- Новые заказы блокируются только при долге старше N дней.
--
-- N по умолчанию 14 дней. Меняется без правки кода:
--   alter database postgres set mora.commission_grace_days = '21';
-- (в Supabase — SQL Editor, затем reconnect).
--
-- Перед применением посмотреть, кого затронет:
--   select * from public.seller_commission_balance where debt > 0;
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Настройка: сколько дней долга считаются просрочкой
-- ------------------------------------------------------------
create or replace function public.commission_debt_grace_days()
returns integer
language sql
stable
as $fn$
  select coalesce(
    nullif(current_setting('mora.commission_grace_days', true), '')::integer,
    14
  );
$fn$;

comment on function public.commission_debt_grace_days() is
  'Сколько дней долг по комиссии может висеть до блокировки заказов. По умолчанию 14.';

-- ------------------------------------------------------------
-- 2. Когда начался текущий непогашенный долг (FIFO)
-- ------------------------------------------------------------
create or replace function public.seller_commission_debt_started_at(
  p_seller_id bigint
)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $fn$
  with paid as (
    select coalesce(sum(cp.amount), 0)::bigint as amount
      from public.commission_payments cp
     where cp.seller_id = p_seller_id
       and cp.status = 'confirmed'
  ),
  accruals as (
    select
      o.created_at,
      sum(o.commission_amount) over (
        order by o.created_at, o.id
      ) as cumulative
      from public.orders o
     where o.seller_id = p_seller_id
       and o.status <> 'cancelled'
       and o.commission_amount > 0
  )
  select min(a.created_at)
    from accruals a
   cross join paid p
   where a.cumulative > p.amount;
$fn$;

comment on function public.seller_commission_debt_started_at(bigint) is
  'Дата самого старого начисления комиссии, ещё не покрытого подтверждёнными оплатами. NULL — долга нет.';

-- ------------------------------------------------------------
-- 3. Проверка: заблокирован ли приём заказов
-- ------------------------------------------------------------
create or replace function public.seller_commission_blocked(
  p_seller_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select case
    when p_seller_id is null then false
    else coalesce(
      public.seller_commission_debt_started_at(p_seller_id)
        < now() - make_interval(days => public.commission_debt_grace_days()),
      false
    )
  end;
$fn$;

comment on function public.seller_commission_blocked(bigint) is
  'TRUE, если у продавца есть долг по комиссии старше grace-периода.';

-- ------------------------------------------------------------
-- 4. Триггер на все пути создания заказа
-- ------------------------------------------------------------
create or replace function public.orders_block_commission_debt()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- Товары платформы (seller_id IS NULL) не блокируем.
  if new.seller_id is null then
    return new;
  end if;

  if public.seller_commission_blocked(new.seller_id) then
    raise exception
      'Приём новых заказов приостановлен: у продавца есть задолженность по комиссии старше % дн.',
      public.commission_debt_grace_days()
      using
        errcode = 'P0001',
        hint = 'Продавцу нужно погасить комиссию; после подтверждения оплаты заказы возобновятся.';
  end if;

  return new;
end;
$fn$;

drop trigger if exists orders_block_commission_debt on public.orders;
create trigger orders_block_commission_debt
  before insert on public.orders
  for each row
  execute function public.orders_block_commission_debt();

-- ------------------------------------------------------------
-- 5. Индексы под проверку долга (иначе seq scan на каждый заказ)
-- ------------------------------------------------------------
create index if not exists orders_seller_created_idx
  on public.orders (seller_id, created_at);

create index if not exists commission_payments_seller_status_idx
  on public.commission_payments (seller_id, status);

-- ------------------------------------------------------------
-- 6. Права: клиенту эти функции не нужны
-- ------------------------------------------------------------
revoke all on function public.commission_debt_grace_days()
  from public, anon, authenticated;
revoke all on function public.seller_commission_debt_started_at(bigint)
  from public, anon, authenticated;
revoke all on function public.seller_commission_blocked(bigint)
  from public, anon, authenticated;
revoke all on function public.orders_block_commission_debt()
  from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
