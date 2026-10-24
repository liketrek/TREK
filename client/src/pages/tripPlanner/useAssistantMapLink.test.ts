/**
 * FE-PLANNER-AI-MAP-001 to FE-PLANNER-AI-MAP-009
 *
 * The planner's link between the assistant and its map: which suggestions
 * stand as ghosts and which mark a real pin, when the map may move on its
 * own (setting, lock, reduced motion, the phone's folded chat), the "before"
 * view of an applied block, the pop of a place that arrives, and the routes
 * the chat's cards draw beside them.
 */
import { act, renderHook } from '@testing-library/react';
import type { AssistantMessage, AssistantMessagePart, TourRouteCard, Trip } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HIKE } from '../../../tests/helpers/assistantTour';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Assignment, AssignmentsMap, Category, Place } from '../../types';
import { useAssistantCompareView, useAssistantMapLink } from './useAssistantMapLink';

const TRIP = 4;
const reducedMedia = (query: string) => ({ matches: true, media: query }) as MediaQueryList;

function place(id: number, over: Partial<Place> = {}): Place {
  return { id, trip_id: TRIP, name: `Place ${id}`, lat: 41 + id / 100, lng: 12, category_id: 1, ...over } as Place;
}

function visit(id: number, dayId: number, placeId = id * 10): Assignment {
  const stop = { id: placeId, name: 'x', lat: 41, lng: 12 };
  return { id, day_id: dayId, place_id: placeId, order_index: 0, place: stop } as Assignment;
}

function held(id: string, effect: object, approval: object = {}, card?: TourRouteCard): AssistantMessagePart[] {
  return [
    { type: 'tool-call', toolCallId: id, toolName: 'x', args: {}, approval: { id, ...approval } },
    {
      type: 'data-trek-change',
      data: {
        toolCallId: id,
        verbKey: 'addPlace',
        subject: 'x',
        rows: [],
        dayId: 3,
        placeIds: [],
        undoable: true,
        effect,
        ...(card ? { card } : {}),
      },
    } as AssistantMessagePart,
  ];
}

const NEW = {
  kind: 'add',
  dayId: 3,
  fromDayId: null,
  placeId: null,
  assignmentId: null,
  place: { name: 'Pantheon', lat: 41.9, lng: 12.48, categoryId: 1 },
};
const ON_MAP = { kind: 'add', dayId: 3, fromDayId: null, placeId: 1, assignmentId: null, place: null };
const FILTERED = { kind: 'add', dayId: 3, fromDayId: null, placeId: 2, assignmentId: null, place: null };

function setMessages(parts: AssistantMessagePart[], over: Partial<ReturnType<typeof chatOf>> = {}) {
  const message: AssistantMessage = {
    id: 'msg-1',
    role: 'assistant',
    parts,
    status: 'awaiting_approval',
    createdAt: '2026-10-21T08:00:00.000Z',
  };
  useAssistantStore.setState((s) => ({ byTrip: { [TRIP]: { ...chatOf(s, TRIP), messages: [message], ...over } } }));
}

interface Props {
  isMobile?: boolean;
  mapLocked?: boolean;
  mapPlaces?: { id: number }[];
}

function link(selectDay = vi.fn(), initial: Props = {}) {
  return renderHook(
    (props: Props) =>
      useAssistantMapLink({
        tripId: TRIP,
        isMobile: props.isMobile ?? false,
        mapLocked: props.mapLocked ?? false,
        mapPlaces: props.mapPlaces ?? [{ id: 1 }],
        assignments: { 3: [visit(1, 3, 1)] },
        markersLocked: false,
        selectDay,
      }),
    { initialProps: initial }
  );
}

beforeEach(() => {
  useAssistantStore.setState({
    window: { open: true, minimized: false },
    byTrip: {},
    lastApplied: null,
    mapLink: null,
    camera: null,
    preview: null,
    windowRect: null,
  });
  useTripStore.setState({
    trip: { id: TRIP } as Trip,
    places: [place(1), place(2)],
    categories: [{ id: 1, name: 'Sights', color: '#3366ff', icon: 'Landmark' } as Category],
  });
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, assistant_map_follow: true } }));
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }) as MediaQueryList);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useAssistantMapLink: ghosts', () => {
  it('FE-PLANNER-AI-MAP-001: a new place is a ghost in its colour, a place on the map pulses, a filtered one is a ghost', () => {
    setMessages([...held('a', NEW), ...held('b', ON_MAP), ...held('c', FILTERED)]);
    const { result } = link();
    expect(result.current.assistantGhosts).toEqual([
      { id: 'a', lat: 41.9, lng: 12.48, name: 'Pantheon', color: '#3366ff', icon: 'Landmark' },
      { id: 'c', lat: 41.02, lng: 12, name: 'Place 2', color: '#3366ff', icon: 'Landmark' },
    ]);

    act(() => useAssistantStore.getState().setMapHover(TRIP, 'b', 'card'));
    expect(result.current.assistantHoveredId).toBe('b');
    expect(result.current.assistantPulsePlaceId).toBe(1);

    act(() => result.current.onAssistantGhostHover?.('a'));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 'a', source: 'map' });
    expect(result.current.assistantPulsePlaceId).toBeNull();
  });

  it('FE-PLANNER-AI-MAP-002: a found place under the pointer shows as a marked pin of its own', () => {
    const { result } = link();
    const pin = { tripId: TRIP, ref: 's:0', lat: 41.5, lng: 12.5, name: 'Da Enzo' };
    act(() => useAssistantStore.getState().setPreviewPin(pin));
    expect(result.current.assistantGhosts).toEqual([{ id: 'preview:s:0', lat: 41.5, lng: 12.5, name: 'Da Enzo' }]);
    expect(result.current.assistantHoveredId).toBe('preview:s:0');
  });
});

describe('useAssistantMapLink: moves of its own', () => {
  it('FE-PLANNER-AI-MAP-003: a block that finishes arriving frames the map once; one waiting at mount does not', () => {
    setMessages(held('old', NEW));
    const { rerender } = link();
    expect(useAssistantStore.getState().camera).toBeNull();

    act(() => setMessages(held('new', NEW), { isRunning: true }));
    rerender({});
    expect(useAssistantStore.getState().camera).toBeNull();
    act(() => setMessages(held('new', NEW), { isRunning: false }));
    rerender({});
    expect(useAssistantStore.getState().camera).toMatchObject({ tripId: TRIP, mode: 'fit', why: 'auto', seq: 1 });
    rerender({});
    expect(useAssistantStore.getState().camera?.seq).toBe(1);
  });

  it.each([
    [
      'the setting is off',
      () => useSettingsStore.setState((s) => ({ settings: { ...s.settings, assistant_map_follow: false } })),
      {},
    ],
    ['the desktop map is locked', () => undefined, { mapLocked: true }],
    ['motion is reduced', () => vi.stubGlobal('matchMedia', reducedMedia), {}],
    ['the phone shows the chat, not the map', () => undefined, { isMobile: true }],
  ])('FE-PLANNER-AI-MAP-004: no move of its own when %s', (_why, arrange, props: Props) => {
    arrange();
    const { rerender } = link(vi.fn(), props);
    act(() => useAssistantStore.getState().requestCamera(TRIP, [[1, 1]], 'pan', 'user'));
    const userSeq = useAssistantStore.getState().camera?.seq;
    act(() =>
      setMessages([], {
        live: {
          activity: { toolCallId: 's', label: 'Monti', area: { type: 'point', lat: 41.9, lng: 12.49, radiusM: 500 } },
        },
      })
    );
    rerender(props);
    expect(useAssistantStore.getState().camera?.seq).toBe(userSeq);
  });

  it('FE-PLANNER-AI-MAP-005: the area a step searches is framed, at most every two seconds; the phone follows once the chat is folded', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T08:00:00Z'));
    useAssistantStore.setState({ window: { open: true, minimized: true } });
    const area = (lat: number) => ({ type: 'point' as const, lat, lng: 12.49, radiusM: 500 });
    const { rerender } = link(vi.fn(), { isMobile: true });

    act(() => setMessages([], { live: { activity: { toolCallId: 's1', label: 'Monti', area: area(41.9) } } }));
    rerender({ isMobile: true });
    expect(useAssistantStore.getState().camera).toMatchObject({ why: 'auto', seq: 1 });

    act(() => setMessages([], { live: { activity: { toolCallId: 's2', label: 'Esquilino', area: area(41.89) } } }));
    rerender({ isMobile: true });
    expect(useAssistantStore.getState().camera?.seq).toBe(1);

    vi.setSystemTime(new Date('2026-10-21T08:00:03Z'));
    act(() => setMessages([], { live: { activity: { toolCallId: 's3', label: 'Celio', area: area(41.88) } } }));
    rerender({ isMobile: true });
    expect(useAssistantStore.getState().camera?.seq).toBe(2);
  });
});

describe('useAssistantMapLink: after applying', () => {
  it('FE-PLANNER-AI-MAP-006: the new place keeps its ghost until it is in the trip, then pops once and its day is picked', () => {
    vi.useFakeTimers();
    const selectDay = vi.fn();
    const receipt: AssistantMessagePart = {
      type: 'data-trek-applied',
      data: { toolCallId: 'a', entity: 'place', ids: [77], dayId: 3, undoUntil: null },
    };
    const { result, rerender } = link(selectDay);
    act(() => {
      setMessages([...held('a', NEW, { approved: true }), receipt]);
      useAssistantStore.setState({ lastApplied: { tripId: TRIP, applied: receipt.data } });
    });
    rerender({});
    expect(result.current.assistantGhosts?.map((g) => g.id)).toEqual(['a']);
    expect(result.current.poppedPlaceIds).toEqual([]);
    expect(selectDay).not.toHaveBeenCalled();

    act(() => useTripStore.setState((s) => ({ places: [...s.places, place(77)] })));
    rerender({});
    expect(result.current.assistantGhosts).toEqual([]);
    expect(result.current.poppedPlaceIds).toEqual([77]);
    expect(selectDay).toHaveBeenCalledOnce();
    expect(selectDay).toHaveBeenCalledWith(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.poppedPlaceIds).toEqual([]);
    rerender({});
    expect(selectDay).toHaveBeenCalledOnce();
  });

  function arrive(toolCallId: string, placeId: number, dayId: number) {
    const receipt: AssistantMessagePart = {
      type: 'data-trek-applied',
      data: { toolCallId, entity: 'place', ids: [placeId], dayId, undoUntil: null },
    };
    act(() => useAssistantStore.setState({ lastApplied: { tripId: TRIP, applied: receipt.data } }));
  }

  it('FE-PLANNER-AI-MAP-006b: a block picks one day once it has run, the day of its last change', () => {
    useTripStore.setState((s) => ({ places: [...s.places, place(77), place(78), place(79)] }));
    const selectDay = vi.fn();
    act(() => setMessages([], { isRunning: true }));
    const { result, rerender } = link(selectDay);

    arrive('a', 77, 3);
    rerender({});
    arrive('b', 78, 3);
    rerender({});
    arrive('c', 79, 5);
    rerender({});
    expect(result.current.poppedPlaceIds).toEqual([79]);
    expect(selectDay).not.toHaveBeenCalled();

    act(() => setMessages([], { isRunning: false }));
    rerender({});
    expect(selectDay).toHaveBeenCalledOnce();
    expect(selectDay).toHaveBeenCalledWith(5);
  });

  it('FE-PLANNER-AI-MAP-006c: with "map follows the assistant" off the place pops but no day is picked', () => {
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, assistant_map_follow: false } }));
    useTripStore.setState((s) => ({ places: [...s.places, place(77)] }));
    const selectDay = vi.fn();
    const { result, rerender } = link(selectDay);

    arrive('a', 77, 3);
    rerender({});
    expect(result.current.poppedPlaceIds).toEqual([77]);
    expect(selectDay).not.toHaveBeenCalled();
  });
});

describe('useAssistantCompareView', () => {
  it('FE-PLANNER-AI-MAP-007: "before" shows the snapshot days without the places the block made, and locks the pins', () => {
    const view: AssignmentsMap = { 3: [visit(1, 3), visit(9, 3)], 5: [visit(2, 5)] };
    const places = [place(1), place(77)];
    const render = () =>
      renderHook(() => useAssistantCompareView({ tripId: TRIP, assignments: view, storedAssignments: view, places }));

    const after = render();
    expect(after.result.current).toEqual({ assignments: view, places, markersLocked: false });

    setMessages([], {
      compare: {
        blockKey: 'a',
        mode: 'before',
        snapshot: { 3: [visit(1, 3)] },
        newPlaceCalls: ['a'],
        addedPlaceIds: [77],
      },
    });
    const before = render();
    expect(before.result.current.markersLocked).toBe(true);
    expect(before.result.current.assignments[3]?.map((v) => v.id)).toEqual([1]);
    expect(before.result.current.assignments[5]).toBe(view[5]);
    expect(before.result.current.places.map((p) => p.id)).toEqual([1]);
  });
});

describe("useAssistantMapLink: the chat's routes", () => {
  it('FE-PLANNER-AI-MAP-008: a held tour whose card draws its way stands as that line, not as a pin at its start', () => {
    setMessages([...held('t1', NEW, {}, { ...HIKE, source: 'pending' }), ...held('a', NEW)]);
    const { result } = link();
    expect(result.current.assistantGhosts?.map((g) => g.id)).toEqual(['a']);
    expect(result.current.assistantRouteLines?.map((line) => line.id)).toEqual(['t1:pending:route']);
    expect(result.current.routeProfileFocus).toBeNull();

    act(() => result.current.onAssistantRouteHover?.('t1'));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 't1', source: 'map' });
    expect(result.current.assistantRouteLines?.[0]?.hot).toBe(true);
  });

  it('FE-PLANNER-AI-MAP-009: a trip place a card points at pulses its own pin; one off the map shows as a pin of its own', () => {
    const { result } = link();
    const spot = { tripId: TRIP, ref: 'r:0', lat: 41.01, lng: 12, name: 'Place 1' };
    act(() => useAssistantStore.getState().setPreviewPin({ ...spot, placeId: 1 }));
    expect(result.current.assistantGhosts).toEqual([]);
    expect(result.current.assistantPulsePlaceId).toBe(1);
    expect(result.current.assistantHoveredId).toBeNull();

    act(() => useAssistantStore.getState().setPreviewPin({ ...spot, placeId: 2 }));
    expect(result.current.assistantGhosts).toEqual([{ id: 'preview:r:0', lat: 41.01, lng: 12, name: 'Place 1' }]);
    expect(result.current.assistantPulsePlaceId).toBeNull();
  });
});
