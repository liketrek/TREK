import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTourMapView } from './useTourMapView';

describe('useTourMapView', () => {
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
