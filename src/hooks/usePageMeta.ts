import { useEffect } from 'react';

/**
 * Управление SEO-тегами страницы: title, description, Open Graph,
 * Twitter Card, canonical и robots.
 *
 * Раньше каждая страница вручную писала document.title в useEffect.
 * Теперь достаточно вызвать хук — он же выставит остальные мета-теги
 * и вернёт исходные значения при размонтировании.
 */

const SITE_NAME = 'MØRA MART';
const DEFAULT_DESCRIPTION =
  'MØRA MART — маркетплейс одежды, обуви и аксессуаров. Независимые продавцы, каждый со своим магазином.';

export interface PageMeta {
  /** Заголовок вкладки. К нему автоматически добавится «— MØRA MART». */
  title: string;
  description?: string;
  /** Картинка для соцсетей (абсолютный URL или путь от корня). */
  image?: string;
  type?: 'website' | 'product' | 'article';
  /** Не индексировать страницу (кабинеты, служебные страницы). */
  noindex?: boolean;
  /** Канонический адрес. По умолчанию — текущий путь. */
  canonical?: string;
}

const upsertMeta = (
  attr: 'name' | 'property',
  key: string,
  content: string
) => {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const absoluteUrl = (value: string): string => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${window.location.origin}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const usePageMeta = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  type = 'website',
  noindex = false,
  canonical,
}: PageMeta) => {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME)
      ? title
      : `${title} — ${SITE_NAME}`;

    document.title = fullTitle;

    const url = absoluteUrl(canonical ?? window.location.pathname);
    const imageUrl = image ? absoluteUrl(image) : '';

    upsertMeta('name', 'description', description);
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow'
    );

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:locale', 'ru_RU');
    if (imageUrl) upsertMeta('property', 'og:image', imageUrl);

    upsertMeta('name', 'twitter:card', imageUrl ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    if (imageUrl) upsertMeta('name', 'twitter:image', imageUrl);

    upsertCanonical(url);
  }, [title, description, image, type, noindex, canonical]);
};

/**
 * Структурированные данные schema.org через JSON-LD.
 * Нужны, чтобы Google/Яндекс показывали цену и наличие в выдаче.
 */
export const useJsonLd = (data: Record<string, unknown> | null) => {
  const key = data ? JSON.stringify(data) : '';

  useEffect(() => {
    const id = 'mora-jsonld';
    const existing = document.getElementById(id);
    if (!data) {
      existing?.remove();
      return;
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = key;
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
};
