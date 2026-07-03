import type { OrderState } from './orderSlice';

export interface SubmitOrderResult {
  success: true;
  dealId: string | number;
}

export interface SubmitOrderError {
  success: false;
  code: string;
  message: string;
}

/**
 * Отправляет заказ на бэкенд (POST /api/order, multipart/form-data — specification.md,
 * раздел 7). `dealId` — из placement_options, если вкладка открыта в существующей сделке.
 */
export async function submitOrder(
  order: OrderState,
  dealId: string | undefined,
  layoutFile: File | null,
): Promise<SubmitOrderResult | SubmitOrderError> {
  const body = new FormData();
  body.set('productType', order.productType);
  body.set('fabric', order.fabric);
  body.set('care', order.care);
  body.set('printMethod', order.printMethod);
  body.set('bodyColor', order.bodyColor);
  body.set('trimColor', order.trimColor);
  body.set('printZone', order.printZone);
  body.set('comment', order.comment);
  body.set('sizes', JSON.stringify(order.sizes));
  body.set('options', JSON.stringify(order.options));
  if (dealId) {
    body.set('dealId', dealId);
  }
  if (layoutFile) {
    body.set('layoutFile', layoutFile);
  }

  let response: Response;
  try {
    response = await fetch('/api/order', { method: 'POST', body });
  } catch {
    return { success: false, code: 'NETWORK_ERROR', message: 'Не удалось связаться с сервером' };
  }

  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: { dealId: string | number } }
    | { success: false; error: { code: string; message: string } }
    | null;

  if (!payload) {
    return { success: false, code: 'INVALID_RESPONSE', message: 'Некорректный ответ сервера' };
  }
  if (!payload.success) {
    return { success: false, code: payload.error.code, message: payload.error.message };
  }
  return { success: true, dealId: payload.data.dealId };
}
