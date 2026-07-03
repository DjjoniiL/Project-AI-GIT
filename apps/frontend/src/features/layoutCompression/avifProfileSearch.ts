export interface AvifEncodeProbe {
  byteLength: number;
}

export type EncodeAtScaleAndQuality = (scale: number, quality: number) => Promise<AvifEncodeProbe>;

export interface AvifProfile {
  scale: number;
  quality: number;
  byteLength: number;
}

const QUALITY_MIN = 1;
const QUALITY_MAX = 100;
const MAX_BINARY_SEARCH_STEPS = 6;
const SCALE_STEP = 0.85;
const MIN_SCALE = 0.25;

/**
 * Адаптивный подбор AVIF-профиля под потолок байт (specification.md, раздел 4.1):
 * бинарный поиск максимального качества на текущем масштабе; если даже минимальное
 * качество не укладывается в лимит — масштаб уменьшается ступенчато и поиск качества
 * повторяется. Возвращает null, если лимит не достигается даже на MIN_SCALE.
 */
export async function searchAvifProfile(
  encodeAt: EncodeAtScaleAndQuality,
  maxBytes: number,
): Promise<AvifProfile | null> {
  let scale = 1;
  while (scale >= MIN_SCALE) {
    const found = await binarySearchQualityAtScale(encodeAt, scale, maxBytes);
    if (found) {
      return found;
    }
    scale *= SCALE_STEP;
  }
  return null;
}

async function binarySearchQualityAtScale(
  encodeAt: EncodeAtScaleAndQuality,
  scale: number,
  maxBytes: number,
): Promise<AvifProfile | null> {
  const lowest = await encodeAt(scale, QUALITY_MIN);
  if (lowest.byteLength > maxBytes) {
    return null;
  }

  let best: AvifProfile = { scale, quality: QUALITY_MIN, byteLength: lowest.byteLength };
  let lo = QUALITY_MIN;
  let hi = QUALITY_MAX;

  for (let step = 0; step < MAX_BINARY_SEARCH_STEPS && lo < hi; step += 1) {
    const mid = Math.ceil((lo + hi) / 2);
    const probe = await encodeAt(scale, mid);
    if (probe.byteLength <= maxBytes) {
      best = { scale, quality: mid, byteLength: probe.byteLength };
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return best;
}
