/**
 * Тонкий HTTP-клиент к VibeCode API. Формат ответа и ошибок — по разведке живого API
 * (specification.md, раздел 2): конверт {success, data} / {success:false, error:{code,message}}.
 */

export interface VibeApiError {
  code: string;
  message: string;
}

export class VibeApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'VibeApiRequestError';
    this.status = status;
    this.code = code;
  }
}

interface VibeRequestOptions {
  body?: unknown;
  /** Значение заголовка Authorization — пробрасывается из входящего X-Vibe-Authorization. */
  authorization?: string;
}

function getBaseUrl(): string {
  return process.env.VIBE_API_BASE_URL ?? 'https://vibecode.bitrix24.tech';
}

function getAppKey(): string {
  return process.env.VIBE_APP_KEY ?? '';
}

export async function vibeRequest<T>(
  method: string,
  path: string,
  options: VibeRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { 'X-Api-Key': getAppKey() };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.authorization) {
    headers.Authorization = options.authorization;
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: VibeApiError;
  };

  if (!response.ok || !payload.success) {
    const error = payload.error ?? {
      code: 'UNKNOWN_ERROR',
      message: 'VibeCode API request failed',
    };
    throw new VibeApiRequestError(response.status, error.code, error.message);
  }

  return payload.data as T;
}
