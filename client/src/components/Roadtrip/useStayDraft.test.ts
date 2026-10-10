// FE-ROADTRIP-STAYDRAFT-001 to -005: the stay length draft behind the desktop stay
// dialog and the phone's stay sheet.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { STAY_MAX, STAY_PRESETS, STAY_STEP, clampStay, stayPreview, useStayDraft } from './useStayDraft';

describe('stay limits and preview', () => {
  it('FE-ROADTRIP-STAYDRAFT-001: the presets, the step and a full day as the most a stay goes', () => {
    expect(STAY_PRESETS).toEqual([15, 30, 45, 60, 90, 120, 480, 720]);
    expect(STAY_STEP).toBe(5);
    expect(STAY_MAX).toBe(1440);
    expect(clampStay(-10)).toBe(0);
    expect(clampStay(2000)).toBe(1440);
    expect(clampStay(42.5)).toBe(43);
  });

  it('FE-ROADTRIP-STAYDRAFT-002: the stay moves the departure and carries it past midnight', () => {
    expect(stayPreview('09:30', 90, false)).toEqual({ arrive: '09:30', leave: '11:00', carry: 0 });
    expect(stayPreview('23:00', 120, false)).toEqual({ arrive: '23:00', leave: '01:00', carry: 1 });
    expect(stayPreview('13:00', 0, true)).toMatchObject({ arrive: '1:00 PM', leave: '1:00 PM' });
    expect(stayPreview(null, 30, false)).toBeNull();
    expect(stayPreview(undefined, 30, false)).toBeNull();
  });
});

describe('useStayDraft', () => {
  it('FE-ROADTRIP-STAYDRAFT-003: starts on its initial value and previews against the arrival', () => {
    const { result, rerender } = renderHook(
      (props: { arrival: string | null }) =>
        useStayDraft({ arrival: props.arrival, is12h: false, initial: 30, wholeMinutes: true }),
      { initialProps: { arrival: '10:00' } }
    );
    expect(result.current.minutes).toBe(30);
    expect(result.current.saving).toBe(false);
    expect(result.current.preview).toEqual({ arrive: '10:00', leave: '10:30', carry: 0 });
    act(() => result.current.setMinutes(60));
    expect(result.current.preview?.leave).toBe('11:00');
    rerender({ arrival: null });
    expect(result.current.preview).toBeNull();
  });

  it('FE-ROADTRIP-STAYDRAFT-004: a step never leaves none to a full day', () => {
    const { result } = renderHook(() => useStayDraft({ arrival: null, is12h: false, initial: 0, wholeMinutes: true }));
    act(() => result.current.nudge(-STAY_STEP));
    expect(result.current.minutes).toBe(0);
    act(() => result.current.nudge(STAY_STEP));
    expect(result.current.minutes).toBe(5);
    act(() => result.current.setMinutes(1438));
    act(() => result.current.nudge(STAY_STEP));
    expect(result.current.minutes).toBe(1440);
  });

  it('FE-ROADTRIP-STAYDRAFT-005: only the phone rounds a stored fraction to whole minutes on a step', () => {
    const phone = renderHook(() => useStayDraft({ arrival: null, is12h: false, initial: 12.5, wholeMinutes: true }));
    act(() => phone.result.current.nudge(STAY_STEP));
    expect(phone.result.current.minutes).toBe(18);
    const desktop = renderHook(() => useStayDraft({ arrival: null, is12h: false, initial: 12.5, wholeMinutes: false }));
    act(() => desktop.result.current.nudge(STAY_STEP));
    expect(desktop.result.current.minutes).toBe(17.5);
  });
});
