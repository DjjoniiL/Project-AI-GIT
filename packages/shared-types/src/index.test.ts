import { describe, expect, it } from 'vitest';
import { SIZES, UF_FIELD_MAP } from './index.js';

describe('SIZES', () => {
  it('lists all ten sizes from S to 7XL in order', () => {
    expect(SIZES).toEqual(['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL']);
  });
});

describe('UF_FIELD_MAP', () => {
  it('maps every order form field to a UF_CRM_* code', () => {
    const values = Object.values(UF_FIELD_MAP);

    expect(values.every((code) => code.startsWith('UF_CRM_'))).toBe(true);
    expect(new Set(values).size).toBe(values.length);
  });
});
