/**
 * Контекст сделки приходит не как отдельный `deal_id`, а как JSON-строка в
 * query-параметре `placement_options` (specification.md, раздел 7) —
 * например `{"ID":"42"}` для placement `CRM_DEAL_DETAIL_TAB`.
 */
export function getDealIdFromLocation(search: string): string | undefined {
  const params = new URLSearchParams(search);
  const raw = params.get('placement_options');
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as { ID?: string | number };
    return parsed.ID !== undefined ? String(parsed.ID) : undefined;
  } catch {
    return undefined;
  }
}
