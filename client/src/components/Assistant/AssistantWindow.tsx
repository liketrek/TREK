import './assistant.css';

import { Sparkles, X } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import type { WindowRect } from '../../hooks/useDragResize';
import { useTranslation } from '../../i18n';
import { useAssistantStore } from '../../store/assistantStore';
import AssistantFrameEdges from './AssistantFrameEdges';
import AssistantHeader from './AssistantHeader';
import AssistantLauncher, { LAUNCHER_INSET, LAUNCHER_SIZE } from './AssistantLauncher';
import AssistantSurfaceLazy from './AssistantSurfaceLazy';
import AssistantTripPicker from './AssistantTripPicker';
import { FRAME_CLASS, useAssistantFrame } from './assistantFrame';
import { plannerSearchOf } from './assistantShowOnMap';
import type { EntityTarget } from './cards/cardTypes';
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
 * Mounted once for the whole app; it shows nothing until the assistant has a
 * connection this user can use.
 */

interface WindowTrip {
  id: number;
  title: string;
}

interface AssistantWindowProps {
  /** The trip on screen; null outside a trip, where the window asks which one first. */
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
}: {
  trip: WindowTrip;
  hidden: boolean;
  onOpen?: (target: EntityTarget) => void;
  onFocusDay?: (dayId: number) => void;
  onRevealMap?: () => void;
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

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);
  useAssistantHotkey(available, toggle);

  // A trip picked outside the planner is only for this opening; the next one asks again.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setPicked(null);
  }

  const current = trip ?? picked;
  // A change in a trip the planner does not show is shown by opening that trip; a tab opens on it.
  const openPicked = useCallback(
    (target: EntityTarget) => {
      if (target.kind === 'page') void navigate(target.path);
      else if (picked) void navigate(`/trips/${picked.id}${target.kind === 'tab' ? plannerSearchOf(target) : ''}`);
    },
    [navigate, picked]
  );
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
  if (!current) return <PickerWindow onPick={setPicked} />;

  const onScreen = !!trip && current.id === trip.id;
  return (
    <>
      <ChatWindow
        trip={current}
        hidden={minimized}
        onOpen={onScreen ? onOpen && openOnScreen : openPicked}
        // Only the planner on screen has days to select and a map to bring back.
        onFocusDay={onScreen ? onFocusDay : undefined}
        onRevealMap={onScreen ? onRevealMap : undefined}
      />
      {minimized && trip && <AssistantLauncher variant="floating" tripId={trip.id} focusOnMount />}
    </>
  );
}

function PickerWindow({ onPick }: { onPick: (trip: WindowTrip) => void }) {
  const { t } = useTranslation();
  const close = useAssistantStore((s) => s.close);
  return (
    <section
      role="dialog"
      aria-labelledby="assistant-picker-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !e.defaultPrevented) close();
      }}
      className="trek-assistant-pop fixed z-[var(--z-nav)] flex max-h-[min(32rem,calc(100vh-6rem))] w-[22rem] flex-col overflow-hidden rounded-xl border border-edge-faint bg-surface-elevated shadow-[var(--sidebar-shadow)] backdrop-blur-2xl backdrop-saturate-150"
      style={{ insetInlineEnd: LAUNCHER_INSET, bottom: LAUNCHER_INSET, transformOrigin: 'bottom' }}
    >
      <header className="flex h-10 flex-shrink-0 items-center gap-2 border-b border-edge-faint pe-1.5 ps-3">
        <Sparkles size={14} aria-hidden="true" className="flex-shrink-0 text-content-muted" />
        <h2 id="assistant-picker-title" className="m-0 flex-1 truncate text-body font-semibold text-content">
          {t('assistant.picker.title')}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label={t('common.close')}
          className="flex h-7 w-7 items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>
      <AssistantTripPicker onPick={({ id, title }) => onPick({ id, title })} />
    </section>
  );
}
