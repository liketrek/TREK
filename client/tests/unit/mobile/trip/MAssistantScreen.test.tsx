import type { AiStatusResponse } from '@trek/shared';
import { useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EntityTarget } from '../../../../src/components/Assistant/cards/cardTypes';
import MAssistantScreen from '../../../../src/mobile/screens/trip/assistant/MAssistantScreen';
import { chatOf, useAssistantStore } from '../../../../src/store/assistantStore';
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip';
import { act, cleanup, fireEvent, render, screen } from '../../../helpers/render';

// FE-MOB-ASSIST-001 to FE-MOB-ASSIST-015
//
// The phone's full-screen chat around the shared chat surface, which is
// replaced here: what is tested is the frame, the header and the way to the
// map and back.

const surface = vi.hoisted(() => ({
  onOpen: null as ((target: EntityTarget) => void) | null,
  onFocusDay: null as ((dayId: number) => void) | null,
  onRevealMap: null as (() => void) | null,
}));
const thread = vi.hoisted(() => ({
  threadId: 3 as number | null,
  threads: [{ id: 3, title: 'Temples on day 2', lastMessageAt: '2026-10-20T09:00:00.000Z' }],
  title: 'Temples on day 2' as string | null,
  isRunning: false,
  retentionNote: 'Chats are deleted after 90 days.',
  refreshThreads: vi.fn(),
  openThread: vi.fn(),
  newThread: vi.fn(),
  removeThread: vi.fn(async () => undefined),
  stop: vi.fn(),
}));

vi.mock('../../../../src/components/Assistant/AssistantSurfaceLazy', () => ({
  default: (props: {
    onOpen?: (target: EntityTarget) => void;
    onFocusDay?: (dayId: number) => void;
    onRevealMap?: () => void;
  }) => {
    surface.onOpen = props.onOpen ?? null;
    surface.onFocusDay = props.onFocusDay ?? null;
    surface.onRevealMap = props.onRevealMap ?? null;
    return <div data-testid="chat-surface" />;
  },
}));

vi.mock('../../../../src/components/Assistant/map/RoutePeekLazy', () => ({
  default: (props: { tripId: number }) => <div data-testid="route-peek-mount" data-trip={props.tripId} />,
}));

vi.mock('../../../../src/components/Assistant/useAssistantThread', () => ({
  useAssistantThread: () => thread,
}));

const INITIAL = useAssistantStore.getState();
const STATUS = { available: true, retention: { mode: 'days', days: 90 } } as AiStatusResponse;

function Location() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{`${pathname}${search}`}</output>;
}

function renderScreen(plannerOverrides = {}, shellOverrides = {}, { withLocation = false } = {}) {
  const planner = buildPlanner(plannerOverrides);
  const shell = buildShell(shellOverrides);
  const view = render(
    <>
      <MAssistantScreen planner={planner} shell={shell} />
      {withLocation && <Location />}
    </>,
    { initialEntries: ['/trips/1'] }
  );
  return { planner, shell, ...view };
}

beforeEach(() => {
  // Closing the screen takes its history entry back a tick later; that step stays queued here.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  window.history.replaceState(null, '');
  // The screen asks for the status itself; here it is already known.
  useAssistantStore.setState({
    status: STATUS,
    window: { open: true, minimized: false },
    loadStatus: vi.fn(async () => undefined),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  useAssistantStore.setState(INITIAL, true);
  vi.clearAllMocks();
});

describe('MAssistantScreen', () => {
  it('FE-MOB-ASSIST-001: shows nothing until the assistant has a connection to use', () => {
    useAssistantStore.setState({ status: { ...STATUS, available: false } });
    const { container } = renderScreen();
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-MOB-ASSIST-002: asks for the status once when the trip opens', () => {
    renderScreen();
    expect(useAssistantStore.getState().loadStatus).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-ASSIST-003: opens full screen with the chat, named after the conversation and the trip', () => {
    renderScreen();
    expect(screen.getByRole('dialog', { name: 'Assistant' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Temples on day 2' })).toBeInTheDocument();
    expect(screen.getByText('Japan 2026')).toBeInTheDocument();
    expect(screen.getByTestId('chat-surface')).toBeInTheDocument();
  });

  it('FE-MOB-ASSIST-004: the back button closes the chat', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(useAssistantStore.getState().window.open).toBe(false);
  });

  it('FE-MOB-ASSIST-005: the recent chats list switches the conversation and names how long chats are kept', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Recent chats' }));
    expect(thread.refreshThreads).toHaveBeenCalled();
    expect(screen.getByText('Chats are deleted after 90 days.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Temples on day 2/ }));
    expect(thread.openThread).toHaveBeenCalledWith(3);
  });

  it('FE-MOB-ASSIST-006: deleting the chat asks first', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete chat' }));
    expect(thread.removeThread).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(thread.removeThread).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-ASSIST-007: "Show on map" steps aside for the map, and the pill brings the chat back as it was', () => {
    const { planner, shell } = renderScreen({}, { trTab: 'listen', view: 'plan' });
    act(() => surface.onOpen?.({ kind: 'map', placeId: 42, dayId: null }));

    expect(useAssistantStore.getState().window).toEqual({ open: true, minimized: true });
    expect(shell.setTrTab).toHaveBeenCalledWith('plan');
    expect(shell.toggleView).toHaveBeenCalled();
    expect(planner.setSelectedPlaceId).toHaveBeenCalledWith(42);
    // Hidden, not gone: the answer being written keeps coming in.
    expect(screen.getByTestId('chat-surface')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }));
    expect(useAssistantStore.getState().window.minimized).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Assistant' })).toBeInTheDocument();
  });

  it("FE-MOB-ASSIST-015: the route's peek is mounted only while a route is shown, and the pill back closes it", () => {
    renderScreen({}, { trTab: 'plan', view: 'map' });
    expect(screen.queryByTestId('route-peek-mount')).not.toBeInTheDocument();
    // Over the map with no route shown (a place, a booking), the peek's code is not loaded.
    act(() => surface.onRevealMap?.());
    expect(screen.queryByTestId('route-peek-mount')).not.toBeInTheDocument();
    act(() => useAssistantStore.getState().setRoutePeek({ tripId: 2, toolCallId: 'c1' }));
    expect(screen.queryByTestId('route-peek-mount')).not.toBeInTheDocument();
    act(() => {
      useAssistantStore.getState().setRoutePeek({ tripId: 1, toolCallId: 'c1' });
      useAssistantStore.getState().setMapHover(1, 'c1', 'map');
    });
    expect(screen.getByTestId('route-peek-mount').dataset.trip).toBe('1');

    // Back in the chat the line the tap lit goes out with the peek.
    fireEvent.click(screen.getByRole('button', { name: 'Back to chat' }));
    expect(useAssistantStore.getState().routePeek).toBeNull();
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: 1, hoveredId: null, source: 'map' });
    expect(screen.queryByTestId('route-peek-mount')).not.toBeInTheDocument();
  });

  it('FE-MOB-ASSIST-009: a day picked in the chat is selected on the map, and the pill says where a step looks', () => {
    const { planner, shell } = renderScreen({}, { trTab: 'listen', view: 'plan' });
    act(() => surface.onFocusDay?.(7));
    expect(useAssistantStore.getState().window.minimized).toBe(true);
    expect(shell.setTrTab).toHaveBeenCalledWith('plan');
    expect(planner.handleSelectDay).toHaveBeenCalledWith(7, false);

    act(() =>
      useAssistantStore.setState((s) => ({
        byTrip: {
          ...s.byTrip,
          [planner.tripId]: {
            ...chatOf(s, planner.tripId),
            messages: [
              {
                id: 'msg-1',
                role: 'assistant',
                status: 'complete',
                createdAt: '2026-10-21T08:00:00.000Z',
                parts: [{ type: 'tool-call', toolCallId: 'c1', toolName: 'search_nearby_places', args: {} }],
              },
            ],
            live: { activity: { toolCallId: 'c1', label: 'Gion', area: null } },
          },
        },
      }))
    );
    expect(screen.getByRole('button', { name: 'Back to chat' })).toHaveTextContent('Searching near Gion');
  });

  it('FE-MOB-ASSIST-010: before the map moves to a found place, the chat steps aside', () => {
    const { shell } = renderScreen({}, { trTab: 'plan', view: 'plan' });
    act(() => surface.onRevealMap?.());
    expect(useAssistantStore.getState().window.minimized).toBe(true);
    expect(shell.toggleView).toHaveBeenCalled();
  });

  it('FE-MOB-ASSIST-011: while a block can be compared, its switch sits beside the pill over the map', () => {
    const { planner } = renderScreen({}, { trTab: 'plan', view: 'plan' });
    act(() => surface.onRevealMap?.());
    expect(screen.queryByRole('group', { name: 'Compare on the map' })).not.toBeInTheDocument();

    act(() =>
      useAssistantStore.setState((s) => ({
        byTrip: {
          ...s.byTrip,
          [planner.tripId]: {
            ...chatOf(s, planner.tripId),
            compare: { blockKey: 'c1', mode: 'after', snapshot: {}, newPlaceCalls: [], addedPlaceIds: [] },
          },
        },
      }))
    );
    expect(screen.getByRole('group', { name: 'Compare on the map' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'After' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-MOB-ASSIST-012: a day on the map is selected there after the chat stepped aside', () => {
    const { planner, shell } = renderScreen({}, { trTab: 'plan', view: 'plan' });
    act(() => surface.onOpen?.({ kind: 'map', placeId: null, dayId: 5 }));
    expect(useAssistantStore.getState().window.minimized).toBe(true);
    expect(shell.toggleView).toHaveBeenCalled();
    expect(planner.handleSelectDay).toHaveBeenCalledWith(5, false);
    expect(planner.setSelectedPlaceId).not.toHaveBeenCalled();
  });

  it('FE-MOB-ASSIST-013: a tab opens on its own list or chat part, with what it reads in the URL', () => {
    const { shell } = renderScreen({}, { trTab: 'plan', view: 'map' }, { withLocation: true });
    act(() => surface.onOpen?.({ kind: 'tab', tab: 'listen', sub: 'todo', params: { todo: '4' } }));
    expect(useAssistantStore.getState().window.minimized).toBe(true);
    expect(shell.setTrTab).toHaveBeenCalledWith('listen');
    expect(shell.setListsTab).toHaveBeenCalledWith('todo');
    expect(shell.toggleView).not.toHaveBeenCalled();
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/1?todo=4');

    act(() => surface.onOpen?.({ kind: 'tab', tab: 'collab', sub: 'polls' }));
    expect(shell.setTrTab).toHaveBeenLastCalledWith('collab');
    expect(shell.setCollabTab).toHaveBeenCalledWith('polls');
    // A sub-tab a tab does not have is left alone.
    act(() => surface.onOpen?.({ kind: 'tab', tab: 'collab', sub: 'packing' }));
    expect(shell.setCollabTab).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-ASSIST-014: another page leaves the trip, and the chat closes with it', () => {
    renderScreen({}, {}, { withLocation: true });
    act(() => surface.onOpen?.({ kind: 'page', path: '/atlas' }));
    expect(useAssistantStore.getState().window.open).toBe(false);
    expect(screen.getByTestId('location')).toHaveTextContent('/atlas');
  });

  it('FE-MOB-ASSIST-008: the back gesture closes the chat instead of leaving the trip', () => {
    renderScreen();
    expect(window.history.state).toMatchObject({ trekAssistant: true });
    act(() => {
      window.history.replaceState({ idx: 0 }, '');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(useAssistantStore.getState().window.open).toBe(false);
  });
});
