import {
  ChevronLeft,
  Ellipsis,
  History,
  Lightbulb,
  LightbulbOff,
  NotebookPen,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import AssistantCompareSwitch from '../../../../components/Assistant/AssistantCompareSwitch';
import AssistantMemoryDialog from '../../../../components/Assistant/AssistantMemoryDialog';
import AssistantSurfaceLazy from '../../../../components/Assistant/AssistantSurfaceLazy';
import { AI_SETTINGS_PATH } from '../../../../components/Assistant/assistantParts';
import type { EntityTarget } from '../../../../components/Assistant/cards/cardTypes';
import RoutePeekLazy from '../../../../components/Assistant/map/RoutePeekLazy';
import { moveRoutePeek } from '../../../../components/Assistant/map/routePeekControl';
import { useAssistantHintsSetting } from '../../../../components/Assistant/useAssistantHints';
import { useAssistantLiveStep } from '../../../../components/Assistant/useAssistantLiveStep';
import { useAssistantThread } from '../../../../components/Assistant/useAssistantThread';
import { useTripMemory } from '../../../../components/Assistant/useTripMemory';
import { useKeyboardInset } from '../../../../hooks/useKeyboardInset';
import { useTranslation } from '../../../../i18n';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import MDropdownPanel from '../../../components/MDropdownPanel';
import MIconBtn from '../../../components/MIconBtn';
import MListRow from '../../../components/MListRow';
import MConfirmSheet from '../../settings/MConfirmSheet';
import type { MTripSheetsProps } from '../MTripShell';

const HISTORY_MARK = 'trekAssistant';

const ownEntryOnTop = () => (window.history.state as Record<string, unknown> | null)?.[HISTORY_MARK] === true;

/**
 * The phone's back gesture closes the screen instead of leaving the trip: an
 * entry of our own goes onto the history while it is open, and going back
 * pops it. Closed from inside, the entry is taken back off, unless a
 * navigation has already put another one on top. The step back waits a
 * tick, so an effect that only re-runs (React's development double run)
 * keeps its entry instead of losing it.
 */
function useBackCloses(open: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  const openRef = useRef(false);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    openRef.current = true;
    if (!ownEntryOnTop()) {
      window.history.pushState({ ...(window.history.state as object | null), [HISTORY_MARK]: true }, '');
    }
    const onPop = () => {
      if (!ownEntryOnTop()) onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      openRef.current = false;
      window.removeEventListener('popstate', onPop);
      setTimeout(() => {
        if (!openRef.current && ownEntryOnTop()) window.history.back();
      }, 0);
    };
  }, [open]);
}

/** The ways the chat hands the screen to the map, a tab of the trip or another page. */
interface MapHops {
  /** What a card or an applied change points at: selected on the map, a tab opened, a page navigated to. */
  open: (target: EntityTarget) => void;
  /** A day picked in the chat (its weather): the day is selected. */
  focusDay: (dayId: number) => void;
  /** Before the map moves to something the chat points at, such as a found place. */
  revealMap: () => void;
}

/**
 * Whatever the chat shows on the map, the chat steps aside to a pill and the
 * map comes up on the plan tab, then the change or the day is selected there.
 * A tab of the trip opens the same way, on its own sub-tab where it has one,
 * with what it reads beside it in the URL; another page leaves the trip, and
 * the chat closes with it. Read through a ref, so the chat does not re-render
 * with every render of the trip screen.
 */
function useMapHops({ planner, shell }: MTripSheetsProps): MapHops {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const setMinimized = useAssistantStore((s) => s.setMinimized);
  const close = useAssistantStore((s) => s.close);
  const reveal = () => {
    setMinimized(true);
    if (shell.trTab !== 'plan') shell.setTrTab('plan');
    if (shell.view !== 'map') shell.toggleView();
  };
  const toTab = ({ tab, sub, params }: Extract<EntityTarget, { kind: 'tab' }>) => {
    setMinimized(true);
    shell.setTrTab(tab);
    if (tab === 'listen' && (sub === 'packing' || sub === 'todo')) shell.setListsTab(sub);
    if (tab === 'collab' && (sub === 'chat' || sub === 'notes' || sub === 'links' || sub === 'polls')) {
      shell.setCollabTab(sub);
    }
    const entries = Object.entries(params ?? {});
    if (entries.length > 0) {
      setSearchParams(
        (current) => {
          for (const [key, value] of entries) current.set(key, value);
          return current;
        },
        { replace: true }
      );
    }
  };
  const show = (target: EntityTarget) => {
    if (target.kind === 'page') {
      close();
      void navigate(target.path);
      return;
    }
    if (target.kind === 'tab') {
      toTab(target);
      return;
    }
    reveal();
    if (target.dayId !== null) planner.handleSelectDay(target.dayId, false);
    if (target.placeId !== null) planner.setSelectedPlaceId(target.placeId);
  };
  const focus = (dayId: number) => {
    reveal();
    planner.handleSelectDay(dayId, false);
  };
  const latest = useRef({ reveal, show, focus });
  useLayoutEffect(() => {
    latest.current = { reveal, show, focus };
  });
  const open = useCallback((target: EntityTarget) => latest.current.show(target), []);
  const focusDay = useCallback((dayId: number) => latest.current.focus(dayId), []);
  const revealMap = useCallback(() => latest.current.reveal(), []);
  return useMemo(() => ({ open, focusDay, revealMap }), [open, focusDay, revealMap]);
}

interface ScreenProps {
  tripId: number;
  tripTitle: string;
  hidden: boolean;
  hops: MapHops;
}

function AssistantScreen({ tripId, tripTitle, hidden, hops }: ScreenProps) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const thread = useAssistantThread(tripId);
  const close = useAssistantStore((s) => s.close);
  const keyboard = useKeyboardInset();
  const [panel, setPanel] = useState<'history' | 'menu' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const memory = useTripMemory(tripId);
  const hints = useAssistantHintsSetting();
  useBackCloses(!hidden, close);

  const pick = (run: () => void) => {
    setPanel(null);
    run();
  };
  const openHistory = () => {
    thread.refreshThreads();
    setPanel('history');
  };
  const threads = thread.threads ?? [];

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={t('assistant.window.title')}
      hidden={hidden}
      className={`fixed inset-0 z-[var(--z-bar)] ${hidden ? 'hidden' : 'flex'} flex-col bg-[var(--m-bg)] bg-[image:var(--m-scr)] text-m-ink`}
      style={{ paddingBottom: `max(env(safe-area-inset-bottom, 0px), ${keyboard}px)` }}
    >
      <header className="flex flex-none items-center gap-2 px-4 pb-2 pt-[var(--m-safe-top,12px)]">
        <MIconBtn ariaLabel={t('common.back')} onClick={close}>
          <ChevronLeft size={19} strokeWidth={2.2} />
        </MIconBtn>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-body font-semibold">
            <bdi>{thread.title ?? tripTitle}</bdi>
          </h2>
          {thread.title && (
            <div className="truncate text-caption text-m-muted">
              <bdi>{tripTitle}</bdi>
            </div>
          )}
        </div>
        <MIconBtn ariaLabel={t('assistant.history.open')} onClick={openHistory}>
          <History size={16} strokeWidth={2} />
        </MIconBtn>
        <MIconBtn
          ariaLabel={t('assistant.history.new')}
          onClick={thread.newThread}
          disabled={thread.threadId === null && !thread.isRunning}
        >
          <Plus size={17} strokeWidth={2.2} />
        </MIconBtn>
        <MIconBtn ariaLabel={t('assistant.window.menu')} onClick={() => setPanel('menu')}>
          <Ellipsis size={17} strokeWidth={2.2} />
        </MIconBtn>
      </header>

      <MDropdownPanel
        open={panel === 'history'}
        onClose={() => setPanel(null)}
        className="end-4 top-[calc(var(--m-safe-top,12px)+48px)] max-h-[60vh] overflow-y-auto"
      >
        <MListRow icon={Plus} label={t('assistant.history.new')} onClick={() => pick(thread.newThread)} />
        {threads.length === 0 ? (
          <p className="m-0 px-[10px] py-2 text-caption text-m-muted">{t('assistant.history.empty')}</p>
        ) : (
          threads.map((th) => (
            <MListRow
              key={th.id}
              label={th.title}
              className={th.id === thread.threadId ? 'bg-[color:var(--m-ic)]' : ''}
              onClick={() => pick(() => thread.openThread(th.id))}
              trailing={
                <span className="flex-none text-caption text-m-muted">
                  {new Date(th.lastMessageAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </span>
              }
            />
          ))
        )}
        {thread.retentionNote && (
          <p className="m-0 px-[10px] pb-1 pt-2 text-caption text-m-muted">{thread.retentionNote}</p>
        )}
      </MDropdownPanel>

      <MDropdownPanel
        open={panel === 'menu'}
        onClose={() => setPanel(null)}
        className="end-4 top-[calc(var(--m-safe-top,12px)+48px)]"
      >
        <MListRow
          icon={NotebookPen}
          label={t(memory.has ? 'assistant.memory.edit' : 'assistant.memory.title')}
          onClick={() => pick(() => setMemoryOpen(true))}
        />
        <MListRow
          icon={hints.on ? LightbulbOff : Lightbulb}
          label={t(hints.on ? 'assistant.hint.menuOff' : 'assistant.hint.menuOn')}
          onClick={() => pick(hints.toggle)}
        />
        <MListRow
          icon={Settings}
          label={t('assistant.window.settings')}
          onClick={() =>
            pick(() => {
              close();
              void navigate(AI_SETTINGS_PATH);
            })
          }
        />
        {thread.threadId !== null && !thread.isRunning && (
          <MListRow
            icon={Trash2}
            danger
            label={t('assistant.window.deleteThread')}
            onClick={() => pick(() => setConfirming(true))}
          />
        )}
      </MDropdownPanel>

      {memoryOpen && <AssistantMemoryDialog tripId={tripId} onClose={() => setMemoryOpen(false)} />}
      <div className="flex min-h-0 flex-1 flex-col">
        <AssistantSurfaceLazy
          tripId={tripId}
          tripTitle={tripTitle}
          variant="fullscreen"
          onOpen={hops.open}
          onFocusDay={hops.focusDay}
          onRevealMap={hops.revealMap}
        />
      </div>

      <MConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('assistant.window.deleteThread')}
        message={t('assistant.window.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          setConfirming(false);
          void thread.removeThread();
        }}
      />
    </section>
  );
}

/**
 * While the chat stands aside for the map, the way back to it, above the
 * dock. While a step looks somewhere it says where ("Searching near
 * Trastevere"), so the map moving there has its reason in view. While a block
 * of changes can be compared, its before/after switch sits beside it, so the
 * plan can be flipped where it shows.
 */
function BackToChat({ tripId, running }: { tripId: number; running: boolean }) {
  const { t } = useTranslation();
  const setMinimized = useAssistantStore((s) => s.setMinimized);
  const comparing = useAssistantStore((s) => chatOf(s, tripId).compare !== null);
  const live = useAssistantLiveStep(tripId);
  const glass =
    'rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] shadow-elevated backdrop-blur-[30px] backdrop-saturate-[1.8]';
  return (
    <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+86px)] z-[42] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2">
      <button
        type="button"
        onClick={() => {
          // The route's peek belongs to the map: back in the chat, the card shows the route.
          moveRoutePeek(tripId, null);
          setMinimized(false);
        }}
        aria-label={t('assistant.mobile.backToChat')}
        className={`flex h-11 min-w-0 items-center gap-2 pe-4 ps-3 text-m-ink ${glass}`}
      >
        <Sparkles size={15} strokeWidth={2} aria-hidden="true" className="flex-none text-m-muted" />
        <span className={`truncate text-body font-semibold ${running ? 'trek-assistant-shimmer' : ''}`}>
          {live?.text ?? t('assistant.mobile.backToChat')}
        </span>
      </button>
      {comparing && (
        <div className={`flex h-11 flex-none items-center px-1 ${glass}`}>
          <AssistantCompareSwitch tripId={tripId} tall />
        </div>
      )}
    </div>
  );
}

/**
 * The assistant on the phone: a full-screen chat over the trip, opened from
 * the Mehr sheet's tile or "Ask" on a place. It stays mounted while "Show on
 * map" hands the screen to the map, so an answer being written goes on and
 * the pill above the dock brings the chat back as it was; a route shown on
 * the map peeks over it above the pill. The keyboard lifts the composer, and
 * the back gesture closes the chat rather than the trip.
 *
 * Nothing shows until the assistant has a connection this user can use.
 */
export default function MAssistantScreen({ planner, shell }: MTripSheetsProps) {
  const available = useAssistantStore((s) => s.status?.available === true);
  const open = useAssistantStore((s) => s.window.open);
  const minimized = useAssistantStore((s) => s.window.minimized);
  const peeking = useAssistantStore((s) => s.routePeek?.tripId === planner.tripId);
  const running = useAssistantStore((s) => s.byTrip[planner.tripId]?.isRunning === true);
  const loadStatus = useAssistantStore((s) => s.loadStatus);
  const hops = useMapHops({ planner, shell });

  // The desktop window loads this itself; on the phone the trip screen asks once.
  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (!available || !open || !planner.trip) return null;
  return (
    <>
      <AssistantScreen tripId={planner.tripId} tripTitle={planner.trip.title} hidden={minimized} hops={hops} />
      {minimized && peeking && (
        <RoutePeekLazy
          tripId={planner.tripId}
          onOpen={hops.open}
          onFocusDay={hops.focusDay}
          onRevealMap={hops.revealMap}
        />
      )}
      {minimized && <BackToChat tripId={planner.tripId} running={running} />}
    </>
  );
}
