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

  return new AppError('Неизвестная ошибка', 'UNKNOWN', e);
};