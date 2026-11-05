# MØRA MART

Маркетплейс одежды, обуви и аксессуаров: несколько независимых продавцов, у каждого свой мини-магазин, общий каталог и корзина с разбиением заказов по продавцам.

Платформа — информационный посредник (ст. 1253.1 ГК РФ): ответственность за товар, доставку и возврат несёт продавец.

## Стек

- React 19 + TypeScript
- Vite 8
- React Router 7
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Framer Motion, Lucide React

## Запуск

```bash
npm install
npm run dev
```

Открывать **http://127.0.0.1:5173** (не `localhost` — из-за VPN).

### Переменные окружения

Файл `.env.local` в корне (в git не попадает):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_SITE_URL=https://moramart.ru      # необязательно: домен для sitemap/robots
```

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Дев-сервер Vite |
| `npm run build` | Генерирует sitemap/robots, проверяет типы, собирает `dist/` |
| `npm run preview` | Локальный просмотр собранной версии |
| `npm run lint` | ESLint |
| `npm run sitemap` | Только пересобрать `public/sitemap.xml` и `robots.txt` |

## Маршруты

| Адрес | Страница |
| --- | --- |
| `/` | Главная: магазины + популярные товары |
| `/catalog` | Каталог с фильтрами |
| `/sellers` | Все магазины |
| `/seller/:slug` | Магазин продавца |
| `/product/:slug` | Страница товара |
| `/favorites` | Избранное |
| `/my-orders` | Поиск заказов по телефону |
| `/login`, `/register-seller` | Вход и регистрация продавца |
| `/login-customer`, `/account` | Вход и кабинет покупателя |
| `/admin`, `/seller/dashboard` | Кабинет продавца / админа |
| `/about`, `/contacts` | Информация о платформе |
| `/terms`, `/privacy`, `/seller-agreement`, `/data-request` | Юридические документы |
| любой другой | 404 |

## Структура

```
src/
├── pages/            # страницы (по одной на маршрут)
├── components/       # UI: Navbar, Footer, панели, карточки, admin/, seller/, home/
├── context/          # 14 контекстов (Auth, Cart, Products, Categories, …)
├── services/         # доступ к Supabase (products, orders, categories, sellers, …)
├── hooks/            # usePageMeta, useBodyLock, useFocusTrap, …
├── utils/            # navigate, slug, format, storage, валидаторы
├── types/            # типы БД + мапперы Product → UIProduct
└── App.tsx           # провайдеры + Routes + глобальные панели
```

## Адреса товаров и SEO

Slug товара берётся из `products.slug`, а если колонки нет — собирается на лету: `/product/2-nazvanie-tovara`.

Чтобы адреса стали чистыми (`/product/nazvanie-tovara`), примените один раз миграцию `supabase/migrations/20261105_products_slug.sql` в SQL Editor Supabase. Приложение работает и без неё.

SEO-теги (title, description, Open Graph, canonical, JSON-LD) задаются хуком `usePageMeta` на каждой странице. `sitemap.xml` и `robots.txt` пересобираются при `npm run build`.

## Деплой (Vercel)

1. Импортировать репозиторий `leha249/mart` в Vercel.
2. Framework preset: **Vite**; Build Command: `npm run build`; Output: `dist`.
3. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
4. `vercel.json` уже содержит rewrites для SPA — прямые ссылки вроде `/product/...` не дают 404.
