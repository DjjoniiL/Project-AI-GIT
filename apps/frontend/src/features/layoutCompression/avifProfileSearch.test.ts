import { describe, expect, it } from 'vitest';
import { searchAvifProfile } from './avifProfileSearch';

/** Синтетическая модель: размер AVIF растёт с масштабом^2 и с качеством. */
function simulateEncode(baseBytesAtFullScaleMaxQuality: number) {
  return async (scale: number, quality: number) => {
    const byteLength = Math.round(baseBytesAtFullScaleMaxQuality * scale * scale * (quality / 100));
    return { byteLength };
  };
}

describe('searchAvifProfile', () => {
  it('finds the maximum quality at full scale when the budget already fits', async () => {
    const encodeAt = simulateEncode(40 * 1024 * 1024);
    const profile = await searchAvifProfile(encodeAt, 48 * 1024 * 1024);

    expect(profile).not.toBeNull();
    expect(profile?.scale).toBe(1);
    expect(profile?.byteLength).toBeLessThanOrEqual(48 * 1024 * 1024);
    expect(profile?.quality).toBeGreaterThan(90);
  });

  it('reduces scale when even the minimum quality overshoots the budget at full scale', async () => {
    // At scale=1, quality=1 this still yields 50 MB (> 48 MB budget), forcing a scale step down.
    const encodeAt = simulateEncode(5000 * 1024 * 1024);
    const profile = await searchAvifProfile(encodeAt, 48 * 1024 * 1024);

    expect(profile).not.toBeNull();
    expect(profile?.scale).toBeLessThan(1);
    expect(profile?.byteLength).toBeLessThanOrEqual(48 * 1024 * 1024);
  });

  it('returns null when the budget cannot be reached even at the minimum scale', async () => {
    const encodeAt = simulateEncode(1024 * 1024 * 1024 * 1024);
    const profile = await searchAvifProfile(encodeAt, 48 * 1024 * 1024);

    expect(profile).toBeNull();
  });

  it('never calls the encoder with a quality outside the 1-100 range', async () => {
    const seenQualities: number[] = [];
    const encodeAt = async (scale: number, quality: number) => {
      seenQualities.push(quality);
      return simulateEncode(40 * 1024 * 1024)(scale, quality);
    };

    await searchAvifProfile(encodeAt, 48 * 1024 * 1024);

    expect(seenQualities.every((q) => q >= 1 && q <= 100)).toBe(true);
  });
});
