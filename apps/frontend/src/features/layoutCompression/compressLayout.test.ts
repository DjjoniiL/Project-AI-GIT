import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compressLayoutFile, LayoutCompressionError, PDF_TARGET_MAX_BYTES } from './compressLayout';
import { encodeAvifByteLength } from './avifEncoder';
import { canvasFromImageData, canvasToJpegBlob, drawScaledImageData, loadImageBitmapFromFile } from './rasterImage';
import { buildSingleImagePdf } from './pdfPackaging';

vi.mock('./avifEncoder');
vi.mock('./rasterImage');
vi.mock('./pdfPackaging');

const fakeFile = new File([new Uint8Array(10)], 'huge-layout.png', { type: 'image/png' });

function pdfBytesOfSize(size: number): Uint8Array {
  return new Uint8Array(size);
}

function fakeJpegBlob(): Blob {
  return { arrayBuffer: async () => new ArrayBuffer(1) } as unknown as Blob;
}

describe('compressLayoutFile', () => {
  beforeEach(() => {
    vi.mocked(loadImageBitmapFromFile).mockResolvedValue({ width: 8000, height: 6000 } as unknown as ImageBitmap);
    vi.mocked(drawScaledImageData).mockReturnValue({ width: 8000, height: 6000 } as unknown as ImageData);
    vi.mocked(canvasFromImageData).mockReturnValue({} as unknown as HTMLCanvasElement);
    vi.mocked(encodeAvifByteLength).mockResolvedValue(40 * 1024 * 1024);
    vi.mocked(canvasToJpegBlob).mockResolvedValue(fakeJpegBlob());
  });

  it('returns a compressed PDF file when the first JPEG packing already fits the budget', async () => {
    vi.mocked(buildSingleImagePdf).mockResolvedValue(pdfBytesOfSize(45 * 1024 * 1024));

    const result = await compressLayoutFile(fakeFile);

    expect(result.file.name).toBe('compressed-huge-layout.pdf');
    expect(result.file.type).toBe('application/pdf');
    expect(result.pdfBytes).toBe(45 * 1024 * 1024);
    expect(result.originalBytes).toBe(fakeFile.size);
    expect(buildSingleImagePdf).toHaveBeenCalledTimes(1);
  });

  it('retries with lower JPEG quality until the PDF fits under the 52 MB ceiling', async () => {
    vi.mocked(buildSingleImagePdf)
      .mockResolvedValueOnce(pdfBytesOfSize(60 * 1024 * 1024))
      .mockResolvedValueOnce(pdfBytesOfSize(55 * 1024 * 1024))
      .mockResolvedValueOnce(pdfBytesOfSize(50 * 1024 * 1024));

    const result = await compressLayoutFile(fakeFile);

    expect(result.pdfBytes).toBe(50 * 1024 * 1024);
    expect(result.pdfBytes).toBeLessThanOrEqual(PDF_TARGET_MAX_BYTES);
    expect(buildSingleImagePdf).toHaveBeenCalledTimes(3);
  });

  it('throws LayoutCompressionError when the AVIF profile search never fits the 48 MB budget', async () => {
    vi.mocked(encodeAvifByteLength).mockResolvedValue(500 * 1024 * 1024);

    await expect(compressLayoutFile(fakeFile)).rejects.toBeInstanceOf(LayoutCompressionError);
    expect(buildSingleImagePdf).not.toHaveBeenCalled();
  });

  it('throws LayoutCompressionError when the PDF still overshoots after exhausting the JPEG quality floor', async () => {
    vi.mocked(buildSingleImagePdf).mockResolvedValue(pdfBytesOfSize(60 * 1024 * 1024));

    await expect(compressLayoutFile(fakeFile)).rejects.toBeInstanceOf(LayoutCompressionError);
  });
});
