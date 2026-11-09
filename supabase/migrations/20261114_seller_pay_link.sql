-- ============================================================
-- MØRA MART — оплата напрямую продавцу (этап 1)
-- ============================================================
-- Платформа не принимает деньги на свой счёт: у продавца есть
-- ссылка на оплату (его Lava-виджет / СБП-ссылка / счёт), покупатель
-- платит ему напрямую. Это единственная схема, законная для НПД:
-- платформа не хранит и не переводит чужие деньги.
-- ============================================================

begin;

alter table public.sellers
  add column if not exists pay_url text,
  add column if not exists pay_note text;

-- Ссылка только http(s): javascript: и data: в href недопустимы.
alter table public.sellers drop constraint if exists sellers_pay_url_chk;
alter table public.sellers
  add constraint sellers_pay_url_chk
  check (pay_url is null or pay_url ~* '^https?://[^\s]{4,}$');

-- anon читает витрину через security_invoker view, поэтому колонки
-- нужно разрешить и на самой таблице.
grant select (pay_url, pay_note) on public.sellers to anon;

-- Публичная витрина: новые колонки добавляются в конец
-- (Postgres разрешает CREATE OR REPLACE VIEW только так).
create or replace view public.sellers_public
with (security_invoker = true) as
select
  s.id,
  s.name,
  s.slug,
  s.description,
  s.logo,
  s.cover,
  s.phone,
  s.email,
  s.status,
  s.hero_title,
  s.hero_subtitle,
  s.hero_image,
  s.hero_badge,
  s.about_title,
  s.about_text,
  s.about_image,
  s.about_badge,
  s.footer_text,
  s.accent_color,
  s.lookbook_images,
  s.legal_name,
  s.legal_type,
  s.ogrnip,
  s.inn,
  s.legal_address,
  s.created_at,
  s.updated_at,
  s.pay_url,
  s.pay_note
from public.sellers s;

revoke all on public.sellers_public from public, anon;
grant select on public.sellers_public to anon, authenticated;

commit;
