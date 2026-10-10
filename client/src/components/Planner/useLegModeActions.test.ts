// FE-PLANNER-LEGMODE-001 to -006: the per-leg travel mode behind the desktop day
// plan's connector menu and the phone timeline's.
import { act, renderHook, waitFor } from '@testing-library/react';
import { RotateCcw, TramFront } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assignmentsApi } from '../../api/client';
import { routeModeIcon } from './routeModes';
import { legModeMenuItems, useLegModeActions } from './useLegModeActions';

const t = (key: string) => `t:${key}`;
const OPTIONS = [
  { key: 'driving', label: 'Car' },
  { key: 'walking', label: 'Foot' },
];

function deps() {
  return { tripId: 3, toast: { error: vi.fn() }, t, tripActions: { refreshDays: vi.fn(async () => undefined) } };
}

beforeEach(() => {
  vi.spyOn(assignmentsApi, 'updateTransport').mockResolvedValue({});
});
afterEach(() => vi.restoreAllMocks());

describe('legModeMenuItems', () => {
  it('FE-PLANNER-LEGMODE-001: every profile, then a divider and the day default that clears the leg', () => {
    const pick = vi.fn();
    const items = legModeMenuItems(OPTIONS, pick, t);
    expect(items.map((i) => i.label ?? (i.divider ? '---' : ''))).toEqual([
      'Car',
      'Foot',
      '---',
      't:dayplan.transportMode.useDefault',
    ]);
    expect(items[1].icon).toBe(routeModeIcon('walking'));
    expect(items[3].icon).toBe(RotateCcw);
    items[1].onClick?.();
    items[3].onClick?.();
    expect(pick.mock.calls).toEqual([['walking'], [null]]);
  });

  it('FE-PLANNER-LEGMODE-002: public transit sits under the profiles only when the leg can be searched', () => {
    const planTransit = vi.fn();
    const items = legModeMenuItems(OPTIONS, vi.fn(), t, planTransit);
    expect(items[2]).toEqual({ label: 't:transit.title', icon: TramFront, onClick: planTransit });
    expect(legModeMenuItems(OPTIONS, vi.fn(), t).some((i) => i.label === 't:transit.title')).toBe(false);
  });
});

describe('useLegModeActions', () => {
  it('FE-PLANNER-LEGMODE-003: saves the leg leaving a stop, and with incoming the one entering it', async () => {
    const d = deps();
    const { result } = renderHook(() => useLegModeActions(d));
    await act(async () => {
      result.current.persistLegMode(11, 'walking');
      result.current.persistLegMode(12, null, 'incoming');
    });
    expect(vi.mocked(assignmentsApi.updateTransport).mock.calls).toEqual([
      [3, 11, 'walking'],
      [3, 12, null, 'incoming'],
    ]);
    expect(d.toast.error).not.toHaveBeenCalled();
    expect(d.tripActions.refreshDays).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-LEGMODE-004: a refused write says why and reloads the days', async () => {
    vi.mocked(assignmentsApi.updateTransport).mockRejectedValueOnce(new Error('conflict'));
    const d = deps();
    const { result } = renderHook(() => useLegModeActions(d));
    act(() => result.current.persistLegMode(11, 'cycling'));
    await waitFor(() => expect(d.toast.error).toHaveBeenCalledWith('conflict'));
    expect(d.tripActions.refreshDays).toHaveBeenCalledWith(3);
  });

  it('FE-PLANNER-LEGMODE-005: a failure without a message falls back to the generic line', async () => {
    vi.mocked(assignmentsApi.updateTransport).mockRejectedValueOnce('boom');
    const d = deps();
    const { result } = renderHook(() => useLegModeActions(d));
    act(() => result.current.persistLegMode(11, null, 'incoming'));
    await waitFor(() => expect(d.toast.error).toHaveBeenCalledWith('t:common.unknownError'));
  });

  it('FE-PLANNER-LEGMODE-006: the menu offers the route profiles the planner knows', () => {
    const { result } = renderHook(() => useLegModeActions(deps()));
    const keys = result.current.routeModeOptions.map((o) => o.key);
    expect(keys).toEqual(['driving', 'walking', 'cycling']);
    const pick = vi.fn();
    const items = result.current.legModeMenu(pick);
    expect(items).toHaveLength(keys.length + 2);
    items[2].onClick?.();
    expect(pick).toHaveBeenCalledWith('cycling');
  });
});
