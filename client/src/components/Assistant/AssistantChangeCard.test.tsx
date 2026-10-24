/**
 * FE-AI-CARD-001 to FE-AI-CARD-013
 *
 * The change card: what it asks before anything is written, which decisions
 * one press sends, and what the receipt offers afterwards (the map, undo
 * while its window is open, and what a failed undo says). Then what ties it
 * to the map: a row lights its pin and the pin its row, the days it touches
 * read as a band, the phone hops to the map, and once applied the block can
 * be compared before and after and taken back as a whole.
 */
import type { AssistantApplied, AssistantChangeEffect, AssistantChangePreview } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAssignment, buildDay, buildPlace, buildTrip } from '../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import AssistantChangeCard from './AssistantChangeCard';
import AssistantCompareSwitch from './AssistantCompareSwitch';
import type { ChangeItem } from './assistantParts';
import { type AssistantView, AssistantViewContext } from './assistantViewContext';

const { addToast } = vi.hoisted(() => ({ addToast: vi.fn() }));
// The toasts a component raises, read as (message, type) the way the toast host takes them.
vi.mock('../shared/Toast', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../shared/Toast')>()),
  useToast: () => ({
    success: (message: string) => addToast(message, 'success', undefined),
    error: (message: string) => addToast(message, 'error', undefined),
    warning: (message: string) => addToast(message, 'warning', undefined),
    info: (message: string) => addToast(message, 'info', undefined),
  }),
}));

const TRIP = 4;
const INITIAL = useAssistantStore.getState();
const TRIP_INITIAL = useTripStore.getState();

const PANTHEON: AssistantChangeEffect = {
  kind: 'add',
  dayId: 3,
  fromDayId: null,
  placeId: null,
  assignmentId: null,
  place: { name: 'Pantheon', lat: 48.02, lng: 2.0, categoryId: null },
};

function preview(toolCallId: string, subject: string): AssistantChangePreview {
  return {
    toolCallId,
    verbKey: 'addPlace',
    subject,
    rows: [
      { op: 'add', labelKey: 'address', before: null, after: 'Kyoto' },
      { op: 'change', labelKey: 'time', before: '09:00', after: '10:30' },
    ],
    dayId: 3,
    placeIds: [],
    undoable: true,
  };
}

const pending = (id: string, subject: string): ChangeItem => ({
  toolCallId: id,
  preview: preview(id, subject),
  applied: null,
  state: 'pending',
  card: null,
});

const onTheMap = (id: string, subject: string, effect = PANTHEON): ChangeItem => ({
  ...pending(id, subject),
  preview: { ...preview(id, subject), effect },
});

function receipt(id: string, undoUntil: string | null): ChangeItem {
  const applied: AssistantApplied = { toolCallId: id, entity: 'place', ids: [9], dayId: 3, undoUntil };
  return { toolCallId: id, preview: preview(id, 'Kinkaku-ji'), applied, state: 'applied', card: null };
}

function renderCard(items: ChangeItem[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <AssistantChangeCard items={items} />
    </AssistantViewContext.Provider>
  );
}

function patchChat(next: Partial<ReturnType<typeof chatOf>>) {
  useAssistantStore.setState((s) => ({ byTrip: { ...s.byTrip, [TRIP]: { ...chatOf(s, TRIP), ...next } } }));
}

/** The planner holding this trip, with one stop on day 3. */
function plannerHere(tripId = TRIP) {
  const louvre = buildPlace({ id: 10, name: 'Louvre', lat: 48.0, lng: 2.0 });
  useTripStore.setState({
    trip: buildTrip({ id: tripId }),
    days: [buildDay({ id: 3, title: 'Rome' })],
    assignments: { 3: [buildAssignment({ id: 100, day_id: 3, place: louvre, assignment_time: '09:00' })] },
    places: [louvre],
  });
}

const future = () => new Date(Date.now() + 10 * 60_000).toISOString();

const decide = vi.fn<(tripId: number, decisions: { toolCallId: string; approved: boolean }[]) => Promise<void>>();
const undo = vi.fn<(tripId: number, toolCallId: string) => Promise<'undone' | 'stale' | 'failed'>>();
const undoBlock =
  vi.fn<(tripId: number, ids: readonly string[]) => Promise<{ done: number; stale: number; failed: number }>>();
const setCompare = vi.fn<(tripId: number, mode: 'before' | 'after') => void>();
const requestCamera = vi.fn();
const setMinimized = vi.fn();

beforeEach(() => {
  decide.mockResolvedValue(undefined);
  useAssistantStore.setState({ decide, undo, undoBlock, setCompare, requestCamera, setMinimized });
});

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  useTripStore.setState(TRIP_INITIAL, true);
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('AssistantChangeCard: deciding', () => {
  it('FE-AI-CARD-001: shows what changes in plain words, field by field, before anything is written', () => {
    renderCard([pending('c1', 'Kinkaku-ji')]);
    expect(screen.getByText('Kinkaku-ji')).toBeInTheDocument();
    expect(screen.getByText('Add place')).toBeInTheDocument();
    // The faint line says when, old to new; the address is for the planner, not the card.
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.queryByText('Kyoto')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Include this change' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('1 change is waiting for you');
  });

  it('FE-AI-CARD-002: one change applies or discards with one press', () => {
    renderCard([pending('c1', 'Kinkaku-ji')]);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(decide).toHaveBeenLastCalledWith(TRIP, [{ toolCallId: 'c1', approved: true }]);

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(decide).toHaveBeenLastCalledWith(TRIP, [{ toolCallId: 'c1', approved: false }]);
  });

  it('FE-AI-CARD-003: several changes each get a switch, and the button applies the ones left on in one request', () => {
    renderCard([pending('c1', 'Kinkaku-ji'), pending('c2', 'Ryoan-ji'), pending('c3', 'Nanzen-ji')]);
    expect(screen.getByRole('button', { name: 'Apply 3' })).toBeEnabled();

    const [, second] = screen.getAllByRole('button', { name: 'Include this change' });
    fireEvent.click(second as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Apply 2' }));

    expect(decide).toHaveBeenCalledTimes(1);
    expect(decide).toHaveBeenCalledWith(TRIP, [
      { toolCallId: 'c1', approved: true },
      { toolCallId: 'c2', approved: false },
      { toolCallId: 'c3', approved: true },
    ]);
  });

  it('FE-AI-CARD-004: nothing can be decided while the assistant is still answering', () => {
    patchChat({ isRunning: true });
    renderCard([pending('c1', 'Kinkaku-ji')]);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
  });
});

describe('AssistantChangeCard: the receipt', () => {
  it('FE-AI-CARD-005: an applied change shows on the map and can be undone until its window closes', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-21T08:00:00.000Z'));
    const onOpen = vi.fn();
    renderCard([receipt('c1', '2026-10-21T08:15:00.000Z')], { onOpen });

    expect(screen.getByRole('img', { name: 'Applied' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 9, dayId: null });
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(16 * 60_000);
    });
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('FE-AI-CARD-006: an undone change says so, a stale one explains why it stays', async () => {
    // The store marks what it took back; the card reads it from there.
    undo.mockImplementationOnce(async (_tripId, toolCallId) => {
      patchChat({ undone: { [toolCallId]: true } });
      return 'undone';
    });
    const first = renderCard([receipt('c1', future())]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    });
    expect(undo).toHaveBeenCalledWith(TRIP, 'c1');
    expect(screen.getByRole('img', { name: 'Undone' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    first.unmount();

    undo.mockResolvedValueOnce('stale');
    renderCard([receipt('c2', future())]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    });
    expect(addToast).toHaveBeenCalledWith('Changed in the meantime. Please adjust it by hand.', 'warning', undefined);
  });

  it('FE-AI-CARD-007: no map button where nothing can show it, and none of the receipt actions after a discard', () => {
    renderCard([receipt('c1', null), { ...pending('c2', 'Ryoan-ji'), state: 'discarded' }]);
    expect(screen.queryByRole('button', { name: 'Show on map' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    expect(screen.getByRole('img', { name: 'Discarded' })).toBeInTheDocument();
  });
});

describe('AssistantChangeCard: on the map', () => {
  it('FE-AI-CARD-008: resting on a row lights its pin, and a lit pin lights its row', () => {
    renderCard([onTheMap('c1', 'Pantheon'), pending('c2', 'Ryoan-ji')]);
    fireEvent.mouseEnter(screen.getByText('Pantheon'));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 'c1', source: 'card' });
    fireEvent.mouseLeave(screen.getByText('Pantheon'));
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();

    // A change the plan does not show has no pin to light.
    fireEvent.mouseEnter(screen.getByText('Ryoan-ji'));
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();

    const row = screen.getByText('Pantheon').closest('[class*="rounded-[12px]"]');
    expect(row).not.toBeNull();
    expect(row).not.toHaveClass('bg-surface-hover');
    act(() => useAssistantStore.setState({ mapLink: { tripId: TRIP, hoveredId: 'c1', source: 'map' } }));
    expect(row).toHaveClass('bg-surface-hover');
  });

  it('FE-AI-CARD-009: the head says whether the days still fit, without drawing the days again', () => {
    plannerHere();
    renderCard([onTheMap('c1', 'Pantheon')]);
    expect(screen.getByText(/Fits the time|to check/)).toBeInTheDocument();
    // The day list of the planner shows the suggestion; the card keeps to one line per change.
    expect(screen.getAllByText('Pantheon')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Show schedule' })).toBeNull();
  });

  it('FE-AI-CARD-010: no check while the planner holds another trip, or once nothing waits', () => {
    plannerHere(TRIP + 1);
    const first = renderCard([onTheMap('c1', 'Pantheon')]);
    expect(screen.queryByText(/Fits the time|to check/)).toBeNull();
    first.unmount();

    plannerHere();
    renderCard([{ ...onTheMap('c1', 'Pantheon'), state: 'applied' }]);
    expect(screen.queryByText(/Fits the time|to check/)).toBeNull();
  });

  it('FE-AI-CARD-011: on the phone the card hops to the map and frames what it would change', () => {
    plannerHere();
    const onOpen = vi.fn();
    const first = renderCard([onTheMap('c1', 'Pantheon')], { onOpen });
    expect(screen.queryByRole('button', { name: 'View on map' })).toBeNull();
    first.unmount();

    renderCard([onTheMap('c1', 'Pantheon')], { variant: 'fullscreen', onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'View on map' }));
    expect(requestCamera).toHaveBeenCalledWith(
      TRIP,
      [
        [48.02, 2.0],
        [48.0, 2.0],
      ],
      'fit',
      'user'
    );
    expect(setMinimized).toHaveBeenCalledWith(true);
  });
});

describe('AssistantChangeCard: the applied block', () => {
  const compare = (blockKey: string, mode: 'before' | 'after' = 'after') =>
    patchChat({ compare: { blockKey, mode, snapshot: { 3: [] }, newPlaceCalls: [], addedPlaceIds: [] } });

  it('FE-AI-CARD-012: before and after are there only for the block this session can compare, beside a map', () => {
    compare('c1');
    const onOpen = vi.fn();
    const first = renderCard([receipt('c1', null), receipt('c2', null)], { onOpen });
    expect(screen.getByRole('button', { name: 'After' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Before' }));
    expect(setCompare).toHaveBeenCalledWith(TRIP, 'before');
    first.unmount();

    const other = renderCard([receipt('c7', null), receipt('c8', null)], { onOpen });
    expect(screen.queryByRole('button', { name: 'Before' })).toBeNull();
    other.unmount();

    renderCard([receipt('c1', null), receipt('c2', null)]);
    expect(screen.queryByRole('button', { name: 'Before' })).toBeNull();
  });

  it('FE-AI-CARD-013: undo all takes back what still can be, and says how it went', async () => {
    const ids = ['c1', 'c2', 'c3'];
    const items = () => [receipt('c1', future()), receipt('c2', future()), receipt('c3', null)];
    const press = async () => {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Undo all' }));
      });
    };

    undoBlock.mockResolvedValueOnce({ done: 2, stale: 0, failed: 0 });
    const first = renderCard(items());
    await press();
    expect(undoBlock).toHaveBeenCalledWith(TRIP, ids.slice(0, 2));
    expect(addToast).toHaveBeenLastCalledWith('2 changes undone', 'success', undefined);

    undoBlock.mockResolvedValueOnce({ done: 1, stale: 1, failed: 0 });
    await press();
    expect(addToast).toHaveBeenLastCalledWith('1 undone, 1 changed since', 'warning', undefined);

    undoBlock.mockResolvedValueOnce({ done: 0, stale: 0, failed: 2 });
    await press();
    expect(addToast).toHaveBeenLastCalledWith('2 changes could not be undone', 'error', undefined);
    first.unmount();

    // One left to take back is the single undo button's job.
    patchChat({ undone: { c2: true } });
    renderCard(items());
    expect(screen.queryByRole('button', { name: 'Undo all' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });
});

describe('AssistantCompareSwitch', () => {
  it('follows whichever block is compared when it names none', () => {
    patchChat({ compare: { blockKey: 'c5', mode: 'before', snapshot: {}, newPlaceCalls: [], addedPlaceIds: [] } });
    render(<AssistantCompareSwitch tripId={TRIP} />);
    expect(screen.getByRole('button', { name: 'Before' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'After' }));
    expect(setCompare).toHaveBeenCalledWith(TRIP, 'after');
  });

  it("gives each side a thumb's room when tall", () => {
    patchChat({ compare: { blockKey: 'c5', mode: 'after', snapshot: {}, newPlaceCalls: [], addedPlaceIds: [] } });
    render(<AssistantCompareSwitch tripId={TRIP} tall />);
    expect(screen.getByRole('button', { name: 'Before' }).className).toContain('h-9');
    expect(screen.getByRole('button', { name: 'After' }).className).toContain('min-w-[44px]');
  });
});
