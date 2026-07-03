import { describe, expect, it } from 'vitest';
import { buildOrderHtml, type OrderPdfInput } from './orderPdf.js';

const baseOrder: OrderPdfInput = {
  productType: 'hoodie',
  fabric: 'terry_2_thread_no_fleece',
  care: 'gentle',
  printMethod: 'dtf',
  bodyColor: '#1a1a1a',
  trimColor: '#7a1f1f',
  sizes: { M: 2, L: 3 },
  options: ['hood', 'pocket'],
  printZone: 'chest_full',
  comment: 'Пожелание по цвету ниток',
  layoutFileName: 'design.png',
};

describe('buildOrderHtml', () => {
  it('renders human-readable labels for all coded fields', () => {
    const html = buildOrderHtml(baseOrder);

    expect(html).toContain('Худи');
    expect(html).toContain('Футер 2-х нитка, без начёса');
    expect(html).toContain('Бережный уход');
    expect(html).toContain('ДТФ');
    expect(html).toContain('Вся грудь');
    expect(html).toContain('Капюшон, Карман');
  });

  it('summarizes non-zero sizes and totals the quantity', () => {
    const html = buildOrderHtml(baseOrder);

    expect(html).toContain('M: 2, L: 3');
    expect(html).toContain('5 шт.');
  });

  it('falls back to placeholder text when sizes, options, comment or layout are empty', () => {
    const html = buildOrderHtml({
      ...baseOrder,
      sizes: {},
      options: [],
      comment: '',
      layoutFileName: undefined,
    });

    expect(html).toContain('не указаны');
    expect(html).toContain('не выбраны');
    expect(html).toContain('не загружен');
    expect(html).toContain('0 шт.');
  });

  it('escapes HTML in user-provided free text to prevent injection', () => {
    const html = buildOrderHtml({ ...baseOrder, comment: '<script>alert(1)</script>' });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('ignores an invalid color value instead of injecting it into inline style', () => {
    const html = buildOrderHtml({ ...baseOrder, bodyColor: 'red; background:url(javascript:alert(1))' });

    expect(html).not.toContain('background:red; background:url(javascript:alert(1))');
  });
});
