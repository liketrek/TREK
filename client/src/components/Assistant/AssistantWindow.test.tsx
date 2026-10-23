/**
 * FE-AI-WIN-001 to FE-AI-WIN-012
 *
 * The desktop window around the chat: when it shows at all, the button it
 * opens from, the trip picker outside a trip, closing that keeps the chat, and
 * Escape, which stops an answer before it closes anything (and leaves the
 * header's menu to itself), and where the focus goes on the way; a trip's head
 * offers the notes its turns read. The geometry is
 * useDragResize's and has its own tests; here it is a fixed rect.
 */
import type { AiStatusResponse } from '@trek/shared';
import { useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { tripRepo } from '../../repo/tripRepo';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import type { Trip } from '../../types';
import AssistantWindow from './AssistantWindow';
import type { EntityTarget } from './cards/cardTypes';

vi.mock('../../hooks/useDragResize', () => ({
  useDragResize: () => ({
    rect: { x: 600, y: 120, width: 400, height: 600 },
    active: false,
    handleProps: {},
    edgeProps: () => ({}),
    onKeyDown: () => {},
  }),
}));

vi.mock('./AssistantSurfaceLazy', () => ({
  default: ({
    tripId,
    tripTitle,
    density,
    onFocusDay,
    onOpen,
  }: {
    tripId: number;
    tripTitle: string;
    density?: string;
    onFocusDay?: (dayId: number) => void;
    onOpen?: (target: EntityTarget) => void;
  }) => (
    <div>
      <p>
        chat {tripId} {tripTitle}
      </p>
      <output data-testid="density">{density}</output>
      {onFocusDay && (
        <button type="button" onClick={() => onFocusDay(12)}>
          pick day
        </button>
      )}
      {onOpen && (
        <>
          <button type="button" onClick={() => onOpen({ kind: 'map', placeId: 7, dayId: null })}>
            open place
          </button>
          <button type="button" onClick={() => onOpen({ kind: 'tab', tab: 'finanzplan', params: { expense: '3' } })}>
            open tab
          </button>
          <button type="button" onClick={() => onOpen({ kind: 'page', path: '/atlas' })}>
            open page
          </button>
        </>
      )}
      <textarea aria-label="composer" />
    </div>
  ),
}));

const TRIP = { id: 4, title: 'Kyoto' };

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}
const INITIAL = useAssistantStore.getState();
const STATUS = { available: true, retention: { mode: 'days', days: 90 } } as AiStatusResponse;

const loadStatus = vi.fn(async () => {});
const resume = vi.fn(async () => {});
const cancel = vi.fn();

function seed(window: { open: boolean; minimized: boolean }, isRunning = false) {
  // A chat the test before unmounted stops itself on the way out; that call is not this test's.
  cancel.mockClear();
  useAssistantStore.setState({
    status: STATUS,
    window,
    loadStatus,
    resume,
    cancel,
    byTrip: { [TRIP.id]: { ...chatOf(useAssistantStore.getState(), TRIP.id), isRunning } },
  });
}

beforeEach(() => {
  vi.spyOn(tripRepo, 'list').mockResolvedValue({
    trips: [{ id: 9, title: 'Lisbon', start_date: '2026-10-01', end_date: '2026-12-01' } as Trip],
    archivedTrips: [],
  });
});

afterEach(() => {
  // Unmounted before the store gets its real actions back: a window still on screen would ask the real
  // loadStatus, whose failed request lands in a later case and hides the assistant there (status null).
  cleanup();
  useAssistantStore.setState(INITIAL, true);
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('AssistantWindow', () => {
  it('FE-AI-WIN-001: shows nothing at all without a connection, but asks for the status', () => {
    seed({ open: true, minimized: false });
    useAssistantStore.setState({ status: { ...STATUS, available: false } });
    const { container } = render(<AssistantWindow trip={TRIP} />);
    expect(container).toBeEmptyDOMElement();
    expect(loadStatus).toHaveBeenCalled();
  });

  it('FE-AI-WIN-002: closed, the planner shows the round button, and it opens the chat on this trip', () => {
    seed({ open: false, minimized: false });
    render(<AssistantWindow trip={TRIP} />);
    fireEvent.click(screen.getByRole('button', { name: 'Assistant' }));
    expect(screen.getByRole('dialog', { name: 'Assistant' })).toHaveTextContent('chat 4 Kyoto');
    expect(resume).toHaveBeenCalledWith(TRIP.id);
  });

  it('FE-AI-WIN-003: closed outside a trip, nothing floats', () => {
    seed({ open: false, minimized: false });
    const { container } = render(<AssistantWindow trip={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-WIN-004: outside a trip it asks which trip first, then chats there', async () => {
    seed({ open: true, minimized: false });
    render(<AssistantWindow trip={null} />);
    expect(screen.getByRole('dialog', { name: 'Which trip?' })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /Lisbon/ }));
    expect(screen.getByText('chat 9 Lisbon')).toBeInTheDocument();
  });

  it('FE-AI-WIN-005: closed while writing, the chat stays mounted and the round button breathes until it is opened', () => {
    seed({ open: true, minimized: true }, true);
    render(<AssistantWindow trip={TRIP} />);
    expect(screen.getByText('chat 4 Kyoto')).not.toBeVisible();
    const button = screen.getByRole('button', { name: 'Assistant' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(useAssistantStore.getState().window.minimized).toBe(false);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('FE-AI-WIN-006: Escape stops a running answer first and only then closes', () => {
    seed({ open: true, minimized: false }, true);
    render(<AssistantWindow trip={TRIP} />);
    const dialog = screen.getByRole('dialog', { name: 'Assistant' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(cancel).toHaveBeenCalledWith(TRIP.id);
    expect(useAssistantStore.getState().window.open).toBe(true);

    act(() =>
      useAssistantStore.setState({
        byTrip: { [TRIP.id]: { ...chatOf(useAssistantStore.getState(), TRIP.id), isRunning: false } },
      })
    );
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(useAssistantStore.getState().window.open).toBe(false);
  });

  it('FE-AI-WIN-007: the head has one close button, which hides the window and keeps the chat', () => {
    seed({ open: true, minimized: false });
    render(<AssistantWindow trip={TRIP} />);
    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(useAssistantStore.getState().window.minimized).toBe(true);
    expect(screen.getByText('chat 4 Kyoto')).not.toBeVisible();
  });

  it('FE-AI-WIN-012: a trip head offers the trip notes, which every turn on the trip reads', () => {
    seed({ open: true, minimized: false });
    render(<AssistantWindow trip={TRIP} />);
    expect(screen.getByRole('button', { name: 'Trip notes' })).toBeInTheDocument();
  });

  it('FE-AI-WIN-008: closing hands the focus to the round button, opening hands it back to the composer', async () => {
    seed({ open: true, minimized: false });
    render(<AssistantWindow trip={TRIP} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    const button = await screen.findByRole('button', { name: 'Assistant' });
    expect(button).toHaveFocus();
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByLabelText('composer')).toHaveFocus());
  });

  it("FE-AI-WIN-009: Escape in the header's menu closes the menu, not the window", async () => {
    seed({ open: true, minimized: false });
    render(<AssistantWindow trip={TRIP} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.keyDown(await screen.findByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(useAssistantStore.getState().window.open).toBe(true);
  });

  it('FE-AI-WIN-010: tells the map where it sits, is compact at 400 px wide, and picks days on screen', () => {
    seed({ open: true, minimized: false });
    const onFocusDay = vi.fn();
    const { unmount } = render(<AssistantWindow trip={TRIP} onFocusDay={onFocusDay} />);
    expect(useAssistantStore.getState().windowRect).toEqual({ x: 600, y: 120, width: 400, height: 600 });
    expect(screen.getByTestId('density')).toHaveTextContent('compact');
    fireEvent.click(screen.getByRole('button', { name: 'pick day' }));
    expect(onFocusDay).toHaveBeenCalledWith(12);
    unmount();
    expect(useAssistantStore.getState().windowRect).toBeNull();
  });

  it('FE-AI-WIN-011: opens through the planner on screen, keeps a trip it leaves, and opens a picked trip itself', async () => {
    seed({ open: true, minimized: false });
    const onOpen = vi.fn();
    const onScreen = render(<AssistantWindow trip={TRIP} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'open place' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 7, dayId: null });
    // Another page leaves the trip; the chat stays on it as if it had been picked.
    fireEvent.click(screen.getByRole('button', { name: 'open page' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/atlas' });
    onScreen.rerender(<AssistantWindow trip={null} onOpen={onOpen} />);
    expect(screen.getByText('chat 4 Kyoto')).toBeInTheDocument();
    onScreen.unmount();

    seed({ open: true, minimized: false });
    render(
      <>
        <AssistantWindow trip={null} onOpen={onOpen} />
        <Location />
      </>
    );
    fireEvent.click(await screen.findByRole('button', { name: /Lisbon/ }));
    fireEvent.click(screen.getByRole('button', { name: 'open tab' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/9?tab=finanzplan&expense=3');
    fireEvent.click(screen.getByRole('button', { name: 'open place' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/trips\/9$/);
    fireEvent.click(screen.getByRole('button', { name: 'open page' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/atlas');
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
