import { describe, expect, it } from 'vitest';
import reducer, {
  setCare,
  setFabric,
  setPrintZone,
  setProductType,
  toggleOption,
} from './orderSlice';

describe('orderSlice', () => {
  it('switches care to gentle/durable when fabric thread count changes', () => {
    const state = reducer(undefined, setFabric('terry_3_thread_fleece'));
    expect(state.care).toBe('durable');
    expect(state.fabric).toBe('terry_3_thread_fleece');

    const back = reducer(state, setFabric('terry_2_thread_no_fleece'));
    expect(back.care).toBe('gentle');
  });

  it('switches fabric thread count when care changes, preserving fleece', () => {
    const withFleece = reducer(
      { ...reducer(undefined, { type: 'noop' }), fabric: 'terry_2_thread_fleece' },
      setCare('durable'),
    );
    expect(withFleece.fabric).toBe('terry_3_thread_fleece');
    expect(withFleece.care).toBe('durable');
  });

  it('filters options not applicable to the new product type', () => {
    const state = reducer(
      { ...reducer(undefined, { type: 'noop' }), options: ['hood', 'pocket', 'zip', 'trim'] },
      setProductType('tshirt'),
    );
    expect(state.options).toEqual(['trim']);
  });

  it('toggles an option on and off', () => {
    const withZip = reducer(undefined, toggleOption('zip'));
    expect(withZip.options).toContain('zip');

    const withoutZip = reducer(withZip, toggleOption('zip'));
    expect(withoutZip.options).not.toContain('zip');
  });

  it('switches view to back when the back print zone is selected', () => {
    const state = reducer(undefined, setPrintZone('back'));
    expect(state.view).toBe('back');

    const front = reducer(state, setPrintZone('chest_left'));
    expect(front.view).toBe('front');
  });
});
