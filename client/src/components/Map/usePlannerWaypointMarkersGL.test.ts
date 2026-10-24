// FE-PLANNER-PIN-GL-001: the GL map's planner pins carry the moon where a stage of a multi-day tour ends (MDT-01).
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlannerWaypointMarkersGL } from './usePlannerWaypointMarkersGL';

describe('usePlannerWaypointMarkersGL', () => {
  it('FE-PLANNER-PIN-GL-001: puts the moon on the pin of a stage end only, numbered as the list numbers it', () => {
    const container = document.createElement('div');
    const map = { getContainer: () => container, unproject: () => ({ lat: 0, lng: 0 }) };
    const attached: HTMLElement[] = [];
    renderHook(() =>
      usePlannerWaypointMarkersGL({
        mapRef: { current: map },
        mapReady: true,
        pinsRef: { current: [] },
        attachPin: (el) => {
          attached.push(el);
          return { remove: vi.fn(), setLngLat: vi.fn() };
        },
        pinCss: () => 'display:flex',
        plannerWaypoints: [
          { id: 'a', lat: 47, lng: 11, label: '1' },
          { id: 'b', lat: 47.1, lng: 11, label: '2', stageEnd: true },
        ],
        selectedPlannerWaypointId: null,
        onPlannerWaypointClick: vi.fn(),
        onPlannerWaypointMove: undefined,
      })
    );
    expect(attached).toHaveLength(2);
    expect(attached[0].querySelector('[data-stage-end]')).toBeNull();
    expect(attached[1].querySelector('[data-stage-end]')).not.toBeNull();
    expect(attached[1].textContent).toBe('2');
  });
});
