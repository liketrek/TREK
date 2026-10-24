// FE-TP-DAYCLEAR-001 to FE-TP-DAYCLEAR-002
//
// Taking every place off a day, driven straight through useDayClear. The store's
// writes are recorded stand-ins, so each case can read what the undo puts back.
import { act, renderHook } from '@testing-library/react';
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import { useDayClear } from './useDayClear';

type Options = Parameters<typeof useDayClear>[0];
type Undo = () => Promise<void>;

const lake = buildPlace({ id: 1, name: 'Lake' });
const castle = buildPlace({ id: 2, name: 'Castle' });

let writes: Record<string, ReturnType<typeof vi.fn>>;
let fixed: Options;

beforeEach(() => {
  vi.clearAllMocks();
  resetAllStores();
  writes = {
    clearDayAssignments: vi.fn(async () => undefined),
    assignPlaceToDay: vi.fn(async (_trip: number, _day: number, placeId: number) => ({ id: 500 + placeId })),
    setAssignmentTimes: vi.fn(async () => undefined),
    setAssignmentNotes: vi.fn(async () => undefined),
    setAssignmentEndDay: vi.fn(async () => undefined),
    setAssignmentRouteExcluded: vi.fn(async () => undefined),
    setAssignmentParticipants: vi.fn(async () => undefined),
    setAssignmentLegMode: vi.fn(async () => undefined),
  };
  useTripStore.setState({
    ...writes,
    days: [buildDay({ id: 10, day_number: 1 })],
    assignments: {
      10: [
        buildAssignment({ id: 102, day_id: 10, place: castle, order_index: 1, notes: 'Tickets', end_day: true }),
        buildAssignment({
          id: 101,
          day_id: 10,
          place: lake,
          order_index: 0,
          assignment_time: '09:00',
          assignment_end_time: '10:00',
          leg_transport_mode: 'driving',
          participants: [{ user_id: 4, username: 'Lena' }],
        }),
      ],
    },
  } as never);
  fixed = {
    tripId: 42,
    days: [buildDay({ id: 10, day_number: 1 })],
    canEditDays: true,
    t: (key) => key,
    locale: 'en',
    toast: { error: vi.fn() },
    roadtripVias: { byDay: {}, reanchor: vi.fn(async () => undefined) },
    updateRouteForDay: vi.fn(),
    pushUndo: vi.fn(),
  };
});

async function clearDay() {
  const { result } = renderHook(() => useDayClear(fixed));
  act(() => {
    result.current.handleClearDay(10);
  });
  await act(async () => {
    await result.current.confirmClearDay();
  });
  const call = vi.mocked(fixed.pushUndo).mock.lastCall;
  if (!call) throw new Error('nothing was offered for undo');
  return call;
}

describe('useDayClear', () => {
  it('FE-TP-DAYCLEAR-001: the undo plans the places back in their order, each with what its visit carried', async () => {
    const [label, undo, dayIds, placeIds] = await clearDay();
    expect(writes.clearDayAssignments).toHaveBeenCalledWith(42, 10);
    expect(label).toBe('undo.clearDay');
    expect(dayIds).toEqual([10]);
    expect(placeIds).toEqual([1, 2]);

    await act(async () => {
      await (undo as Undo)();
    });

    expect(writes.assignPlaceToDay.mock.calls).toEqual([
      [42, 10, 1, 0],
      [42, 10, 2, 1],
    ]);
    expect(writes.setAssignmentTimes).toHaveBeenCalledWith(42, 10, 501, { place_time: '09:00', end_time: '10:00' });
    expect(writes.setAssignmentLegMode).toHaveBeenCalledWith(42, 10, 501, 'driving');
    expect(writes.setAssignmentParticipants).toHaveBeenCalledWith(42, 10, 501, [4]);
    expect(writes.setAssignmentNotes).toHaveBeenCalledWith(42, 10, 502, 'Tickets');
    expect(writes.setAssignmentEndDay).toHaveBeenCalledWith(42, 10, 502, true);
    expect(writes.setAssignmentNotes).toHaveBeenCalledTimes(1);
  });

  it('FE-TP-DAYCLEAR-002: a stop the server would not plan again is left out of the rest of its undo', async () => {
    writes.assignPlaceToDay.mockResolvedValueOnce(undefined);
    const [, undo] = await clearDay();

    await act(async () => {
      await (undo as Undo)();
    });

    expect(writes.setAssignmentTimes).not.toHaveBeenCalled();
    expect(writes.setAssignmentNotes).toHaveBeenCalledWith(42, 10, 502, 'Tickets');
  });
});
