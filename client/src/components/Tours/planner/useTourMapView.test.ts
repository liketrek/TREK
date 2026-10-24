import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTourMapView } from './useTourMapView';

describe('useTourMapView', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the base map and the overlays chosen by hand across a reload', () => {
    const first = renderHook(() => useTourMapView());
    act(() => first.result.current.setMapBaseLayer('topo'));
    act(() => first.result.current.toggleMapOverlay('seamarks'));
    act(() => first.result.current.toggleMapOverlay('pistes', true));
    first.unmount();
    const { result } = renderHook(() => useTourMapView());
    expect(result.current.mapBaseLayer).toBe('topo');
    expect(result.current.mapOverlays.has('seamarks')).toBe(true);
    expect(result.current.mapOverlaysOff.has('pistes')).toBe(true);
  });

  it('falls back to the standard map when the stored choice is damaged', () => {
    localStorage.setItem('trek.tours.mapView', '{"base":"nope","on":[1]}');
    const { result } = renderHook(() => useTourMapView());
    expect(result.current.mapBaseLayer).toBe('default');
    expect(result.current.mapOverlays.size).toBe(0);
  });

  it('starts on the standard map with no overlay, and switches an overlay on and off again', () => {
    const { result } = renderHook(() => useTourMapView());
    expect(result.current.mapBaseLayer).toBe('default');
    expect(result.current.mapOverlays.size).toBe(0);
    act(() => result.current.toggleMapOverlay('seamarks'));
    expect(result.current.mapOverlays.has('seamarks')).toBe(true);
    act(() => result.current.setMapBaseLayer('satellite'));
    expect(result.current.mapBaseLayer).toBe('satellite');
    act(() => result.current.toggleMapOverlay('seamarks'));
    expect(result.current.mapOverlays.has('seamarks')).toBe(false);
  });
});
