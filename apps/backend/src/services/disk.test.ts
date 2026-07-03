import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vibeRequest } from '../vibecode/client.js';
import { FileTooLargeError, MAX_LAYOUT_FILE_BYTES, uploadFileToDisk } from './disk.js';

vi.mock('../vibecode/client.js', () => ({ vibeRequest: vi.fn() }));

describe('uploadFileToDisk', () => {
  beforeEach(() => {
    vi.mocked(vibeRequest).mockReset();
  });

  it('rejects files larger than 52 MB before encoding, without calling the API', async () => {
    const oversized = { filename: 'big.png', content: Buffer.alloc(MAX_LAYOUT_FILE_BYTES + 1) };

    await expect(uploadFileToDisk(oversized, 1)).rejects.toBeInstanceOf(FileTooLargeError);
    expect(vibeRequest).not.toHaveBeenCalled();
  });

  it('uploads base64-encoded content for files within the limit', async () => {
    vi.mocked(vibeRequest).mockResolvedValue({ id: 89, downloadUrl: 'https://example.test/download' });
    const file = { filename: 'ok.png', content: Buffer.from('hello') };

    const result = await uploadFileToDisk(file, 1);

    expect(vibeRequest).toHaveBeenCalledWith('POST', '/v1/files/upload', {
      body: { folderId: 1, filename: 'ok.png', content: Buffer.from('hello').toString('base64') },
    });
    expect(result.id).toBe(89);
  });
});
