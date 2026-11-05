-- ============================================================
-- MØRA MART — «красивые» адреса товаров: /product/rick-owens-drkshdw
-- ============================================================
-- Необязательная миграция. Приложение работает и без неё:
-- если колонки slug нет, адрес собирается на лету как /product/2-nazvanie.
-- После миграции адреса становятся чистыми, а старые ссылки вида
-- /product/2-... продолжают работать (роут понимает id в начале).
--
-- Как применить: Supabase → SQL Editor → New query → вставить целиком → Run.
-- ============================================================

-- 1. Колонка
alter table public.products
  add column if not exists slug text;

-- 2. Транслитерация в ЧПУ
create or replace function public.mora_slugify(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := lower(coalesce(input, ''));

  -- сначала многосимвольные замены
  s := replace(s, 'щ', 'sch');
  s := replace(s, 'ж', 'zh');
  s := replace(s, 'ч', 'ch');
  s := replace(s, 'ш', 'sh');
  s := replace(s, 'ю', 'yu');
  s := replace(s, 'я', 'ya');
  s := replace(s, 'ц', 'ts');
  s := replace(s, 'х', 'h');
  s := replace(s, 'й', 'y');
  s := replace(s, 'ё', 'e');
  s := replace(s, 'ъ', '');
  s := replace(s, 'ь', '');
  s := replace(s, 'ы', 'y');

  -- оставшиеся однобуквенные
  s := translate(
    s,
    'абвгдезиклмнопрстуфэ',
    'abvgdeziklmnoprstufe'
  );

  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  s := regexp_replace(s, '-{2,}', '-', 'g');

  return nullif(left(s, 60), '');
end;
$$;

-- 3. Заполнение существующих товаров без конфликтов
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in
    select id, name from public.products
    where slug is null or slug = ''
    order by id
  loop
    base := coalesce(public.mora_slugify(r.name), 'product');
    candidate := base;
    n := 1;

    while exists (
      select 1 from public.products
      where slug = candidate and id <> r.id
    ) loop
      candidate := base || '-' || n;
      n := n + 1;
    end loop;

    update public.products set slug = candidate where id = r.id;
  end loop;
end $$;

-- 4. Уникальность
create unique index if not exists products_slug_key
  on public.products (slug);

-- 5. Новым товарам слаг ставится автоматически
create or replace function public.set_product_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  n int;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base := coalesce(public.mora_slugify(new.name), 'product');
  candidate := base;
  n := 1;

  while exists (
    select 1 from public.products
    where slug = candidate and id <> coalesce(new.id, -1)
  ) loop
    candidate := base || '-' || n;
    n := n + 1;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists products_set_slug on public.products;
create trigger products_set_slug
  before insert or update of name
  on public.products
  for each row
  execute function public.set_product_slug();

-- 6. Проверка
-- select id, name, slug from public.products order by id;
