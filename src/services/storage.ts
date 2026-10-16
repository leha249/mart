import { supabase } from '../lib/supabase';
import { ALLOWED_IMAGE_TYPES, LIMITS } from '../utils/constants';
import { ValidationError, normalizeError } from '../utils/errors';

const BUCKET = 'products';
const MAX_RETRIES = 2;

interface UploadResult {
  url: string;
  path: string;
}

const generateFileName = (file: File): string => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}.${ext}`;
};

const validateFile = (file: File): void => {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ValidationError(
      `Формат не поддерживается. Разрешены: JPG, PNG, WEBP, GIF, AVIF`
    );
  }
  if (file.size > LIMITS.maxImageSize) {
    throw new ValidationError(
      `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(2)} МБ. Максимум 5 МБ.`
    );
  }
  if (file.size === 0) {
    throw new ValidationError('Файл пустой');
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const storageService = {
  async upload(file: File, folder = ''): Promise<UploadResult> {
    validateFile(file);

    const fileName = generateFileName(file);
    const path = folder ? `${folder}/${fileName}` : fileName;

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: '31536000',
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return { url: data.publicUrl, path };
      } catch (e) {
        lastError = e;
        if (attempt < MAX_RETRIES) {
          await sleep(500 * (attempt + 1));
          continue;
        }
      }
    }

    console.error('[storageService.upload]', lastError);
    throw normalizeError(lastError);
  },

  async remove(path: string): Promise<void> {
    if (!path) return;
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
    } catch (e) {
      console.warn('[storageService.remove]', e);
      // не кидаем — удаление картинки не критично
    }
  },

  extractPath(url: string): string | null {
    if (!url) return null;
    const marker = `/${BUCKET}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return url.slice(index + marker.length);
  },

  isOurFile(url: string): boolean {
    return this.extractPath(url) !== null;
  },

  async removeByUrl(url: string): Promise<void> {
    const path = this.extractPath(url);
    if (!path) return;
    await this.remove(path);
  },
};