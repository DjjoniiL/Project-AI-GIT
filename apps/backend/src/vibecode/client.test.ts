import { afterEach, describe, expect, it, vi } from 'vitest';
import { vibeRequest } from './client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.VIBE_APP_KEY;
});

describe('vibeRequest', () => {
  it('returns data on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 1 } }),
      }),
    );

    const result = await vibeRequest<{ id: number }>('GET', '/v1/me');

    expect(result).toEqual({ id: 1 });
  });

  it('sends X-Api-Key from env and Authorization from options', async () => {
    process.env.VIBE_APP_KEY = 'vibe_app_test';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await vibeRequest('GET', '/v1/me', { authorization: 'Bearer vibe_session_x' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://vibecode.bitrix24.tech/v1/me');
    expect(init.headers['X-Api-Key']).toBe('vibe_app_test');
    expect(init.headers.Authorization).toBe('Bearer vibe_session_x');
  });

  it('throws VibeApiRequestError with status/code from the error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_API_KEY', message: 'Ключ не найден' },
        }),
      }),
    );

    await expect(vibeRequest('GET', '/v1/me')).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_API_KEY',
      message: 'Ключ не найден',
    });
  });
});
