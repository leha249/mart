import type { UIProduct } from '../types/database';
import { formatPrice } from './format';

interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'cancelled' | 'failed';
  message?: string;
}

export const shareProduct = async (
  product: UIProduct
): Promise<ShareResult> => {
  const url = `${window.location.origin}${window.location.pathname}#product-${product.id}`;
  const title = product.name;
  const text = `${product.name} — ${formatPrice(product.price)} в DPR.MART`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'native' };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return {
      success: true,
      method: 'clipboard',
      message: 'Ссылка скопирована в буфер',
    };
  } catch {
    return {
      success: false,
      method: 'failed',
      message: 'Не удалось скопировать ссылку',
    };
  }
};

export const shareUrl = async (url: string, message = 'Ссылка скопирована') => {
  try {
    await navigator.clipboard.writeText(url);
    return { success: true, message };
  } catch {
    return { success: false, message: 'Не удалось скопировать' };
  }
};