import puppeteer from 'puppeteer';
import {
  CARE_LABELS,
  FABRIC_LABELS,
  OPTION_LABELS,
  PRINT_METHOD_LABELS,
  PRINT_ZONE_LABELS,
  PRODUCT_TYPE_LABELS,
  SIZES,
  type OrderFormData,
} from '@garment/shared-types';

export interface OrderPdfInput extends OrderFormData {
  /** Имя файла макета — только для отображения в бланке, сам файл сюда не передаётся. */
  layoutFileName?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSizes(sizes: OrderFormData['sizes']): { rows: string; total: number } {
  const rows: string[] = [];
  let total = 0;
  for (const size of SIZES) {
    const qty = sizes[size] ?? 0;
    if (qty > 0) {
      rows.push(`${size}: ${qty}`);
      total += qty;
    }
  }
  return { rows: rows.length ? rows.join(', ') : 'не указаны', total };
}

function formatOptions(options: OrderFormData['options']): string {
  if (!options.length) return 'не выбраны';
  return options.map((option) => OPTION_LABELS[option]).join(', ');
}

function colorSwatchCell(color: string): string {
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#ffffff';
  return `<span class="swatch" style="background:${safeColor}"></span>${escapeHtml(color)}`;
}

function fieldRow(label: string, valueHtml: string): string {
  return `<tr><td class="label">${escapeHtml(label)}</td><td class="value">${valueHtml}</td></tr>`;
}

export function buildOrderHtml(order: OrderPdfInput): string {
  const { rows: sizeRows, total } = formatSizes(order.sizes);

  const rows = [
    fieldRow('Тип изделия', escapeHtml(PRODUCT_TYPE_LABELS[order.productType])),
    fieldRow('Ткань', escapeHtml(FABRIC_LABELS[order.fabric])),
    fieldRow('Уход за материалом', escapeHtml(CARE_LABELS[order.care].title)),
    fieldRow('Способ нанесения принта', escapeHtml(PRINT_METHOD_LABELS[order.printMethod])),
    fieldRow('Основной цвет', colorSwatchCell(order.bodyColor)),
    fieldRow('Цвет отделки', colorSwatchCell(order.trimColor)),
    fieldRow('Размеры', escapeHtml(sizeRows)),
    fieldRow('Итого', String(total) + ' шт.'),
    fieldRow('Дополнительные опции', escapeHtml(formatOptions(order.options))),
    fieldRow('Зона размещения принта', escapeHtml(PRINT_ZONE_LABELS[order.printZone])),
    fieldRow('Файл макета', escapeHtml(order.layoutFileName || 'не загружен')),
    fieldRow('Комментарий', escapeHtml(order.comment || '—')),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; }
  h1 { font-size: 20px; font-weight: 600; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; border-bottom: 1px solid #e0e0e0; vertical-align: top; font-size: 13px; }
  td.label { width: 220px; color: #666; }
  td.value { font-weight: 500; }
  .swatch { display: inline-block; width: 12px; height: 12px; border: 1px solid #ccc; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
</style>
</head>
<body>
  <h1>Бланк заказа</h1>
  <table>${rows}</table>
</body>
</html>`;
}

/**
 * Рендерит сводную спецификацию заказа в PDF через headless Chromium (specification.md,
 * раздел 5) — HTML-шаблон, не завязан на скриншот SVG. Аргументы запуска подобраны
 * эмпирически на живой инфраструктуре VibeCode (galaxyApp, ~512 МБ RAM, см. NEXT_SESSION.md).
 */
export async function renderOrderPdf(order: OrderPdfInput): Promise<Buffer> {
  const html = buildOrderHtml(order);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBytes = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
