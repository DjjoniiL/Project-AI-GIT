import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportOrderPdf } from './exportOrderPdf';
import type { OrderState } from './orderSlice';

const baseOrder: OrderState = {
  productType: 'hoodie',
  fabric: 'terry_2_thread_no_fleece',
  care: 'gentle',
  printMethod: 'dtf',
  bodyColor: '#1a1a1a',
  trimColor: '#7a1f1f',
  sizes: { M: 2 },
  options: ['hood'],
  printZone: 'chest_full',
  comment: 'test comment',
  view: 'front',
};

describe('exportOrderPdf', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => 'blob:mock');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    }
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts the order as JSON and triggers a download on success', async () => {
    const pdfBlob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    vi.mocked(fetch).mockResolvedValue(
      new Response(pdfBlob, { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
    );

    const layoutFile = new File(['x'], 'design.png', { type: 'image/png' });
    const result = await exportOrderPdf(baseOrder, layoutFile);

    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith(
      '/api/order-pdf',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({ productType: 'hoodie', layoutFileName: 'design.png' });
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
  });

  it('omits layoutFileName when no layout file is selected', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(new Blob(['%PDF']), { status: 200 }));

    await exportOrderPdf(baseOrder, null);

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.layoutFileName).toBeUndefined();
  });

  it('returns the server error message on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Не заполнены обязательные поля заказа' } }), {
        status: 400,
      }),
    );

    const result = await exportOrderPdf(baseOrder, null);

    expect(result).toEqual({ success: false, message: 'Не заполнены обязательные поля заказа' });
  });

  it('returns a network error message when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));

    const result = await exportOrderPdf(baseOrder, null);

    expect(result).toEqual({ success: false, message: 'Не удалось связаться с сервером' });
  });
});
