import { FolderSync, List, Rows3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { canManageDocSync } from '../../../components/Files/docsync/useDocSync';
import { useDocSyncOffered } from '../../../components/Files/docsync/useDocSyncOffered';
import { useAuthStore } from '../../../store/authStore';
import type { Trip } from '../../../types';
import MIconBtn from '../../components/MIconBtn';
import type { MTripCollabTab } from './MTripShell';
import { collabBoardFor, collabSideBySide } from './tabs/collabPanes';

// The small pieces of the trip screen's top controls (MTripShell).

/** Centre glass pill of the top controls (segments for plan/lists/collab). */
export function GlassSegment({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-1/2 mx-auto flex w-fit -translate-y-1/2 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[3px] backdrop-blur-[24px] backdrop-saturate-[1.7]">
      {children}
    </div>
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
    <GlassSegment>
      {segments.map((seg) => (
        <button
          key={seg.value}
          type="button"
          onClick={() => onPick(seg.value)}
          aria-pressed={current === seg.value}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-[length:calc(13px*var(--fs-scale-body,1))] ${
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
