import { encodeAvifByteLength } from './avifEncoder';
import { searchAvifProfile } from './avifProfileSearch';
import { buildSingleImagePdf } from './pdfPackaging';
import { canvasFromImageData, canvasToJpegBlob, drawScaledImageData, loadImageBitmapFromFile } from './rasterImage';

/** Потолок AVIF-профиля — specification.md, раздел 4.1. */
export const AVIF_TARGET_MAX_BYTES = 48 * 1024 * 1024;
/** Потолок итогового PDF (запас ~4 МБ на переупаковку в JPEG) — specification.md, раздел 4.1. */
export const PDF_TARGET_MAX_BYTES = 52 * 1024 * 1024;

const JPEG_QUALITY_FLOOR = 0.5;
const JPEG_QUALITY_STEP = 0.08;

export interface CompressLayoutResult {
  file: File;
  originalBytes: number;
  avifBytes: number;
  pdfBytes: number;
}

export class LayoutCompressionError extends Error {}

/**
 * Пайплайн «Сжать файл» (specification.md, раздел 4.1):
 * 1. Адаптивный подбор AVIF-профиля (качество + масштаб) под потолок 48 МБ —
 *    качество/разрешение реального изображения, найденные через настоящее WASM-кодирование.
 * 2. То же изображение (в найденном масштабе) переупаковывается в JPEG внутри
 *    одностраничного PDF под потолок 52 МБ — AVIF-поток напрямую в PDF не встраивается,
 *    поэтому при необходимости качество JPEG дополнительно снижается итеративно.
 */
export async function compressLayoutFile(file: File): Promise<CompressLayoutResult> {
  const bitmap = await loadImageBitmapFromFile(file);

  const profile = await searchAvifProfile(async (scale, quality) => {
    const imageData = drawScaledImageData(bitmap, scale);
    const byteLength = await encodeAvifByteLength(imageData, quality);
    return { byteLength };
  }, AVIF_TARGET_MAX_BYTES);

  if (!profile) {
    throw new LayoutCompressionError(
      'Не удалось сжать файл до нужного размера даже при минимальном качестве и разрешении',
    );
  }

  const imageData = drawScaledImageData(bitmap, profile.scale);
  const canvas = canvasFromImageData(imageData);

  let jpegQuality = mapAvifQualityToJpegQuality(profile.quality);
  while (jpegQuality >= JPEG_QUALITY_FLOOR) {
    const jpegBlob = await canvasToJpegBlob(canvas, jpegQuality);
    const jpegBuffer = await jpegBlob.arrayBuffer();
    const pdfBytes = await buildSingleImagePdf(jpegBuffer);
    if (pdfBytes.byteLength <= PDF_TARGET_MAX_BYTES) {
      return {
        file: new File([new Uint8Array(pdfBytes)], buildCompressedFileName(file.name), { type: 'application/pdf' }),
        originalBytes: file.size,
        avifBytes: profile.byteLength,
        pdfBytes: pdfBytes.byteLength,
      };
    }
    jpegQuality -= JPEG_QUALITY_STEP;
  }

  throw new LayoutCompressionError('Сжатый файл не удалось упаковать в PDF в пределах лимита 52 МБ');
}

function mapAvifQualityToJpegQuality(avifQuality: number): number {
  const normalized = avifQuality / 100;
  return Math.min(0.92, Math.max(JPEG_QUALITY_FLOOR, normalized));
}

function buildCompressedFileName(originalName: string): string {
  const baseName = originalName.replace(/\.[^./\\]+$/, '');
  return `compressed-${baseName || 'layout'}.pdf`;
}
