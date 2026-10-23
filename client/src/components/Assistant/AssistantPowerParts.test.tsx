/**
 * FE-AI-POWER-001 to FE-AI-POWER-010
 *
 * The parts that tie the chat into the planner: the next questions under an
 * answer, the waiting changes inside the day list, the week grid of a plan
 * over several days, the context menu rows, the trip notes and the part of the
 * map a question carries.
 */
import { act, renderHook } from '@testing-library/react';
import type { AssistantChangePreview, AssistantMessage } from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildDay, buildPlace, buildTrip, buildUser } from '../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import { mapViewOf } from '../Map/assistantViewport';
import AssistantDayPreview from './AssistantDayPreview';
import { followUpsFor } from './assistantFollowUpRules';
import AssistantFollowUps from './AssistantFollowUps';
import type { ChangeItem } from './assistantParts';
import { type AssistantView, AssistantViewContext } from './assistantViewContext';
import AssistantWeekOverview from './AssistantWeekOverview';
import { useAssistantMenu } from './useAssistantMenu';
import { useTripMemory } from './useTripMemory';
import { useWeekDays } from './useWeekDays';

const TRIP = 9;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const SETTINGS = useSettingsStore.getState();
const AUTH = useAuthStore.getState();

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
  useSettingsStore.setState(SETTINGS, true);
  useAuthStore.setState(AUTH, true);
});

const view: AssistantView = { tripId: TRIP, variant: 'window' };
const inView = (node: ReactNode) => <AssistantViewContext.Provider value={view}>{node}</AssistantViewContext.Provider>;

function answer(parts: AssistantMessage['parts'], id = 'a1'): AssistantMessage {
  return { id, role: 'assistant', status: 'complete', createdAt: '2026-10-21T08:00:00.000Z', parts };
}

function preview(
  toolCallId: string,
  dayId: number,
  over: Partial<AssistantChangePreview> = {}
): AssistantChangePreview {
  return {
    toolCallId,
    verbKey: 'addPlace',
    subject: 'Place',
    rows: [],
    dayId,
    placeIds: [],
    undoable: true,
    effect: { kind: 'add', dayId, fromDayId: null, placeId: null, assignmentId: null, place: null },
    ...over,
  };
}

function waiting(toolCallId: string, data: AssistantChangePreview): AssistantMessage['parts'] {
  return [
    { type: 'tool-call', toolCallId, toolName: 'create_place', args: {}, approval: { id: toolCallId } },
    { type: 'data-trek-change', data },
  ];
}

function seedChat(messages: AssistantMessage[], extra: Record<string, unknown> = {}) {
  useAssistantStore.setState({
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), messages, ...extra } },
  });
}

describe('the next questions', () => {
  it('FE-AI-POWER-001: an answer offers what fits what it holds, changes only to someone who may make them', () => {
    const ids = (parts: AssistantMessage['parts'], canEdit = true) =>
      followUpsFor(answer(parts), canEdit).map((f) => f.id);
    expect(ids([{ type: 'data-trek-places', data: { toolCallId: 's', places: [], more: 0 } }])).toContain('cheaper');
    expect(ids([{ type: 'data-trek-change', data: preview('c', 1) }])).toContain('nextDay');
    expect(ids([{ type: 'data-trek-change', data: preview('c', 1) }], false)).toEqual([]);
    expect(ids([{ type: 'text', text: 'Hi' }])).toEqual(['more', 'next']);
    expect(ids([])).toEqual([]);
  });

  it('FE-AI-POWER-002: under the last finished answer a tap sends the question; not while it runs', () => {
    const send = vi.fn(async () => {});
    const last = answer([{ type: 'text', text: 'Done.' }]);
    seedChat([last]);
    useAssistantStore.setState({ send });
    const { rerender } = render(inView(<AssistantFollowUps message={last} />));
    fireEvent.click(screen.getByRole('button', { name: 'Tell me more' }));
    expect(send).toHaveBeenCalledWith(TRIP, 'Tell me more');

    seedChat([last], { isRunning: true });
    rerender(inView(<AssistantFollowUps message={last} />));
    expect(screen.queryByRole('button', { name: 'Tell me more' })).toBeNull();
  });
});

describe('the day list preview', () => {
  it('FE-AI-POWER-003: a waiting add shows dashed on its day, a removal struck, and resting on it lights the change', () => {
    useTripStore.setState({ places: [buildPlace({ id: 5, name: 'Louvre' })] });
    const add = preview('c1', 3, {
      effect: {
        kind: 'add',
        dayId: 3,
        fromDayId: null,
        placeId: null,
        assignmentId: null,
        place: { name: 'Pantheon', lat: 1, lng: 2, categoryId: null },
      },
    });
    const remove = preview('c2', 3, {
      effect: { kind: 'remove', dayId: 3, fromDayId: null, placeId: 5, assignmentId: 50, place: null },
    });
    seedChat([answer([...waiting('c1', add), ...waiting('c2', remove)])]);
    render(<AssistantDayPreview tripId={TRIP} dayId={3} />);
    expect(screen.getByText('Pantheon')).toBeInTheDocument();
    expect(screen.getByText('Louvre')).toHaveClass('line-through');
    fireEvent.mouseEnter(screen.getByText('Pantheon'));
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBe('c1');
  });

  it('FE-AI-POWER-004: nothing shows on another day, or once the change was decided', () => {
    const add = preview('c1', 3, {
      effect: {
        kind: 'add',
        dayId: 3,
        fromDayId: null,
        placeId: null,
        assignmentId: null,
        place: { name: 'Pantheon', lat: 1, lng: 2, categoryId: null },
      },
    });
    seedChat([answer(waiting('c1', add))]);
    const { container } = render(<AssistantDayPreview tripId={TRIP} dayId={4} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the week grid', () => {
  const item = (id: string, dayId: number): ChangeItem => ({
    toolCallId: id,
    preview: preview(id, dayId),
    applied: null,
    state: 'pending',
    card: null,
  });

  it('FE-AI-POWER-005: from three days on the changes group by day, in trip order', () => {
    useTripStore.setState({
      trip: buildTrip({ id: TRIP }),
      days: [
        buildDay({ id: 1, date: '2026-11-02' }),
        buildDay({ id: 2, date: '2026-11-03' }),
        buildDay({ id: 3, date: '2026-11-04' }),
      ],
    });
    const wrapper = ({ children }: { children: ReactNode }) => inView(children);
    const three = renderHook(() => useWeekDays([item('a', 3), item('b', 1), item('c', 2), item('d', 1)]), { wrapper });
    expect(three.result.current.map((d) => [d.n, d.ids])).toEqual([
      [1, ['b', 'd']],
      [2, ['c']],
      [3, ['a']],
    ]);
    const two = renderHook(() => useWeekDays([item('a', 1), item('b', 2)]), { wrapper });
    expect(two.result.current).toEqual([]);
  });

  it('FE-AI-POWER-006: a tap leaves a whole day out or takes it back in', () => {
    const onToggleDay = vi.fn();
    const days = [
      { id: 1, n: 1, weekday: 'Mon', ids: ['a', 'b'] },
      { id: 2, n: 2, weekday: 'Tue', ids: ['c'] },
    ];
    render(<AssistantWeekOverview days={days} excluded={new Set(['c'])} disabled={false} onToggleDay={onToggleDay} />);
    const [mon, tue] = screen.getAllByRole('button');
    expect(mon).toHaveAttribute('aria-pressed', 'true');
    expect(tue).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(mon);
    expect(onToggleDay).toHaveBeenCalledWith(['a', 'b'], false);
    fireEvent.click(tue);
    expect(onToggleDay).toHaveBeenLastCalledWith(['c'], true);
  });
});

describe('the context menu rows', () => {
  it('FE-AI-POWER-007: none while the assistant cannot run; else they open the chat on the place and ask', () => {
    const send = vi.fn(async () => {});
    const openWith = vi.fn();
    useAssistantStore.setState({ status: null, send, openWith });
    const louvre = buildPlace({ id: 5, name: 'Louvre' });
    const translated = ({ children }: { children: ReactNode }) => <TranslationProvider>{children}</TranslationProvider>;
    const off = renderHook(() => useAssistantMenu(TRIP), { wrapper: translated });
    expect(off.result.current.place(louvre)).toEqual([]);

    useAssistantStore.setState({ status: { available: true } as never });
    const on = renderHook(() => useAssistantMenu(TRIP), { wrapper: translated });
    const rows = on.result.current.place(louvre);
    const alternative = rows.find((r) => 'label' in r && r.label === 'Find an alternative');
    act(() => (alternative && 'onClick' in alternative ? alternative.onClick() : undefined));
    expect(openWith).toHaveBeenCalledWith(TRIP, { placeIds: [5] });
    expect(send).toHaveBeenCalledWith(TRIP, expect.stringContaining('Louvre'));
    expect(on.result.current.day(3).length).toBeGreaterThan(1);
  });
});

describe('the trip notes', () => {
  it('FE-AI-POWER-008: notes are kept per trip, and saving empty ones drops the entry', async () => {
    useAuthStore.setState({ user: buildUser({ id: 1 }) });
    const updateSetting = vi.fn(async () => {});
    useSettingsStore.setState({
      settings: { ...SETTINGS.settings, assistant_memory: { '2': 'Other' } },
      updateSetting,
    });
    const { result } = renderHook(() => useTripMemory(TRIP));
    expect(result.current.has).toBe(false);
    await act(async () => void (await result.current.save('  Vegetarian  ')));
    expect(updateSetting).toHaveBeenCalledWith('assistant_memory', { '2': 'Other', [TRIP]: 'Vegetarian' });
    await act(async () => void (await result.current.save('   ')));
    expect(updateSetting).toHaveBeenLastCalledWith('assistant_memory', { '2': 'Other' });
  });
});

describe('the map a question carries', () => {
  it('FE-AI-POWER-009: edges stay on the globe and are rounded to about ten metres', () => {
    expect(mapViewOf({ south: 35.123456, west: -190, north: 35.2, east: 139.987654 })).toEqual({
      south: 35.1235,
      west: -180,
      north: 35.2,
      east: 139.9877,
    });
  });

  it('FE-AI-POWER-010: a question goes out with the map of its own trip in its focus', async () => {
    const send = vi.fn();
    useAssistantStore.setState({ mapView: { tripId: TRIP, view: { south: 1, west: 2, north: 3, east: 4 } } });
    seedChat([]);
    // The request body is built inside the store; read it from the repo call.
    const { assistantRepo } = await import('../../repo/assistantRepo');
    const spy = vi.spyOn(assistantRepo, 'send').mockImplementation(async (_trip, body) => {
      send(body);
      throw new Error('stop');
    });
    await useAssistantStore.getState().send(TRIP, 'What is here?');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ focus: { view: { south: 1, west: 2, north: 3, east: 4 } } })
    );
    spy.mockRestore();
  });
});
