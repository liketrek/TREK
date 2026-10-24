// FE-TOUR-STAGE-SPREAD-010 to FE-TOUR-STAGE-SPREAD-016, FE-TOUR-STAGE-SPREAD-024 and
// FE-TOUR-STAGE-SPREAD-025: putting a multi-day tour on a day through the plan's one path, whole or
// a stage a day from it on, asked first where no menu asked (MDT-02), the road trip's vias kept on
// their legs.
import { act, renderHook } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import type { Assignment, AssignmentsMap } from '../../types';
import { useTourDayChoice } from './useTourDayChoice';

type Options = Parameters<typeof useTourDayChoice>[0];
type Undo = () => Promise<void>;

const DAYS = [buildDay({ id: 1 }), buildDay({ id: 2 }), buildDay({ id: 3 })];
const stops = ['stop-a', 'stop-b', 'stop-c', 'stop-end'].map((key) => ({ key, lat: 47, lng: 11 }));
const TOURS = [
  { place_id: 9, name: 'Hut to hut', stage_stops: stops },
  { place_id: 5, name: 'Lake loop', stage_stops: null },
] as unknown as TourListItem[];
const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key);

let writes: Record<string, Mock>;
let options: Options;

function seed(assignments: AssignmentsMap) {
  seedStore(useTripStore, { ...writes, days: DAYS, assignments, selectedDayId: 1 } as never);
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  writes = {
    assignPlaceToDay: vi.fn(async (_trip: number, dayId: number, placeId: number) => ({ id: 900 + dayId, placeId })),
    moveAssignment: vi.fn(async () => undefined),
    removeAssignment: vi.fn(async () => undefined),
    setAssignmentTimes: vi.fn(async () => undefined),
    setAssignmentNotes: vi.fn(async () => undefined),
    setAssignmentEndDay: vi.fn(async () => undefined),
    setAssignmentRouteExcluded: vi.fn(async () => undefined),
    setAssignmentParticipants: vi.fn(async () => undefined),
    setAssignmentLegMode: vi.fn(async () => undefined),
  };
  seed({ '1': [], '2': [], '3': [] });
  options = {
    tripId: 42,
    days: DAYS,
    tours: TOURS,
    selectedDayId: 1,
    t,
    toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
    pushUndo: vi.fn(),
    assignWhole: vi.fn(async () => true),
    updateRouteForDay: vi.fn(),
    onToursChanged: vi.fn(async () => undefined),
    roadtripVias: { byDay: {}, reanchor: vi.fn(async () => undefined) },
    viaLiesBefore: vi.fn(() => () => true),
  };
});

/** Lets the store writes change the day lists, the way the real ones do, so the stops can be counted. */
function writesThatLand() {
  const dayOf = (dayId: number) => useTripStore.getState().assignments[String(dayId)] ?? [];
  const setDay = (dayId: number, items: Assignment[]) =>
    useTripStore.setState((state) => ({ assignments: { ...state.assignments, [String(dayId)]: items } }));
  writes.removeAssignment.mockImplementation(async (_trip: number, dayId: number, id: number) => {
    setDay(
      dayId,
      dayOf(dayId).filter((item) => item.id !== id)
    );
  });
  writes.assignPlaceToDay.mockImplementation(
    async (_trip: number, dayId: number, placeId: number, position: number | null, key?: string) => {
      const rows = dayOf(dayId)
        .slice()
        .sort((a, b) => a.order_index - b.order_index);
      const added = buildAssignment({ id: 900 + dayId, day_id: dayId, place: buildPlace({ id: placeId }) });
      added.tour_stage_key = key ?? null;
      rows.splice(position ?? rows.length, 0, added);
      setDay(
        dayId,
        rows.map((item, index) => ({ ...item, order_index: index }))
      );
      return added;
    }
  );
}

const render = () => renderHook(() => useTourDayChoice(options));
const lastUndo = () => {
  const calls = vi.mocked(options.pushUndo).mock.calls;
  return calls[calls.length - 1]?.[1] as Undo;
};

describe('useTourDayChoice', () => {
  it('FE-TOUR-STAGE-SPREAD-010: a place, a day tour and a tour put whole on purpose go on at once', async () => {
    const { result } = render();
    await act(async () => {
      expect(await result.current.handleAssignToDay(77, 1, 3)).toBe(true);
      await result.current.handleAssignToDay(5, 2);
      await result.current.handleAssignToDay(9, 2, undefined, 'whole');
    });
    expect(options.assignWhole).toHaveBeenNthCalledWith(1, 77, 1, 3);
    expect(options.assignWhole).toHaveBeenNthCalledWith(2, 5, 2, undefined);
    expect(options.assignWhole).toHaveBeenNthCalledWith(3, 9, 2, undefined);
    expect(result.current.tourDayQuestion).toBeNull();
    expect(writes.assignPlaceToDay).not.toHaveBeenCalled();
  });

  it('FE-TOUR-STAGE-SPREAD-011: a multi-day tour asks first; whole goes the plan way, closing does nothing', async () => {
    const { result } = render();
    let pending: Promise<boolean> = Promise.resolve(false);
    act(() => {
      pending = result.current.handleAssignToDay(9, 2, 4);
    });
    expect(result.current.tourDayQuestion).toEqual({
      placeId: 9,
      dayId: 2,
      day: 2,
      name: 'Hut to hut',
      count: 3,
      fit: 2,
      wholeFree: true,
    });
    act(() => result.current.answerTourDay('whole'));
    expect(await pending).toBe(true);
    expect(options.assignWhole).toHaveBeenCalledWith(9, 2, 4);

    act(() => {
      pending = result.current.handleAssignToDay(9);
    });
    expect(result.current.tourDayQuestion?.dayId).toBe(1);
    act(() => result.current.answerTourDay(null));
    expect(await pending).toBe(false);
    expect(result.current.tourDayQuestion).toBeNull();
    expect(options.assignWhole).toHaveBeenCalledTimes(1);
    expect(writes.assignPlaceToDay).not.toHaveBeenCalled();
  });

  it('FE-TOUR-STAGE-SPREAD-012: stages go on day after day in order, the whole tour gives way, and it says so', async () => {
    const whole = buildAssignment({ id: 22, day_id: 2, place: buildPlace({ id: 9 }), tour_stage_key: null });
    seed({ '1': [], '2': [whole], '3': [] });
    const { result } = render();
    let pending: Promise<boolean> = Promise.resolve(false);
    act(() => {
      pending = result.current.handleAssignToDay(9, 1);
    });
    expect(result.current.tourDayQuestion?.wholeFree).toBe(true);
    act(() => result.current.answerTourDay('stages'));
    expect(await pending).toBe(true);

    expect(writes.removeAssignment).toHaveBeenCalledWith(42, 2, 22);
    expect(writes.assignPlaceToDay.mock.calls).toEqual([
      [42, 1, 9, null, 'stop-a'],
      [42, 2, 9, null, 'stop-b'],
      [42, 3, 9, null, 'stop-c'],
    ]);
    expect(options.assignWhole).not.toHaveBeenCalled();
    expect(options.onToursChanged).toHaveBeenCalled();
    expect(options.updateRouteForDay).toHaveBeenCalledWith(1);
    expect(options.toast.success).toHaveBeenCalledWith(
      'tours.stages.placed {"from":1} tours.stages.placedReplaced {"list":"2"}'
    );
    expect(options.pushUndo).toHaveBeenCalledWith('tours.stages.placeUndo', expect.any(Function), [2, 1, 3], [9]);
  });

  it('FE-TOUR-STAGE-SPREAD-013: one undo takes the whole spread back, the whole tour onto its day again', async () => {
    const whole = buildAssignment({ id: 22, day_id: 2, place: buildPlace({ id: 9 }), tour_stage_key: null });
    seed({ '1': [], '2': [whole], '3': [] });
    const { result } = render();
    await act(async () => {
      await result.current.handleAssignToDay(9, 1, undefined, 'stages');
    });
    expect(result.current.tourDayQuestion).toBeNull();
    writes.removeAssignment.mockClear();
    writes.assignPlaceToDay.mockClear();
    await act(async () => {
      await lastUndo()();
    });
    expect(writes.removeAssignment.mock.calls).toEqual([
      [42, 3, 903],
      [42, 2, 902],
      [42, 1, 901],
    ]);
    expect(writes.assignPlaceToDay).toHaveBeenCalledWith(42, 2, 9, 0, undefined);
  });

  it('FE-TOUR-STAGE-SPREAD-014: fewer days left than stages: the rest stay on no day, and the toast says so', async () => {
    const { result } = render();
    await act(async () => {
      expect(await result.current.handleAssignToDay(9, 2, undefined, 'stages')).toBe(true);
    });
    expect(writes.assignPlaceToDay.mock.calls).toEqual([
      [42, 2, 9, null, 'stop-a'],
      [42, 3, 9, null, 'stop-b'],
    ]);
    expect(options.toast.warning).toHaveBeenCalledWith(
      'tours.stages.placed {"from":2} tours.stages.placeStagesShort {"last":2}'
    );
    expect(options.toast.success).not.toHaveBeenCalled();
  });

  it('FE-TOUR-STAGE-SPREAD-015: a stage already on a day moves, and a move is undone by moving it back', async () => {
    const held = buildAssignment({ id: 31, day_id: 3, place: buildPlace({ id: 9 }), tour_stage_key: 'stop-a' });
    seed({ '1': [], '2': [], '3': [held] });
    const { result } = render();
    await act(async () => {
      await result.current.handleAssignToDay(9, 1, undefined, 'stages');
    });
    expect(writes.moveAssignment).toHaveBeenCalledWith(42, 31, 3, 1);
    expect(writes.assignPlaceToDay.mock.calls.map((call) => call[4])).toEqual(['stop-b', 'stop-c']);
    writes.moveAssignment.mockClear();
    await act(async () => {
      await lastUndo()();
    });
    expect(writes.moveAssignment).toHaveBeenCalledWith(42, 31, 1, 3);
  });

  it('FE-TOUR-STAGE-SPREAD-024: a whole tour taken off a road-trip day moves the vias behind it, and undo moves them back', async () => {
    const stop = (id: number, order: number, placeId: number) =>
      buildAssignment({ id, day_id: 2, order_index: order, place: buildPlace({ id: placeId }) });
    const whole = buildAssignment({ id: 22, day_id: 2, order_index: 1, place: buildPlace({ id: 9 }) });
    whole.tour_stage_key = null;
    seed({ '1': [], '2': [stop(50, 0, 100), whole, stop(51, 2, 101), stop(52, 3, 102)], '3': [] });
    writesThatLand();
    // One via on the leg into the tour, one on the leg after it (stop 51 to stop 52).
    const road = options.roadtripVias;
    road.byDay = {
      2: [
        { id: 701, day_id: 2, after_order_index: 0, lat: 1, lng: 1 },
        { id: 700, day_id: 2, after_order_index: 2, lat: 2, lng: 2 },
      ] as never,
    };
    // The real one writes the new anchors and loads the day's vias again, so the undo reads them from there.
    vi.mocked(road.reanchor).mockImplementation(async (dayId, plan) => {
      const moved = new Map(plan.vias.map((via) => [via.id, via.after_order_index] as const));
      road.byDay = {
        ...road.byDay,
        [dayId]: (road.byDay[dayId] ?? [])
          .filter((via) => !plan.remove.includes(via.id))
          .map((via) => ({ ...via, after_order_index: moved.get(via.id) ?? via.after_order_index })),
      };
    });
    const { result } = render();
    await act(async () => {
      expect(await result.current.handleAssignToDay(9, 1, undefined, 'stages')).toBe(true);
    });
    // The tour was the second of four stops: the via behind it now leaves the stop before it.
    expect(options.roadtripVias.reanchor).toHaveBeenCalledTimes(1);
    expect(options.roadtripVias.reanchor).toHaveBeenCalledWith(2, {
      vias: [{ id: 700, after_order_index: 1 }],
      remove: [],
    });

    vi.mocked(options.roadtripVias.reanchor).mockClear();
    await act(async () => {
      await lastUndo()();
    });
    // Stage 2 comes off the end of day 2 with no via behind it, then the whole tour goes back
    // second, and the via is counted from where the spread left it, not where it started.
    expect(writes.assignPlaceToDay).toHaveBeenLastCalledWith(42, 2, 9, 1, undefined);
    expect(options.roadtripVias.reanchor).toHaveBeenCalledTimes(1);
    expect(options.roadtripVias.reanchor).toHaveBeenCalledWith(2, {
      vias: [{ id: 700, after_order_index: 2 }],
      remove: [],
    });
    expect(useTripStore.getState().assignments['2'].map((item) => item.id)).toEqual([50, 902, 51, 52]);
  });

  it('FE-TOUR-STAGE-SPREAD-025: a tour whole on several days says it left all of them, and a via that cannot follow says why', async () => {
    const onDay = (id: number, dayId: number) =>
      buildAssignment({ id, day_id: dayId, place: buildPlace({ id: 9 }), tour_stage_key: null });
    seed({ '1': [], '2': [buildAssignment({ id: 60, day_id: 2 }), onDay(22, 2)], '3': [onDay(33, 3)] });
    options.roadtripVias.byDay = { 2: [{ id: 700, day_id: 2, after_order_index: 0, lat: 2, lng: 2 }] as never };
    vi.mocked(options.roadtripVias.reanchor).mockRejectedValueOnce(new Error('No network'));
    const { result } = render();
    await act(async () => {
      expect(await result.current.handleAssignToDay(9, 1, undefined, 'stages')).toBe(true);
    });
    expect(options.toast.success).toHaveBeenCalledWith(
      'tours.stages.placed {"from":1} tours.stages.placedReplacedMany {"list":"2, 3"}'
    );
    // The stages went on all the same; only the road kept its old anchors, and the plan says so once.
    expect(writes.assignPlaceToDay).toHaveBeenCalledTimes(3);
    expect(options.toast.error).toHaveBeenCalledTimes(1);
    expect(options.toast.error).toHaveBeenCalledWith('No network');
  });

  it('FE-TOUR-STAGE-SPREAD-016: a refused write stops the spread, says so, and the undo has what went before', async () => {
    writes.assignPlaceToDay.mockResolvedValueOnce({ id: 901 }).mockRejectedValueOnce(new Error('offline'));
    const { result } = render();
    await act(async () => {
      expect(await result.current.handleAssignToDay(9, 1, undefined, 'stages')).toBe(false);
    });
    expect(writes.assignPlaceToDay).toHaveBeenCalledTimes(2);
    expect(options.toast.error).toHaveBeenCalledWith('tours.stages.placeFailed');
    expect(options.toast.success).not.toHaveBeenCalled();
    await act(async () => {
      await lastUndo()();
    });
    expect(writes.removeAssignment).toHaveBeenCalledWith(42, 1, 901);
  });
});
