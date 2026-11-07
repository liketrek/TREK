import { ChevronLeft, ChevronRight, FolderSync, List, MoreHorizontal, Plus, Rows3 } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { canManageDocSync } from '../../../components/Files/docsync/useDocSync';
import { useDocSyncOffered } from '../../../components/Files/docsync/useDocSyncOffered';
import { useIsWide } from '../../../hooks/sizeClass';
import { useAuthStore } from '../../../store/authStore';
import type { Trip } from '../../../types';
import MIconBtn from '../../components/MIconBtn';
import { edgeFadeClass, useEdgeFade, type EdgeFade } from '../../components/useEdgeFade';
import type { MTripCollabTab } from './MTripShell';
import { collabBoardFor, collabSideBySide } from './tabs/collabPanes';

// The small pieces of the trip screen's top controls (MTripShell).

/**
 * Centre glass pill of the top controls (segments for plan/lists/collab).
 *
 * It has the room between the back button and the trailing button, and never
 * more: centred there while it fits, its segments drawn a little tighter where
 * that is enough (a long German or Russian label, a narrow Split View), and
 * scrolling sideways with faded edges where even that is too wide. It used to
 * be centred over the whole bar at its full width, and in a narrow window it
 * covered the back button, the only way out of the trip. `activeKey` names the
 * segment that is on, which a scrolling control keeps in view.
 */
export function GlassSegment({ children, activeKey }: { children: ReactNode; activeKey?: string }) {
  const [region, setRegion] = useState<HTMLDivElement | null>(null);
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  // The element is also kept in a ref: the fit below writes to it, and state is not to be written.
  const trackRef = useRef<HTMLDivElement | null>(null);
  const attachTrack = useCallback((el: HTMLDivElement | null) => {
    trackRef.current = el;
    setTrack(el);
  }, []);
  const fade = useEdgeFade(track);
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!region || !el) return;
    const fit = () => {
      el.dataset.tight = 'false';
      el.dataset.tight = el.scrollWidth > el.clientWidth + 0.5 ? 'true' : 'false';
      const active = el.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (active && el.scrollWidth > el.clientWidth + 0.5) {
        // 'nearest' on both axes: the shell root is fixed, anything else scrolls the page behind it.
        active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };
    fit();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(region);
    return () => observer?.disconnect();
  }, [region, track, activeKey]);
  return (
    <div
      ref={setRegion}
      className="pointer-events-none absolute inset-y-0 end-12 start-12 flex items-center justify-center"
    >
      <div className="pointer-events-auto flex min-w-0 max-w-full rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[3px] backdrop-blur-[24px] backdrop-saturate-[1.7]">
        <div ref={attachTrack} className={`m-seg flex min-w-0 overflow-x-auto rounded-full ${edgeFadeClass(fade)}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** A phone's header group: after the back button (transports, bookings), or centred on the bar (costs, files). */
export const ROW_AFTER_BACK = 'absolute start-[52px] end-2 justify-center';
export const ROW_CENTRED = 'absolute inset-x-0 mx-auto w-fit';

/** Primary header action (Add transport / New reservation / Add expense / Upload). */
export function PrimaryPill({ label, onClick, icon }: { label: string; onClick: () => void; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-m-act px-[18px] text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-actfg shadow-[0_10px_24px_-10px_rgba(0,0,0,.45)]"
    >
      {icon ?? <Plus size={14} strokeWidth={2.2} />}
      {label}
    </button>
  );
}

/**
 * The primary action of a list tab's top controls (add a transport, a
 * booking, an expense, upload a file) and the round buttons that go with it.
 *
 * On a wide window every tab lays them out alike: the pill in the middle of
 * the bar, the round buttons at its trailing end where the plan tab keeps its
 * map switch, so moving between the tabs moves neither. Where the buttons
 * need more than their half of the bar, the pill steps aside rather than over
 * them. On a phone the group stays together as it always has: `phone` is that
 * row's own placement.
 */
export function HeaderActions({
  primary,
  phone,
  children,
}: {
  primary: ReactNode;
  phone: string;
  children: ReactNode;
}) {
  const wide = useIsWide();
  if (!wide) {
    return (
      <div className={`${phone} top-1/2 flex -translate-y-1/2 items-center gap-[7px]`}>
        {primary}
        {children}
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-[minmax(48px,1fr)_auto_minmax(max-content,1fr)] items-center gap-x-[10px]">
      <div className="pointer-events-auto col-start-2 flex min-w-0">{primary}</div>
      <div className="pointer-events-auto col-start-3 flex items-center gap-[7px] justify-self-end">{children}</div>
    </div>
  );
}

/**
 * The day strip's way on past an edge, on a wide window: a round chevron over
 * the faded end that pages the strip along. The fade alone was too quiet on a
 * large screen, where a day cut in half at the end ("Wed") read as a mistake
 * rather than as more to come. The days themselves stay where a screen reader
 * and the keyboard reach them, so the chevron is for the eye and the finger only.
 */
export function DayRailSteps({ rail, fade }: { rail: HTMLElement | null; fade: EdgeFade }) {
  const wide = useIsWide();
  if (!wide || !rail) return null;
  // A page along: the day the edge cuts comes to the other edge, whole, so the
  // next tap continues from there. Read in reading order, so a right-to-left
  // strip pages the same way round.
  const step = (toward: 'start' | 'end') => {
    const rtl = getComputedStyle(rail).direction === 'rtl';
    const box = rail.getBoundingClientRect();
    const chips = Array.from(rail.querySelectorAll<HTMLElement>('button'));
    const pastEnd = (r: DOMRect) => (rtl ? r.left < box.left - 1 : r.right > box.right + 1);
    const pastStart = (r: DOMRect) => (rtl ? r.right > box.right + 1 : r.left < box.left - 1);
    const target =
      toward === 'end'
        ? chips.find((chip) => pastEnd(chip.getBoundingClientRect()))
        : chips.filter((chip) => pastStart(chip.getBoundingClientRect())).pop();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    // 'nearest' on the block axis: the shell root is fixed, anything else scrolls the page behind it.
    target?.scrollIntoView({
      inline: toward === 'end' ? 'start' : 'end',
      block: 'nearest',
      behavior: reduced ? 'auto' : 'smooth',
    });
  };
  const btn =
    'absolute top-1/2 z-[1] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheetop)] text-m-ink shadow-[0_4px_12px_-4px_rgba(0,0,0,.35)]';
  return (
    <>
      {fade.start && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => step('start')}
          className={`${btn} start-[4px]`}
        >
          <ChevronLeft size={15} strokeWidth={2.4} className="rtl:-scale-x-100" />
        </button>
      )}
      {fade.end && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => step('end')}
          className={`${btn} end-[4px]`}
        >
          <ChevronRight size={15} strokeWidth={2.4} className="rtl:-scale-x-100" />
        </button>
      )}
    </>
  );
}

interface CollabSegmentProps {
  active: MTripCollabTab;
  onPick: (tab: MTripCollabTab) => void;
  features: { chat: boolean; notes: boolean; links: boolean; polls: boolean };
  split: boolean;
  t: (key: string) => string;
}

/**
 * The collab tab's switch. Where the chat stands beside the board (MCollabTab),
 * it switches only the board and sits centred over it, and the chat's name sits
 * over the chat, so each pane has its heading where the eye looks for it.
 */
export function CollabSegment({ active, onPick, features, split, t }: CollabSegmentProps) {
  const sideBySide = collabSideBySide(split, features);
  const current = sideBySide ? collabBoardFor(active, features) : active;
  const segments = [
    { value: 'chat' as const, label: t('collab.tabs.chat') },
    { value: 'notes' as const, label: t('collab.tabs.notes') },
    { value: 'links' as const, label: t('collab.tabs.links') },
    { value: 'polls' as const, label: t('collab.tabs.polls') },
  ].filter((seg) => !sideBySide || seg.value !== 'chat');
  const pill = (
    <GlassSegment activeKey={`${current}:${segments.map((seg) => seg.label).join('|')}`}>
      {segments.map((seg) => (
        <button
          key={seg.value}
          type="button"
          onClick={() => onPick(seg.value)}
          aria-pressed={current === seg.value}
          className={`flex-none whitespace-nowrap rounded-full px-4 py-2 text-[length:calc(13px*var(--fs-scale-body,1))] ${
            current === seg.value ? 'bg-m-act font-semibold text-m-actfg' : 'font-medium text-m-ink'
          }`}
        >
          {seg.label}
        </button>
      ))}
    </GlassSegment>
  );
  if (!sideBySide) return pill;
  // The controls row ends 16px short of the window's edge, where the chat pane
  // ends too; the two boxes split the row where the panes meet.
  return (
    <>
      <div className="absolute inset-y-0 end-[calc(var(--m-pane-trail-w)-16px)] start-0">{pill}</div>
      <div className="pointer-events-none absolute inset-y-0 end-[-16px] flex w-[var(--m-pane-trail-w)] items-center justify-center">
        <span className="rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-[9px] text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink backdrop-blur-[24px] backdrop-saturate-[1.7]">
          {t('collab.tabs.chat')}
        </span>
      </div>
    </>
  );
}

/**
 * The Files header's sync button, only where there is something behind it.
 *
 * A component of its own so the question is asked while the Files header is
 * up, not on every tab the shell renders.
 */
export function DocSyncButton({
  tripId,
  trip,
  label,
  onOpen,
}: {
  tripId: number;
  trip: Trip;
  label: string;
  onOpen: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const offered = useDocSyncOffered(tripId, canManageDocSync(user, trip));
  if (!offered) return null;
  return (
    <MIconBtn
      ariaLabel={label}
      onClick={onOpen}
      size={40}
      className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]"
    >
      <FolderSync size={15} strokeWidth={2} />
    </MIconBtn>
  );
}

/** 40px list-density toggle on the transports/bookings headers. */
export function CompactToggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border ${
        active
          ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg'
          : 'border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]'
      }`}
    >
      {active ? <Rows3 size={15} strokeWidth={2} /> : <List size={15} strokeWidth={2} />}
    </button>
  );
}

/**
 * The phone dock's More. It stands for its sections (chat, notes, files and the
 * rest) while one is on show, and for itself while open: marked as a ring, as
 * the main dock's More is, not filled like a tab it would then read as.
 */
export function DockMoreButton({
  open,
  standsFor,
  onOpen,
  label,
}: {
  open: boolean;
  standsFor: boolean;
  onOpen: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      aria-expanded={open}
      aria-current={!open && standsFor ? 'page' : undefined}
      className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full ${
        open || standsFor
          ? 'bg-[color:var(--m-ic)] text-m-ink ring-[1.5px] ring-inset ring-[color:var(--m-act)]'
          : 'text-m-muted'
      }`}
    >
      <MoreHorizontal size={19} strokeWidth={2.2} />
    </button>
  );
}
