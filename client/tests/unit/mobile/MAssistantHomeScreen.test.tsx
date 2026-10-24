import type { AiStatusResponse } from '@trek/shared';
import { useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EntityTarget } from '../../../src/components/Assistant/cards/cardTypes';
import MAssistantHomeScreen from '../../../src/mobile/screens/assistant/MAssistantHomeScreen';
import { chatOf, useAssistantStore } from '../../../src/store/assistantStore';
import { act, cleanup, fireEvent, render, screen } from '../../helpers/render';

// FE-MOB-ASSIST-HOME-001 to FE-MOB-ASSIST-HOME-005
//
// The phone's home chat, full screen outside a trip, around the shared chat
// surface, which is replaced here: what is tested is when it shows, its
// head and menu, and the ways out (a trip's own chat, another page).

const surface = vi.hoisted(() => ({
  tripId: null as number | null,
  onOpen: null as ((target: EntityTarget) => void) | null,
  onFocusDay: null as ((dayId: number) => void) | null,
  onOpenTripChat: null as ((trip: { id: number; title: string }, question: string | null) => void) | null,
}));

vi.mock('../../../src/components/Assistant/AssistantSurfaceLazy', () => ({
  default: (props: {
    tripId: number;
    onOpen?: (target: EntityTarget) => void;
    onFocusDay?: (dayId: number) => void;
    onOpenTripChat?: (trip: { id: number; title: string }, question: string | null) => void;
  }) => {
    surface.tripId = props.tripId;
    surface.onOpen = props.onOpen ?? null;
    surface.onFocusDay = props.onFocusDay ?? null;
    surface.onOpenTripChat = props.onOpenTripChat ?? null;
    return <div data-testid="chat-surface" />;
  },
}));

vi.mock('../../../src/components/Assistant/useAssistantThread', () => ({
  useAssistantThread: () => ({
    threadId: null,
    threads: [],
    title: null,
    isRunning: false,
    retentionNote: null,
    refreshThreads: vi.fn(),
    openThread: vi.fn(),
    newThread: vi.fn(),
    removeThread: vi.fn(async () => undefined),
    stop: vi.fn(),
  }),
}));

const INITIAL = useAssistantStore.getState();
const STATUS = { available: true, retention: { mode: 'days', days: 90 } } as AiStatusResponse;

function Location() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <>
      <MAssistantHomeScreen />
      <Location />
    </>,
    { initialEntries: [path] }
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  window.history.replaceState(null, '');
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

describe('MAssistantHomeScreen', () => {
  it('FE-MOB-ASSIST-HOME-001: asks for the status, and shows nothing closed, without a connection or in a trip', () => {
    useAssistantStore.setState({ window: { open: false, minimized: false } });
    const closed = renderAt('/dashboard');
    expect(useAssistantStore.getState().loadStatus).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    closed.unmount();

    useAssistantStore.setState({ window: { open: true, minimized: false }, status: { ...STATUS, available: false } });
    const off = renderAt('/atlas');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    off.unmount();

    useAssistantStore.setState({ status: STATUS });
    renderAt('/trips/4');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-MOB-ASSIST-HOME-002: opens full screen on the home chat, named after all trips, without trip notes', () => {
    renderAt('/vacay');
    expect(screen.getByRole('dialog', { name: 'Assistant' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your travels' })).toBeInTheDocument();
    expect(surface.tripId).toBe(0);
    expect(surface.onFocusDay).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.queryByText('Trip notes')).not.toBeInTheDocument();
  });

  it("FE-MOB-ASSIST-HOME-003: going on in a trip's chat opens the trip with the chat open and the question waiting", () => {
    renderAt('/dashboard');
    act(() => surface.onOpenTripChat?.({ id: 9, title: 'Lisbon' }, 'What is missing?'));
    expect(screen.getByTestId('location')).toHaveTextContent('/trips/9');
    expect(useAssistantStore.getState().window).toEqual({ open: true, minimized: false });
    expect(chatOf(useAssistantStore.getState(), 9).draft).toBe('What is missing?');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-MOB-ASSIST-HOME-004: another page closes the chat and opens there; a spot on a map has nowhere to go', () => {
    renderAt('/dashboard');
    act(() => surface.onOpen?.({ kind: 'map', placeId: 3, dayId: null }));
    expect(useAssistantStore.getState().window.open).toBe(true);
    act(() => surface.onOpen?.({ kind: 'page', path: '/collections' }));
    expect(useAssistantStore.getState().window.open).toBe(false);
    expect(screen.getByTestId('location')).toHaveTextContent('/collections');
  });

  it('FE-MOB-ASSIST-HOME-005: the back button closes the chat, and minimized it stays away', () => {
    const view = renderAt('/settings');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(useAssistantStore.getState().window.open).toBe(false);
    view.unmount();
    useAssistantStore.setState({ window: { open: true, minimized: true } });
    renderAt('/settings');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
