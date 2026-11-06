export class AppError extends Error {
  code: string;
  cause?: unknown;

  constructor(message: string, code = 'UNKNOWN', cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Проблема с сетью. Проверьте интернет.', cause?: unknown) {
    super(message, 'NETWORK', cause);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION');
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Не авторизован') {
    super(message, 'AUTH');
    this.name = 'AuthError';
  }
}

export const normalizeError = (e: unknown): AppError => {
  if (e instanceof AppError) return e;

  if (e instanceof Error) {
    if (e.message.includes('fetch') || e.message.includes('network')) {
      return new NetworkError('Проблема с сетью', e);
    }
    if (e.message.includes('duplicate')) {
      return new ValidationError('Такая запись уже существует');
    }
    if (e.message.includes('credentials')) {
      return new AuthError('Неверный логин или пароль');
    }
    return new AppError(e.message, 'GENERIC', e);
  }

  // Supabase возвращает PostgrestError — это НЕ Error, а обычный объект
  // { message, details, hint, code }. Без этой ветки его текст терялся
  // и пользователь видел «Неизвестная ошибка» вместо, например,
  // «Код уже отправлен. Подождите минуту.».
  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message?: unknown }).message;
    const code = (e as { code?: unknown }).code;
    if (typeof message === 'string' && message.trim()) {
      if (code === '23505') {
        return new ValidationError('Такая запись уже существует');
      }
      if (code === '42501' || code === 'PGRST301') {
        return new AuthError(message);
      }
      return new AppError(message, typeof code === 'string' ? code : 'DB', e);
    }
  }

  return new AppError('Неизвестная ошибка', 'UNKNOWN', e);
};

/** Человеческий текст ошибки: Error, PostgrestError или фолбэк. */
export const errorMessage = (e: unknown, fallback: string): string => {
  if (e instanceof AppError) return e.message;
  if (e instanceof Error && e.message.trim()) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};