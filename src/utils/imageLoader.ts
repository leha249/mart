/**
 * Оптимизирует URL картинки: заменяет размер, добавляет формат.
 * Работает с Pexels, Picsum, Supabase Storage.
 */
export const optimizeImageUrl = (url: string, width: number): string => {
  if (!url) return url;

  // Pexels
  if (url.includes('images.pexels.com')) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', String(width));
      urlObj.searchParams.set('auto', 'compress');
      urlObj.searchParams.set('cs', 'tinysrgb');
      urlObj.searchParams.set('dpr', '1');
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Picsum
  if (url.includes('picsum.photos')) {
    return url.replace(/\/\d+\/\d+$/, `/${width}/auto`);
  }

  // Supabase Storage — возвращаем как есть
  return url;
};

export const buildSrcSet = (url: string, baseWidth: number): string => {
  const srcset = [
    `${optimizeImageUrl(url, baseWidth)} ${baseWidth}w`,
    `${optimizeImageUrl(url, baseWidth * 2)} ${baseWidth * 2}w`,
  ].join(', ');
  return srcset;
};

export const optimizedImgProps = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
};