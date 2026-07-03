import type { OrderState } from './orderSlice';

export interface ExportOrderPdfResult {
  success: boolean;
  message?: string;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Скачивает PDF-бланк заказа (specification.md, раздел 5) — сводная спецификация текущего
 * состояния формы, рендерится на бэкенде через Puppeteer (`POST /api/order-pdf`). Файл
 * макета сюда не передаётся, только его имя для отображения в бланке.
 */
export async function exportOrderPdf(
  order: OrderState,
  layoutFile: File | null,
): Promise<ExportOrderPdfResult> {
  let response: Response;
  try {
    response = await fetch('/api/order-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productType: order.productType,
        fabric: order.fabric,
        care: order.care,
        printMethod: order.printMethod,
        bodyColor: order.bodyColor,
        trimColor: order.trimColor,
        printZone: order.printZone,
        comment: order.comment,
        sizes: order.sizes,
        options: order.options,
        layoutFileName: layoutFile?.name,
      }),
    });
  } catch {
    return { success: false, message: 'Не удалось связаться с сервером' };
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    return { success: false, message: payload?.error?.message ?? 'Не удалось сформировать PDF бланка заказа' };
  }

  const blob = await response.blob();
  downloadBlob(blob, 'order-blank.pdf');
  return { success: true };
}
