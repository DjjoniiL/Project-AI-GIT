import type { OrderFormData } from '@garment/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vibeRequest } from '../vibecode/client.js';
import { createOrUpdateDeal } from './deals.js';

vi.mock('../vibecode/client.js', () => ({ vibeRequest: vi.fn() }));

const order: OrderFormData = {
  productType: 'hoodie',
  fabric: 'terry_2_thread_no_fleece',
  care: 'gentle',
  printMethod: 'dtf',
  bodyColor: '#1a1a1a',
  trimColor: '#7a1f1f',
  sizes: { M: 2, L: 1 },
  options: ['hood', 'trim'],
  printZone: 'chest_full',
  comment: 'Тестовый заказ',
};

describe('createOrUpdateDeal', () => {
  beforeEach(() => {
    vi.mocked(vibeRequest).mockReset();
  });

  it('creates a new deal via POST /v1/deals when dealId is absent', async () => {
    vi.mocked(vibeRequest).mockResolvedValue({ id: 42 });

    const result = await createOrUpdateDeal(order);

    expect(vibeRequest).toHaveBeenCalledWith(
      'POST',
      '/v1/deals',
      expect.objectContaining({
        body: expect.objectContaining({
          UF_CRM_PRODUCT_TYPE: 'hoodie',
          UF_CRM_SIZES_JSON: JSON.stringify(order.sizes),
          UF_CRM_OPTIONS: JSON.stringify(order.options),
        }),
      }),
    );
    expect(result).toEqual({ id: 42 });
  });

  it('updates an existing deal via PATCH /v1/deals/:id when dealId is given', async () => {
    vi.mocked(vibeRequest).mockResolvedValue({ id: '99' });

    await createOrUpdateDeal(order, '99');

    expect(vibeRequest).toHaveBeenCalledWith(
      'PATCH',
      '/v1/deals/99',
      expect.objectContaining({ body: expect.objectContaining({ UF_CRM_FABRIC: order.fabric }) }),
    );
  });
});
