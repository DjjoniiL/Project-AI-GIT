import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { renderOrderPdf } from '../services/orderPdf.js';
import { vibeRequest } from '../vibecode/client.js';

vi.mock('../vibecode/client.js', async () => {
  const actual = await vi.importActual<typeof import('../vibecode/client.js')>('../vibecode/client.js');
  return { ...actual, vibeRequest: vi.fn() };
});
vi.mock('../services/orderPdf.js', async () => {
  const actual = await vi.importActual<typeof import('../services/orderPdf.js')>('../services/orderPdf.js');
  return { ...actual, renderOrderPdf: vi.fn() };
});

const validBody = {
  productType: 'hoodie',
  fabric: 'terry_2_thread_no_fleece',
  care: 'gentle',
  printMethod: 'dtf',
  bodyColor: '#1a1a1a',
  trimColor: '#7a1f1f',
  printZone: 'chest_full',
  comment: 'test',
  sizes: { M: 1 },
  options: ['hood'],
};

describe('POST /api/order-pdf', () => {
  beforeEach(() => {
    vi.mocked(vibeRequest).mockReset();
    vi.mocked(renderOrderPdf).mockReset();
    vi.mocked(vibeRequest).mockResolvedValue({ portal: 'test.bitrix24.ru', type: 'oauth_app' });
  });

  it('returns 401 without X-Vibe-Authorization', async () => {
    const app = createApp();
    const res = await request(app).post('/api/order-pdf').send(validBody);

    expect(res.status).toBe(401);
    expect(renderOrderPdf).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/order-pdf')
      .set('X-Vibe-Authorization', 'Bearer x')
      .send({ productType: 'hoodie' });

    expect(res.status).toBe(400);
    expect(renderOrderPdf).not.toHaveBeenCalled();
  });

  it('streams the rendered PDF with the expected headers', async () => {
    vi.mocked(renderOrderPdf).mockResolvedValue(Buffer.from('%PDF-1.7 fake'));
    const app = createApp();

    const res = await request(app)
      .post('/api/order-pdf')
      .set('X-Vibe-Authorization', 'Bearer x')
      .send(validBody);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(renderOrderPdf).toHaveBeenCalledWith(expect.objectContaining({ productType: 'hoodie' }));
  });

  it('returns 502 when PDF rendering fails', async () => {
    vi.mocked(renderOrderPdf).mockRejectedValue(new Error('puppeteer crashed'));
    const app = createApp();

    const res = await request(app)
      .post('/api/order-pdf')
      .set('X-Vibe-Authorization', 'Bearer x')
      .send(validBody);

    expect(res.status).toBe(502);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'PDF_EXPORT_FAILED', message: 'Не удалось сформировать PDF бланка заказа' },
    });
  });
});
