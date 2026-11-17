import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { bottomChromePadding } from './mapChromePadding';
import { useSelectionCameraGL } from './useSelectionCameraGL';

/** A 1000x1200 map whose projection is lng/lat times ten. */
function glMap() {
  return {
    getZoom: vi.fn(() => 12),
    flyTo: vi.fn(),
    easeTo: vi.fn(),
    project: vi.fn(([lng, lat]: [number, number]) => ({ x: lng * 10, y: lat * 10 })),
    getContainer: vi.fn(() => ({ clientWidth: 1000, clientHeight: 1200 })),
  };
}

// Projected to (500, 700) and (500, 200).
const low = { id: 1, lat: 70, lng: 50 };
const high = { id: 2, lat: 20, lng: 50 };

function padding(inspectorHeight: number) {
  return { top: 60, right: 340, left: 340, bottom: bottomChromePadding({ hasInspector: true, inspectorHeight }) };
}

function setup(selectedPlaceId: number, follow = true) {
  const map = glMap();
  const mapRef = { current: map };
  const view = renderHook(
    ({ selected, pad }) =>
      useSelectionCameraGL({
        mapRef,
        selectedPlaceId: selected,
        places: [low, high],
        dayPlaces: [],
        selectedPlace: null,
        follow,
        padding: pad,
        enableMapbox3d: false,
      }),
    { initialProps: { selected: selectedPlaceId, pad: padding(0) } }
  );
  return { map, ...view };
}

describe('useSelectionCameraGL', () => {
  it('SELCAM-GL-001: flies to a new selection, padded by the panels, at least to zoom 14', () => {
    const { map } = setup(1);
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [50, 70], zoom: 14, padding: padding(0) })
    );
  });

  it('SELCAM-GL-002: eases the pin back out when the place card grew over it (#2991)', () => {
    const { map, rerender } = setup(1);
    rerender({ selected: 1, pad: padding(900) });
    expect(map.easeTo).toHaveBeenCalledWith({ center: [50, 70], padding: padding(900), duration: 300 });
    expect(map.flyTo).toHaveBeenCalledTimes(1);
  });

  it('SELCAM-GL-003: leaves a pin that is still in the open where it is', () => {
    const { map, rerender } = setup(2);
    rerender({ selected: 2, pad: padding(900) });
    expect(map.easeTo).not.toHaveBeenCalled();
  });

  it('SELCAM-GL-004: moves only once when the selection and the card arrive together', () => {
    const { map, rerender } = setup(2);
    rerender({ selected: 1, pad: padding(900) });
    expect(map.flyTo).toHaveBeenCalledTimes(2);
    expect(map.easeTo).not.toHaveBeenCalled();
  });

  it('SELCAM-GL-005: does not move a locked map at all', () => {
    const { map, rerender } = setup(1, false);
    rerender({ selected: 1, pad: padding(900) });
    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.easeTo).not.toHaveBeenCalled();
  });
});
