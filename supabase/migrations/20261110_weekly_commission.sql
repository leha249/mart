-- ============================================================
-- MØRA MART — недельная комиссия 4% и автопауза
-- 06.11.2026, проект twgslbfnksbrioxgeubb
-- ============================================================
-- Правила, которые зашиты:
--   1. Ставка платформы — 4% (sellers.commission_percent default 4).
--   2. Каждую пятницу формируется счёт за предыдущие 7 дней
--      (пятница … четверг). Сумма = комиссия по заказам периода.
--   3. Оплатить нужно до конца следующей пятницы (7 дней).
--   4. Не оплатил — аккаунт продавца переводится в status='paused'
--      (не 'blocked': кабинет доступен, витрина закрыта).
--   5. Оплатил — статус автоматически возвращается в 'active'.
--
-- Где запускается: pg_cron (если включён) + ленивый вызов из клиента
-- (run_weekly_billing() при открытии раздела «Комиссия»).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Ставка 4%
-- ------------------------------------------------------------
alter table public.sellers
  alter column commission_percent set default 4;

update public.sellers
   set commission_percent = 4
 where commission_percent is null or commission_percent = 10;

-- ------------------------------------------------------------
-- 2. Признак «на паузе из-за долга» (чтобы не путать с ручной паузой)
-- ------------------------------------------------------------
alter table public.sellers
  add column if not exists paused_by_debt boolean not null default false;

-- ------------------------------------------------------------
-- 3. Счета по неделям
-- ------------------------------------------------------------
create table if not exists public.commission_invoices (
  id bigserial primary key,
  seller_id bigint not null references public.sellers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  accrued integer not null default 0,
  paid integer not null default 0,
  status text not null default 'pending',
  due_at timestamptz not null,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint commission_invoices_status_chk
    check (status in ('pending', 'paid', 'failed', 'waived')),
  constraint commission_invoices_period_chk
    check (period_end >= period_start),
  constraint commission_invoices_key unique (seller_id, period_start)
);

create index if not exists commission_invoices_seller_status_idx
  on public.commission_invoices (seller_id, status, due_at);

alter table public.commission_invoices enable row level security;

drop policy if exists ci_seller_read on public.commission_invoices;
create policy ci_seller_read on public.commission_invoices
  for select
  using (seller_id = public.my_seller_id() or public.is_admin());

drop policy if exists ci_admin_all on public.commission_invoices;
create policy ci_admin_all on public.commission_invoices
  for all
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.commission_invoices from public, anon;
grant select on public.commission_invoices to authenticated;

-- Связь ручного платежа со счётом
alter table public.commission_payments
  add column if not exists invoice_id bigint
  references public.commission_invoices(id) on delete set null;

-- ------------------------------------------------------------
-- 4. my_seller_id(): пауза из-за долга не отбирает кабинет
-- ------------------------------------------------------------
create or replace function public.my_seller_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $fn$
  select id
    from public.sellers
   where user_id = auth.uid()
     and status in ('active', 'paused')
   limit 1;
$fn$;

-- ------------------------------------------------------------
-- 5. Триггер защиты полей: не мешать биллингу
-- ------------------------------------------------------------
create or replace function public.sellers_protect_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- Внутренние функции биллинга ставят статус сами.
  if current_setting('mora.billing', true) = 'on' then
    return new;
  end if;

  if auth.uid() is not null and not public.is_admin() then
    new.status := old.status;
    new.subscription_until := old.subscription_until;
    new.subscription_plan := old.subscription_plan;
    new.commission_percent := old.commission_percent;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$fn$;

-- ------------------------------------------------------------
-- 6. Формирование счетов за неделю
-- ------------------------------------------------------------
create or replace function public.build_weekly_invoices(
  p_issue_date date default current_date
)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_start date := p_issue_date - 7;
  v_end   date := p_issue_date - 1;
  v_due   timestamptz := ((p_issue_date + 7)::text || ' 23:59:59+03')::timestamptz;
  v_count integer := 0;
  v_rec record;
begin
  for v_rec in
    select o.seller_id,
           coalesce(sum(o.commission_amount), 0)::integer as accrued
      from public.orders o
     where o.seller_id is not null
       and o.status <> 'cancelled'
       and o.created_at::date between v_start and v_end
     group by o.seller_id
    having coalesce(sum(o.commission_amount), 0) > 0
  loop
    insert into public.commission_invoices
      (seller_id, period_start, period_end, accrued, due_at)
    values
      (v_rec.seller_id, v_start, v_end, v_rec.accrued, v_due)
    on conflict (seller_id, period_start) do nothing;

    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$fn$;

-- ------------------------------------------------------------
-- 7. Пауза просрочившим и возврат оплатившим
-- ------------------------------------------------------------
create or replace function public.apply_commission_blocks()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_paused integer := 0;
begin
  perform set_config('mora.billing', 'on', true);

  with overdue as (
    select distinct ci.seller_id
      from public.commission_invoices ci
     where ci.status in ('pending', 'failed')
       and ci.due_at < now()
  )
  update public.sellers s
     set status = 'paused',
         paused_by_debt = true
    from overdue ov
   where s.id = ov.seller_id
     and s.status = 'active';

  get diagnostics v_paused = row_count;

  update public.sellers s
     set status = 'active',
         paused_by_debt = false
   where s.paused_by_debt = true
     and not exists (
       select 1
         from public.commission_invoices ci
        where ci.seller_id = s.id
          and ci.status in ('pending', 'failed')
          and ci.due_at < now()
     );

  perform set_config('mora.billing', 'off', true);
  return v_paused;
end;
$fn$;

-- ------------------------------------------------------------
-- 8. Недельный прогон: счета + паузы + напоминание
-- ------------------------------------------------------------
create or replace function public.run_weekly_billing(
  p_issue_date date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_created integer;
  v_paused integer;
begin
  v_created := public.build_weekly_invoices(p_issue_date);
  v_paused := public.apply_commission_blocks();

  return jsonb_build_object(
    'issue_date', p_issue_date,
    'invoices_created', v_created,
    'sellers_paused', v_paused
  );
end;
$fn$;

revoke all on function public.build_weekly_invoices(date) from public, anon, authenticated;
revoke all on function public.apply_commission_blocks() from public, anon, authenticated;
grant execute on function public.run_weekly_billing(date) to authenticated, service_role;

-- Клиент может дёрнуть прогон, но не чаще раза в минуту и только
-- если он продавец/админ (иначе просто пустой прогон).
create or replace function public.run_weekly_billing_safe()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.my_seller_id() is null and not public.is_admin() then
    return jsonb_build_object('skipped', true);
  end if;
  return public.run_weekly_billing(current_date);
end;
$fn$;

grant execute on function public.run_weekly_billing_safe() to authenticated;

-- ------------------------------------------------------------
-- 9. Подтверждение оплаты: закрывает счёт и снимает паузу
-- ------------------------------------------------------------
create or replace function public.confirm_commission_payment(payment_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_payment public.commission_payments%rowtype;
  v_left integer;
  v_inv record;
  v_new_paid integer;
begin
  if not public.is_admin() then
    raise exception 'only admin can confirm commission payments';
  end if;

  update public.commission_payments
     set status = 'confirmed', confirmed_at = now()
   where id = payment_id and status = 'pending';

  if not found then
    raise exception 'payment not found or already processed';
  end if;

  select * into v_payment from public.commission_payments where id = payment_id;
  v_left := v_payment.amount;

  -- Сначала закрываем самый старый счёт (или указанный в платеже).
  for v_inv in
    select *
      from public.commission_invoices
     where seller_id = v_payment.seller_id
       and status in ('pending', 'failed')
       and (v_payment.invoice_id is null or id = v_payment.invoice_id)
     order by period_start
  loop
    exit when v_left <= 0;

    v_new_paid := least(v_inv.accrued, v_inv.paid + v_left);

    update public.commission_invoices
       set paid = v_new_paid,
           status = case when v_new_paid >= v_inv.accrued then 'paid' else status end,
           paid_at = case when v_new_paid >= v_inv.accrued then now() else paid_at end
     where id = v_inv.id;

    v_left := v_left - (v_new_paid - v_inv.paid);
  end loop;

  -- Снять паузу, если долгов больше нет.
  perform public.apply_commission_blocks();
end;
$fn$;

-- ------------------------------------------------------------
-- 10. Планировщик (если pg_cron доступен в проекте)
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- снять старую задачу, если была
    begin
      perform cron.unschedule('mora-weekly-billing');
    exception when others then
      null;
    end;
    perform cron.schedule(
      'mora-weekly-billing',
      '0 6 * * 5',                      -- пятница 06:00 UTC = 09:00 МСК
      'select public.run_weekly_billing();'
    );
  end if;
exception when others then
  raise notice 'pg_cron недоступен, биллинг запускается лениво из клиента';
end $$;

notify pgrst, 'reload schema';

commit;
