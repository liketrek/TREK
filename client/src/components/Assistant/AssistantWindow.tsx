import './assistant.css';

import { type CSSProperties, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { WindowRect } from '../../hooks/useDragResize';
import { useTranslation } from '../../i18n';
import { HOME_CHAT_KEY } from '../../store/assistantChatKey';
import { useAssistantStore } from '../../store/assistantStore';
import AssistantFrameEdges from './AssistantFrameEdges';
import AssistantHeader from './AssistantHeader';
import AssistantLauncher, { LAUNCHER_INSET, LAUNCHER_SIZE } from './AssistantLauncher';
import AssistantSurfaceLazy from './AssistantSurfaceLazy';
import { FRAME_CLASS, useAssistantFrame } from './assistantFrame';
import { plannerSearchOf } from './assistantShowOnMap';
import type { AssistantChatTrip } from './assistantViewContext';
import type { EntityTarget } from './cards/cardTypes';
import { useAssistantHome } from './useAssistantHome';
import { useAssistantHotkey } from './useAssistantHotkey';
import { useAssistantThread } from './useAssistantThread';

/**
 * The assistant on the desktop: a glass window floating over the app, moved
 * by its head, resized from any edge or corner, kept inside the screen. It
 * remembers where it was. A double click on the head switches between the
 * compact window and a large one; let go near a corner and it settles there;
 * Alt+arrows move it and Alt+Shift+arrows resize it from the keyboard.
 *
 * The head's close button only hides it: the conversation goes on behind it,
 * and the planner shows the round button it opens from again, breathing while
 * an answer is still being written. Escape stops an answer first, then
 * closes, and the focus goes back to where it was.
 *
 * Outside a trip it opens on the home chat, which knows all of the user's
 * trips; its head lists them to go on in one trip's own chat, and a trip's
 * chat opened that way has the way back home in its head.
 *
 * Mounted once for the whole app; it shows nothing until the assistant has a
 * connection this user can use.
 */

type WindowTrip = AssistantChatTrip;

interface AssistantWindowProps {
  /** The trip on screen; null outside a trip, where the window opens on the home chat. */
  trip: WindowTrip | null;
  /** Opens what a card or an applied change points at, from the trip on screen. */
  onOpen?: (target: EntityTarget) => void;
  /** Selects a day in the planner on screen. */
  onFocusDay?: (dayId: number) => void;
  /** Brings the planner's map on screen, from whichever of its tabs is open. */
  onRevealMap?: () => void;
}

/** Narrower than this, the chat lays its cards out compact. */
const ROOMY_WIDTH = 480;

/** Where the window's place and size are kept between visits. */
const WINDOW_STORAGE = 'trek.assistantWindow';

/** Where the floating button's middle sits inside the window, so the window grows out of it. */
function originFrom(rect: WindowRect, rtl: boolean): string {
  const fromStart = window.innerWidth - LAUNCHER_INSET - LAUNCHER_SIZE / 2 - rect.x;
  const x = rtl ? rect.width - fromStart : fromStart;
  const y = window.innerHeight - LAUNCHER_INSET - LAUNCHER_SIZE / 2 - rect.y;
  return `${Math.round(x)}px ${Math.round(y)}px`;
}

function ChatWindow({
  trip,
  hidden,
  onOpen,
  onFocusDay,
  onRevealMap,
  onOpenTripChat,
  tripSwitch,
}: {
  trip: WindowTrip;
  hidden: boolean;
  onOpen?: (target: EntityTarget) => void;
  onFocusDay?: (dayId: number) => void;
  onRevealMap?: () => void;
  onOpenTripChat?: (trip: WindowTrip, question: string | null) => void;
  tripSwitch?: Parameters<typeof AssistantHeader>[0]['tripSwitch'];
}) {
  const { t } = useTranslation();
  const thread = useAssistantThread(trip.id);
  const close = useAssistantStore((s) => s.close);
  const setMinimized = useAssistantStore((s) => s.setMinimized);
  const setWindowRect = useAssistantStore((s) => s.setWindowRect);
  const frame = useAssistantFrame(WINDOW_STORAGE);
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const [origin] = useState(() => originFrom(frame.rect, rtl));
  const returnFocus = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  const sectionRef = useRef<HTMLElement>(null);
  const wasHidden = useRef(hidden);
  const { x, y, width, height } = frame.rect;

  // The map frames its view around the window: it learns where the window
  // settled after a move or a resize, not every step of the drag.
  useEffect(() => {
    if (hidden) setWindowRect(null);
    else if (!frame.active) setWindowRect({ x, y, width, height });
  }, [hidden, frame.active, x, y, width, height, setWindowRect]);
  useEffect(() => () => setWindowRect(null), [setWindowRect]);

  // Back to whatever had the focus before the window opened.
  useEffect(() => {
    const target = returnFocus.current;
    return () => {
      if (target instanceof HTMLElement && target.isConnected) target.focus();
    };
  }, []);

  // Restored from the pill: back into the composer, where the user left off.
  useEffect(() => {
    if (wasHidden.current && !hidden) sectionRef.current?.querySelector('textarea')?.focus();
    wasHidden.current = hidden;
  }, [hidden]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // Keys from a portal (the header's menu) bubble here through React; they are not the window's.
    if (!e.currentTarget.contains(e.target as Node)) return;
    frame.onKeyDown(e);
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    if (thread.isRunning) thread.stop();
    else close();
  };

  const style: CSSProperties = {
    insetInlineStart: frame.rect.x,
    top: frame.rect.y,
    width: frame.rect.width,
    height: frame.rect.height,
    transformOrigin: origin,
  };

  return (
    <section
      ref={sectionRef}
      role="dialog"
      aria-label={t('assistant.window.title')}
      // Hidden, not unmounted, while minimized: the answer being written keeps coming in.
      hidden={hidden}
      onKeyDown={onKeyDown}
      style={style}
      className={`trek-assistant-pop ${FRAME_CLASS} ${hidden ? 'hidden' : 'flex'} ${
        frame.active ? 'select-none' : 'trek-assistant-settle'
      }`}
    >
      <AssistantFrameEdges frame={frame} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
        <AssistantHeader
          tripId={trip.id}
          thread={thread}
          tripTitle={trip.title}
          dragProps={frame.handleProps}
          tripSwitch={tripSwitch}
          // Closing only hides the window: an answer being written keeps coming in,
          // and the floating button says so until it is opened again.
          onClose={() => setMinimized(true)}
        />
        <AssistantSurfaceLazy
          tripId={trip.id}
          tripTitle={trip.title}
          variant="window"
          density={width < ROOMY_WIDTH ? 'compact' : 'roomy'}
          onOpen={onOpen}
          onFocusDay={onFocusDay}
          onRevealMap={onRevealMap}
          onOpenTripChat={onOpenTripChat}
        />
      </div>
    </section>
  );
}

export default function AssistantWindow({ trip, onOpen, onFocusDay, onRevealMap }: AssistantWindowProps) {
  const navigate = useNavigate();
  const available = useAssistantStore((s) => s.status?.available === true);
  const open = useAssistantStore((s) => s.window.open);
  const minimized = useAssistantStore((s) => s.window.minimized);
  const loadStatus = useAssistantStore((s) => s.loadStatus);
  const toggle = useAssistantStore((s) => s.toggle);
  const [picked, setPicked] = useState<WindowTrip | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const home = useAssistantHome(setPicked);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);
  useAssistantHotkey(available, toggle);

  // A trip picked outside the planner is only for this opening; the next one opens on the home chat again.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setPicked(null);
  }

  const current = trip ?? picked ?? home.chat;
  const atHome = current.id === HOME_CHAT_KEY;
  // A change in a trip the planner does not show is shown by opening that trip; a tab opens on it.
  const openPicked = useCallback(
    (target: EntityTarget) => {
      if (target.kind === 'page') void navigate(target.path);
      else if (picked) void navigate(`/trips/${picked.id}${target.kind === 'tab' ? plannerSearchOf(target) : ''}`);
    },
    [navigate, picked]
  );
  // The home chat has no trip to show anything in; another page it simply opens.
  const openFromHome = useCallback(
    (target: EntityTarget) => {
      if (target.kind === 'page') void navigate(target.path);
    },
    [navigate]
  );
  const goHome = useCallback(() => setPicked(null), []);
  // Another page leaves the trip: the chat stays on it, as if it had been picked.
  const openOnScreen = useCallback(
    (target: EntityTarget) => {
      if (target.kind === 'page' && trip) setPicked(trip);
      onOpen?.(target);
    },
    [onOpen, trip]
  );

  if (!available) return null;
  if (!open) return trip ? <AssistantLauncher variant="floating" tripId={trip.id} /> : null;

  const onScreen = !!trip && current.id === trip.id;
  let openTarget = onScreen ? onOpen && openOnScreen : openPicked;
  if (atHome) openTarget = openFromHome;
  let tripSwitch: { onPick?: (trip: WindowTrip) => void; onHome?: () => void } | undefined;
  if (atHome) tripSwitch = { onPick: setPicked };
  else if (!onScreen) tripSwitch = { onHome: goHome };
  return (
    <>
      <ChatWindow
        trip={current}
        hidden={minimized}
        onOpen={openTarget}
        // Only the planner on screen has days to select and a map to bring back.
        onFocusDay={onScreen ? onFocusDay : undefined}
        onRevealMap={onScreen ? onRevealMap : undefined}
        onOpenTripChat={atHome ? home.openTripChat : undefined}
        tripSwitch={tripSwitch}
      />
      {/* Hidden while an answer may still come in: the round button brings it back, on any page. */}
      {minimized && <AssistantLauncher variant="floating" tripId={trip?.id ?? null} focusOnMount />}
    </>
  );
}
