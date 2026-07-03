import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VibeApiRequestError, vibeRequest } from '../vibecode/client.js';
import { identityMiddleware } from './identity.js';

vi.mock('../vibecode/client.js', async () => {
  const actual = await vi.importActual<typeof import('../vibecode/client.js')>('../vibecode/client.js');
  return { ...actual, vibeRequest: vi.fn() };
});

function fakeRequest(headerValue: string | undefined): Request {
  return { header: () => headerValue } as unknown as Request;
}

function fakeResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('identityMiddleware', () => {
  beforeEach(() => {
    vi.mocked(vibeRequest).mockReset();
  });

  it('returns 401 when X-Vibe-Authorization is missing', async () => {
    const req = fakeRequest(undefined);
    const res = fakeResponse();
    const next = vi.fn();

    await identityMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'MISSING_AUTH' }) }),
    );
    expect(next).not.toHaveBeenCalled();
    expect(vibeRequest).not.toHaveBeenCalled();
  });

  it('attaches vibeIdentity and calls next on success', async () => {
    vi.mocked(vibeRequest).mockResolvedValue({ portal: 'test.bitrix24.ru', type: 'oauth_app' });
    const req = fakeRequest('Bearer vibe_session_x');
    const res = fakeResponse();
    const next = vi.fn();

    await identityMiddleware(req, res, next);

    expect(vibeRequest).toHaveBeenCalledWith('GET', '/v1/me', { authorization: 'Bearer vibe_session_x' });
    expect(req.vibeIdentity).toEqual({ portal: 'test.bitrix24.ru', type: 'oauth_app' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('forwards status/code from a VibeApiRequestError', async () => {
    vi.mocked(vibeRequest).mockRejectedValue(new VibeApiRequestError(401, 'TOKEN_MISSING', 'no bearer'));
    const req = fakeRequest('Bearer bad');
    const res = fakeResponse();
    const next = vi.fn();

    await identityMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'TOKEN_MISSING', message: 'no bearer' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 502 when VibeCode API is unreachable', async () => {
    vi.mocked(vibeRequest).mockRejectedValue(new Error('fetch failed'));
    const req = fakeRequest('Bearer x');
    const res = fakeResponse();
    const next = vi.fn();

    await identityMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(next).not.toHaveBeenCalled();
  });
});
