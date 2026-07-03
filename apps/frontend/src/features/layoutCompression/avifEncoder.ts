import avifEncoderModuleFactory from '@jsquash/avif/codec/enc/avif_enc.js';
import type { AVIFModule, EncodeOptions } from '@jsquash/avif/codec/enc/avif_enc.js';
import avifEncoderWasmUrl from '@jsquash/avif/codec/enc/avif_enc.wasm?url';
import { initEmscriptenModule } from '@jsquash/avif/utils.js';

/**
 * Фиксированные параметры кодера, кроме quality (варьируется поиском профиля).
 * speed:8 — ближе к максимальной скорости libavif, важно т.к. поиск профиля
 * гоняет кодер несколько раз подряд на клиенте (specification.md, 4.1).
 */
const BASE_ENCODE_OPTIONS: Omit<EncodeOptions, 'quality'> = {
  qualityAlpha: -1,
  denoiseLevel: 0,
  tileRowsLog2: 0,
  tileColsLog2: 0,
  speed: 8,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  enableSharpYUV: false,
  tune: 0,
  bitDepth: 8,
};

let modulePromise: Promise<AVIFModule> | null = null;

/**
 * Принудительно однопоточный вариант кодера (не auto-detect из @jsquash/avif/encode) —
 * многопоточный вариант требует COOP/COEP (SharedArrayBuffer), которые недоступны
 * внутри iframe-плейсмента Битрикс24.
 */
function getAvifModule(): Promise<AVIFModule> {
  if (!modulePromise) {
    modulePromise = initEmscriptenModule<AVIFModule>(avifEncoderModuleFactory, undefined, {
      locateFile: () => avifEncoderWasmUrl,
    });
  }
  return modulePromise;
}

/**
 * Кодирует ImageData в AVIF и возвращает только размер результата в байтах —
 * сам AVIF-поток не нужен на выходе пайплайна (см. compressLayout.ts), кодирование
 * здесь используется исключительно как измерительный инструмент для поиска
 * качества/масштаба.
 */
export async function encodeAvifByteLength(imageData: ImageData, quality: number): Promise<number> {
  const module = await getAvifModule();
  const options: EncodeOptions = { ...BASE_ENCODE_OPTIONS, quality };
  const output = module.encode(new Uint8Array(imageData.data.buffer), imageData.width, imageData.height, options);
  if (!output) {
    throw new Error('Не удалось выполнить AVIF-кодирование');
  }
  return output.byteLength;
}
