// FE-ROADTRIP-STOPDRAFT-001 to -005: the kind and length of a stop found along the
// drive, behind the desktop stop popup and the phone's draft sheet.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RoadtripStopDraft } from './RoadtripStopPopup';
import { DWELL_CHOICES, STOP_KIND_BY_KEY } from './stopKinds';
import { stopDraftDefaults, useStopDraftForm } from './useStopDraftForm';

function draft(category: string, editing?: RoadtripStopDraft['editing']): RoadtripStopDraft {
  return {
    poi: { name: 'Hit', category, lat: 1, lng: 2 } as RoadtripStopDraft['poi'],
    dayId: 4,
    position: 0,
    dayNumber: 1,
    ...(editing ? { editing } : {}),
  };
}

describe('stopDraftDefaults', () => {
  it('FE-ROADTRIP-STOPDRAFT-001: a hit opens as its own kind with that kind usual length', () => {
    expect(stopDraftDefaults(draft('fuel'))).toEqual({ stopType: 'fuel', dwell: STOP_KIND_BY_KEY.fuel.defaultMinutes });
    expect(stopDraftDefaults(draft('charging'))).toEqual({ stopType: 'charging', dwell: 30 });
  });

  it('FE-ROADTRIP-STOPDRAFT-002: an edit answers with what the stop says; an unknown hit gets no kind and half an hour', () => {
    expect(stopDraftDefaults(draft('fuel', { placeId: 1, dwellMinutes: 12, stopType: null }))).toEqual({
      stopType: null,
      dwell: 12,
    });
    expect(stopDraftDefaults(draft('museum'))).toEqual({ stopType: null, dwell: 30 });
    expect(stopDraftDefaults(null)).toEqual({ stopType: null, dwell: 30 });
  });
});

describe('useStopDraftForm', () => {
  it('FE-ROADTRIP-STOPDRAFT-003: the first answers come from the draft it opens on', () => {
    const { result } = renderHook(() => useStopDraftForm(draft('rest_area')));
    expect(result.current.stopType).toBe('rest_area');
    expect(result.current.dwell).toBe(20);
    expect(result.current.kind?.key).toBe('rest_area');
    expect(result.current.saving).toBe(false);
  });

  it('FE-ROADTRIP-STOPDRAFT-004: picking another kind takes its length; picking the same keeps a length set by hand', () => {
    const { result } = renderHook(() => useStopDraftForm(draft('fuel')));
    act(() => result.current.setDwell(DWELL_CHOICES[5]));
    act(() => result.current.pickKind('fuel'));
    expect(result.current.dwell).toBe(60);
    act(() => result.current.pickKind('restaurant'));
    expect(result.current).toMatchObject({ stopType: 'restaurant', dwell: 45 });
    expect(result.current.kind?.key).toBe('restaurant');
  });

  it('FE-ROADTRIP-STOPDRAFT-005: seeding answers for a new draft, and starts empty without one', () => {
    const { result } = renderHook(() => useStopDraftForm(null));
    expect(result.current).toMatchObject({ stopType: null, dwell: 30 });
    expect(result.current.kind).toBeUndefined();
    const seed = result.current.seed;
    act(() => result.current.seed(draft('campsite')));
    expect(result.current).toMatchObject({ stopType: 'campsite', dwell: 60 });
    expect(result.current.seed).toBe(seed);
  });
});
