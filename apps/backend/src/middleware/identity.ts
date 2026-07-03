import type { NextFunction, Request, Response } from 'express';
import { VibeApiRequestError, vibeRequest } from '../vibecode/client.js';

/**
 * Личность пользователя из GET /v1/me (форма зависит от типа ключа — личный/oauth_app,
 * см. specification.md, раздел 2). Не типизируем строго — потребители читают нужные поля.
 */
export type VibeIdentity = Record<string, unknown>;

declare module 'express-serve-static-core' {
  interface Request {
    vibeIdentity?: VibeIdentity;
  }
}

/**
 * Gateway сам подставляет X-Vibe-Authorization: Bearer vibe_session_... на запросы
 * встроенного в портал приложения — middleware пробрасывает его как Authorization
 * в GET /v1/me, чтобы получить личность пользователя (specification.md, раздел 2).
 */
export async function identityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header('x-vibe-authorization');

  if (!authorization) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_AUTH',
        message: 'Заголовок X-Vibe-Authorization обязателен',
      },
    });
    return;
  }

  try {
    req.vibeIdentity = await vibeRequest<VibeIdentity>('GET', '/v1/me', { authorization });
    next();
  } catch (err) {
    if (err instanceof VibeApiRequestError) {
      res.status(err.status).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(502).json({
      success: false,
      error: { code: 'VIBE_API_UNREACHABLE', message: 'Не удалось связаться с VibeCode API' },
    });
  }
}
