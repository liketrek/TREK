import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaceDeepLink } from './usePlaceDeepLink';

function setup(query: string, placeIds: number[]) {
  const searchParams = new URLSearchParams(query);
  const setSearchParams = vi.fn((update: (params: URLSearchParams) => URLSearchParams) => update(searchParams));
  const selectPlace = vi.fn();
  const hook = renderHook(
    ({ ids }) =>
      usePlaceDeepLink({
        searchParams,
        setSearchParams: setSearchParams as never,
        placeIds: ids,
        selectPlace,
      }),
    { initialProps: { ids: placeIds } }
  );
  return { searchParams, setSearchParams, selectPlace, hook };
}

describe('usePlaceDeepLink (WAN-02)', () => {
  it('opens the linked place of the trip and leaves the URL', () => {
    const { searchParams, selectPlace, setSearchParams } = setup('tab=plan&place=7', [3, 7]);
    expect(selectPlace).toHaveBeenCalledWith(7);
    expect(searchParams.has('place')).toBe(false);
    expect(searchParams.get('tab')).toBe('plan');
    expect(setSearchParams).toHaveBeenCalledWith(expect.any(Function), { replace: true });
  });

  it('waits for the places, then drops an id the trip does not hold', () => {
    const { searchParams, selectPlace, hook } = setup('place=9', []);
    expect(searchParams.get('place')).toBe('9');
    hook.rerender({ ids: [3, 7] });
    expect(selectPlace).not.toHaveBeenCalled();
    expect(searchParams.has('place')).toBe(false);
  });

  it('does nothing without a link', () => {
    const { setSearchParams, selectPlace } = setup('tab=plan', [3]);
    expect(setSearchParams).not.toHaveBeenCalled();
    expect(selectPlace).not.toHaveBeenCalled();
  });
});
