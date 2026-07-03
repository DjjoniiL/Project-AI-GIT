import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { createOrUpdateDeal } from '../services/deals.js';
import { uploadFileToDisk } from '../services/disk.js';
import { vibeRequest } from '../vibecode/client.js';

vi.mock('../vibecode/client.js', async () => {
  const actual = await vi.importActual<typeof import('../vibecode/client.js')>('../vibecode/client.js');
  return { ...actual, vibeRequest: vi.fn() };
});
vi.mock('../services/deals.js', () => ({ createOrUpdateDeal: vi.fn() }));
vi.mock('../services/disk.js', async () => {
  const actual = await vi.importActual<typeof import('../services/disk.js')>('../services/disk.js');
  return { ...actual, uploadFileToDisk: vi.fn() };
});

const validFields = {
  productType: 'hoodie',
  fabric: 'terry_2_thread_no_fleece',
  care: 'gentle',
  printMethod: 'dtf',
  bodyColor: '#1a1a1a',
  trimColor: '#7a1f1f',
  printZone: 'chest_full',
  comment: 'test',
  sizes: JSON.stringify({ M: 1 }),
  options: JSON.stringify(['hood']),
};

describe('POST /api/order', () => {
  beforeEach(() => {
    vi.mocked(vibeRequest).mockReset();
    vi.mocked(createOrUpdateDeal).mockReset();
    vi.mocked(uploadFileToDisk).mockReset();
    vi.mocked(vibeRequest).mockResolvedValue({ portal: 'test.bitrix24.ru', type: 'oauth_app' });
  });

  afterEach(() => {
    delete process.env.VIBE_LAYOUT_FOLDER_ID;
  });

  it('returns 401 without X-Vibe-Authorization', async () => {
    const app = createApp();
    const res = await request(app).post('/api/order').field(validFields);
    expect(res.status).toBe(401);
    expect(createOrUpdateDeal).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/order')
      .set('X-Vibe-Authorization', 'Bearer x')
      .field('productType', 'hoodie');

    expect(res.status).toBe(400);
    expect(createOrUpdateDeal).not.toHaveBeenCalled();
  });

  it('creates a deal without a layout file', async () => {
    vi.mocked(createOrUpdateDeal).mockResolvedValue({ id: 42 });
    const app = createApp();

    let agent = request(app).post('/api/order').set('X-Vibe-Authorization', 'Bearer x');
    for (const [key, value] of Object.entries(validFields)) {
      agent = agent.field(key, value);
    }
    const res = await agent;

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { dealId: 42 } });
    expect(uploadFileToDisk).not.toHaveBeenCalled();
  });

  it('uploads the layout file and links its id to the deal', async () => {
    process.env.VIBE_LAYOUT_FOLDER_ID = '5';
    vi.mocked(uploadFileToDisk).mockResolvedValue({ id: 89, downloadUrl: 'https://example.test/89' });
    vi.mocked(createOrUpdateDeal).mockResolvedValue({ id: 7 });
    const app = createApp();

    let agent = request(app).post('/api/order').set('X-Vibe-Authorization', 'Bearer x');
    for (const [key, value] of Object.entries(validFields)) {
      agent = agent.field(key, value);
    }
    const res = await agent.attach('layoutFile', Buffer.from('fake image bytes'), 'design.png');

    expect(res.status).toBe(200);
    expect(uploadFileToDisk).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'design.png' }),
      5,
    );
    expect(createOrUpdateDeal).toHaveBeenCalledWith(
      expect.objectContaining({ designFileId: '89' }),
      undefined,
    );
  });

  it('updates an existing deal when dealId is provided', async () => {
    vi.mocked(createOrUpdateDeal).mockResolvedValue({ id: '99' });
    const app = createApp();

    let agent = request(app).post('/api/order').set('X-Vibe-Authorization', 'Bearer x');
    for (const [key, value] of Object.entries({ ...validFields, dealId: '99' })) {
      agent = agent.field(key, value);
    }
    const res = await agent;

    expect(res.status).toBe(200);
    expect(createOrUpdateDeal).toHaveBeenCalledWith(expect.anything(), '99');
  });
});
