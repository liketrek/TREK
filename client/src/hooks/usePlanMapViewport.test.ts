// FE-HOOK-PLANVIEW-001 to FE-HOOK-PLANVIEW-004
import { act, renderHook } from '@testing-library/react';
import { useTripStore } from '../store/tripStore';
import { usePlanMapViewport } from './usePlanMapViewport';

const KYOTO = { south: 34.96, west: 135.7, north: 35.06, east: 135.82 };

afterEach(() => useTripStore.setState({ planMapViewport: null }));

describe('usePlanMapViewport', () => {
  it('legt den gemeldeten Ausschnitt mit der Reise in den Store', () => {
    const { result } = renderHook(() => usePlanMapViewport(5));
    act(() => result.current(KYOTO));
    expect(useTripStore.getState().planMapViewport).toEqual({ tripId: 5, ...KYOTO });
  });

  it('raeumt den Ausschnitt weg, wenn die Karte verschwindet', () => {
    const { result, unmount } = renderHook(() => usePlanMapViewport(5));
    act(() => result.current(KYOTO));
    unmount();
    expect(useTripStore.getState().planMapViewport).toBeNull();
  });

  it('raeumt ihn auch weg, sobald die Karte nicht mehr zu sehen ist, und nimmt dann nichts an', () => {
    const { result, rerender } = renderHook(({ shown }) => usePlanMapViewport(5, shown), {
      initialProps: { shown: true },
    });
    act(() => result.current(KYOTO));
    rerender({ shown: false });
    expect(useTripStore.getState().planMapViewport).toBeNull();
    act(() => result.current(KYOTO));
    expect(useTripStore.getState().planMapViewport).toBeNull();
  });

  it('meldet nichts, solange die Reise keine gueltige Id hat', () => {
    const { result } = renderHook(() => usePlanMapViewport(Number.NaN));
    act(() => result.current(KYOTO));
    expect(useTripStore.getState().planMapViewport).toBeNull();
  });
});
