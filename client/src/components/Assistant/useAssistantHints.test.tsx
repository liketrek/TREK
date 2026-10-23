/**
 * FE-AI-HINTS-001 to FE-AI-HINTS-006
 *
 * The plan hints as the views get them: worded with the day's name, gated on
 * the assistant, the setting, the trip in the planner and its phase, with the
 * stays read only when asked for, and a tap that focuses and asks.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { AiStatusResponse } from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAssignment, buildDay, buildPlace, buildTrip } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Assignment, Place } from '../../types';

const repo = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../../repo/accommodationRepo', () => ({ accommodationRepo: repo }));

const { useAssistantHints, useAssistantHintsSetting } = await import('./useAssistantHints');

const INITIAL_ASSISTANT = useAssistantStore.getState();
const TRIP = 5;

const wrapper = ({ children }: { children: ReactNode }) => <TranslationProvider>{children}</TranslationProvider>;

function timed(id: number, dayId: number, time: string, end: string): Assignment {
  const place = buildPlace({ id: 100 + id, name: `Stop ${id}`, place_time: time, end_time: end, lat: 0, lng: 0 });
  return buildAssignment({ id, day_id: dayId, place_id: place.id, order_index: id, place });
}

function seedTrip() {
  const days = [
    buildDay({ id: 1, trip_id: TRIP, date: '2099-06-01', title: 'Louvre day' }),
    buildDay({ id: 2, trip_id: TRIP, date: '2099-06-02', title: 'Last day' }),
  ];
  const stops = [timed(1, 1, '10:00', '12:00'), timed(2, 1, '11:00', '12:30')];
  useTripStore.setState({
    trip: buildTrip({ id: TRIP, start_date: '2099-06-01', end_date: '2099-06-02' }),
    days,
    places: stops.map((a) => a.place as Place),
    assignments: { '1': stops },
    reservations: [],
    dayNotes: {},
  });
}

beforeEach(() => {
  window.localStorage.clear();
  resetAllStores();
  vi.clearAllMocks();
  useAssistantStore.setState({ status: { available: true } as AiStatusResponse });
  repo.list.mockResolvedValue({ accommodations: [] });
  seedTrip();
});

afterEach(() => useAssistantStore.setState(INITIAL_ASSISTANT, true));

const render = (tripId: number | null = TRIP, withStays = false) =>
  renderHook(() => useAssistantHints(tripId, { withStays }), { wrapper });

describe('useAssistantHints', () => {
  it('FE-AI-HINTS-001: words a hint with the name of its day, and a tap focuses the day and its places and asks', async () => {
    const setFocus = vi.fn();
    const send = vi.fn().mockResolvedValue(undefined);
    useAssistantStore.setState({ setFocus, send });
    const { result } = render();
    await waitFor(() => expect(result.current.hints).toHaveLength(1));
    const [hint] = result.current.hints;
    expect(hint.text).toBe('Stop 1 and Stop 2 overlap on Louvre day');

    act(() => result.current.ask(hint));
    expect(setFocus).toHaveBeenCalledWith(TRIP, { dayId: 1, placeIds: [101, 102] });
    expect(send).toHaveBeenCalledWith(TRIP, 'Stop 1 and Stop 2 overlap on Louvre day. How should we sort that out?');
  });

  it('FE-AI-HINTS-002: says nothing without the assistant, with hints off, for another trip, or for a trip that is over', () => {
    useAssistantStore.setState({ status: { available: false } as AiStatusResponse });
    expect(render().result.current.hints).toEqual([]);

    useAssistantStore.setState({ status: { available: true } as AiStatusResponse });
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, assistant_hints: false } }));
    expect(render().result.current.hints).toEqual([]);

    useSettingsStore.setState((s) => ({ settings: { ...s.settings, assistant_hints: true } }));
    expect(render(TRIP + 1).result.current.hints).toEqual([]);
    expect(render(null).result.current.hints).toEqual([]);
    expect(render().result.current.hints).toHaveLength(1);

    useTripStore.setState({ trip: buildTrip({ id: TRIP, start_date: '2000-06-01', end_date: '2000-06-02' }) });
    expect(render().result.current.hints).toEqual([]);
  });

  it('FE-AI-HINTS-003: a dismissed hint stays away, and the launcher counts unseen warnings until they are seen', async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.unseenWarn).toBe(1));
    act(() => result.current.markWarnsSeen());
    expect(result.current.unseenWarn).toBe(0);
    expect(result.current.hints).toHaveLength(1);

    act(() => result.current.dismiss(result.current.hints[0].id));
    expect(result.current.hints).toEqual([]);
    expect(render().result.current.hints).toEqual([]);
  });

  it('FE-AI-HINTS-004: reads the stays only when asked, and then names a night without one', async () => {
    const { result: quiet } = render(TRIP, false);
    await waitFor(() => expect(quiet.current.hints).toHaveLength(1));
    expect(repo.list).not.toHaveBeenCalled();

    const { result } = render(TRIP, true);
    await waitFor(() => expect(result.current.hints.map((h) => h.rule)).toEqual(['overlap', 'noStay']));
    expect(repo.list).toHaveBeenCalledWith(TRIP);
    expect(result.current.hints[1].text).toBe('Nowhere to stay yet for the night after Louvre day');
  });

  it('FE-AI-HINTS-005: stays that cannot be read leave the nights alone', async () => {
    repo.list.mockRejectedValue(new Error('offline and not cached'));
    const { result } = render(TRIP, true);
    await waitFor(() => expect(repo.list).toHaveBeenCalled());
    await waitFor(() => expect(result.current.hints.map((h) => h.rule)).toEqual(['overlap']));
  });
});

describe('useAssistantHintsSetting', () => {
  it('FE-AI-HINTS-006: is on by default, and the switch saves the opposite', () => {
    const updateSetting = vi.fn().mockResolvedValue(undefined);
    useSettingsStore.setState({ updateSetting });
    const { result } = renderHook(() => useAssistantHintsSetting(), { wrapper });
    expect(result.current.on).toBe(true);
    act(() => result.current.toggle());
    expect(updateSetting).toHaveBeenCalledWith('assistant_hints', false);
  });
});
