#!/usr/bin/env node
/**
 * Генерирует public/sitemap.xml перед сборкой.
 *
 * Берёт статические страницы + товары и магазины из Supabase (публичный
 * anon-ключ, только чтение). Если сеть/база недоступны — пишет карту
 * со статическими страницами, чтобы сборка не падала.
 *
 * Запуск: npm run build (через prebuild) или node scripts/generate-sitemap.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const generateSlug = (input) =>
  String(input ?? '')
    .trim()
    .split('')
    .map((char) => (TRANSLIT[char.toLowerCase()] ?? char).toString())
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);

const productSlug = (product) => {
  const stored = String(product.slug ?? '').trim();
  if (stored) return stored;
  const translit = generateSlug(product.name);
  return translit ? `${product.id}-${translit}` : String(product.id);
};

/** Читаем .env.local вручную: dotenv не нужен. */
const loadEnv = async () => {
  const env = { ...process.env };
  const file = path.join(root, '.env.local');
  if (!existsSync(file)) return env;

  const raw = await readFile(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, value] = match;
    if (!env[key]) env[key] = value.replace(/^["']|["']$/g, '');
  }
  return env;
};

const fetchTable = async (baseUrl, key, table, select) => {
  const url = `${baseUrl}/rest/v1/${table}?select=${select}`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return res.json();
};

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/sellers', priority: '0.8', changefreq: 'weekly' },
  { path: '/sell', priority: '0.6', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.5', changefreq: 'monthly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contacts', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/seller-agreement', priority: '0.3', changefreq: 'yearly' },
  { path: '/data-request', priority: '0.2', changefreq: 'yearly' },
];

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const main = async () => {
  const env = await loadEnv();
  const siteUrl = (
    env.VITE_SITE_URL ||
    env.SITE_URL ||
    'https://moramart.ru'
  ).replace(/\/+$/, '');

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  const urls = STATIC_PAGES.map((page) => ({ ...page, url: `${siteUrl}${page.path}` }));

  if (supabaseUrl && supabaseKey) {
    try {
      // Колонки перечисляем явно: у anon нет select * на sellers
      // (закрыты user_id, email и служебные поля), поэтому нужен view.
      const [products, sellers] = await Promise.all([
        fetchTable(supabaseUrl, supabaseKey, 'products', 'id,name,slug'),
        fetchTable(supabaseUrl, supabaseKey, 'sellers_public', 'slug,status'),
      ]);

      for (const product of products) {
        urls.push({
          url: `${siteUrl}/product/${productSlug(product)}`,
          priority: '0.8',
          changefreq: 'weekly',
        });
      }

      for (const seller of sellers) {
        if (seller.status !== 'active' || !seller.slug) continue;
        urls.push({
          url: `${siteUrl}/seller/${seller.slug}`,
          priority: '0.7',
          changefreq: 'weekly',
        });
      }

      console.log(
        `sitemap: ${products.length} товаров, ${sellers.length} магазинов`
      );
    } catch (error) {
      console.warn(`sitemap: база недоступна (${error.message}) — только статические страницы`);
    }
  } else {
    console.warn('sitemap: нет ключей Supabase — только статические страницы');
  }

  const today = new Date().toISOString().slice(0, 10);

  const body = urls
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${escapeXml(entry.url)}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n` +
        `    <priority>${entry.priority}</priority>\n` +
        `  </url>`
    )
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  const outFile = path.join(root, 'public', 'sitemap.xml');
  await writeFile(outFile, xml, 'utf8');
  console.log(`sitemap: ${urls.length} URL → public/sitemap.xml`);

  // robots.txt с актуальным адресом карты
  const robots =
    'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /admin\n' +
    'Disallow: /seller/dashboard\n' +
    'Disallow: /account\n' +
    'Disallow: /my-orders\n' +
    'Disallow: /favorites\n' +
    'Disallow: /order-success\n' +
    'Disallow: /login\n' +
    'Disallow: /login-customer\n' +
    '\n' +
    `Sitemap: ${siteUrl}/sitemap.xml\n`;

  await writeFile(path.join(root, 'public', 'robots.txt'), robots, 'utf8');
  console.log('robots.txt обновлён');
};

main().catch((error) => {
  console.error('sitemap: ошибка', error);
  process.exitCode = 0;
});
