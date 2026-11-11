-- ============================================================
-- MØRA MART — комиссия раз в месяц вместо недельных счетов
-- ============================================================
-- Один счёт на продавца за календарный месяц, один перевод.
-- Счёт выставляется 1-го числа за прошлый месяц, оплатить — до 10-го.
-- Недельные функции оставлены (история + совместимость), но планировщик
-- и клиент переключены на месячные.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Счета за календарный месяц
-- ------------------------------------------------------------
create or replace function public.build_monthly_invoices(
  p_issue_date date default current_date
)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  -- период: с 1-го числа прошлого месяца по последнее число прошлого месяца
  v_start date := (date_trunc('month', p_issue_date) - interval '1 month')::date;
  v_end   date := (date_trunc('month', p_issue_date) - interval '1 day')::date;
  -- срок: 10-е число месяца выставления, 23:59:59 МСК
  v_due   timestamptz := ((date_trunc('month', p_issue_date)::date + 9)::text || ' 23:59:59+03')::timestamptz;
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
-- 2. Месячный прогон: счета + паузы
-- ------------------------------------------------------------
create or replace function public.run_monthly_billing(
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
  v_created := public.build_monthly_invoices(p_issue_date);
  v_paused := public.apply_commission_blocks();

  return jsonb_build_object(
    'issue_date', p_issue_date,
    'invoices_created', v_created,
    'sellers_paused', v_paused
  );
end;
$fn$;

-- Ленивый вызов из кабинета: только продавец/админ, иначе пустой ответ.
create or replace function public.run_monthly_billing_safe()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if public.my_seller_id() is null and not public.is_admin() then
    return jsonb_build_object('skipped', true);
  end if;
  return public.run_monthly_billing(current_date);
end;
$fn$;

revoke all on function public.build_monthly_invoices(date) from public, anon, authenticated;
grant execute on function public.run_monthly_billing(date) to authenticated, service_role;
grant execute on function public.run_monthly_billing_safe() to authenticated;

-- ------------------------------------------------------------
-- 3. Планировщик: 1-го числа, 06:00 UTC = 09:00 МСК
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('mora-monthly-billing');
    exception when others then
      null;
    end;
    begin
      perform cron.unschedule('mora-weekly-billing');
    exception when others then
      null;
    end;
    perform cron.schedule(
      'mora-monthly-billing',
      '0 6 1 * *',
      'select public.run_monthly_billing();'
    );
  end if;
exception when others then
  raise notice 'pg_cron недоступен, биллинг запускается лениво из клиента';
end $$;

notify pgrst, 'reload schema';

commit;
