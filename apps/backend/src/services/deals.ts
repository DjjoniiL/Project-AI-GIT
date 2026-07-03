import { UF_FIELD_MAP, type OrderFormData } from '@garment/shared-types';
import { vibeRequest } from '../vibecode/client.js';

export interface DealRecord {
  id: string | number;
  [key: string]: unknown;
}

/** Поля формы, которые в CRM хранятся как JSON-строка, а не как есть. */
const JSON_ENCODED_FIELDS = new Set<keyof OrderFormData>(['sizes', 'options']);

function buildDealFields(order: OrderFormData): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  (Object.keys(UF_FIELD_MAP) as Array<keyof OrderFormData>).forEach((key) => {
    const value = order[key];
    if (value === undefined) return;

    const ufCode = UF_FIELD_MAP[key];
    fields[ufCode] = JSON_ENCODED_FIELDS.has(key) ? JSON.stringify(value) : value;
  });

  return fields;
}

/**
 * Создаёт сделку (POST /v1/deals) или обновляет существующую (PATCH /v1/deals/{id}),
 * в зависимости от наличия dealId (приходит из placement_options — specification.md,
 * раздел 7, не из query-параметра, как предполагалось изначально).
 */
export async function createOrUpdateDeal(
  order: OrderFormData,
  dealId?: string,
): Promise<DealRecord> {
  const fields = buildDealFields(order);

  if (dealId) {
    return vibeRequest<DealRecord>('PATCH', `/v1/deals/${dealId}`, { body: fields });
  }

  return vibeRequest<DealRecord>('POST', '/v1/deals', {
    body: { title: 'Заказ на печать одежды', ...fields },
  });
}
