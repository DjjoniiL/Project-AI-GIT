import { describe, expect, it } from 'vitest';
import { getDealIdFromLocation } from './placementContext';

describe('getDealIdFromLocation', () => {
  it('extracts the deal id from placement_options JSON', () => {
    const search = '?placement=CRM_DEAL_DETAIL_TAB&placement_options=%7B%22ID%22%3A%2242%22%7D';
    expect(getDealIdFromLocation(search)).toBe('42');
  });

  it('returns undefined when placement_options is absent', () => {
    expect(getDealIdFromLocation('?placement=CRM_DEAL_DETAIL_TAB')).toBeUndefined();
  });

  it('returns undefined when placement_options is not valid JSON', () => {
    expect(getDealIdFromLocation('?placement_options=not-json')).toBeUndefined();
  });
});
