import { FolderSync, List, Rows3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { canManageDocSync } from '../../../components/Files/docsync/useDocSync';
import { useDocSyncOffered } from '../../../components/Files/docsync/useDocSyncOffered';
import { useAuthStore } from '../../../store/authStore';
import type { Trip } from '../../../types';
import MIconBtn from '../../components/MIconBtn';

// The small pieces of the trip screen's top controls (MTripShell).

/** Centre glass pill of the top controls (segments for plan/lists/collab). */
export function GlassSegment({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[3px] backdrop-blur-[24px] backdrop-saturate-[1.7]">
      {children}
    </div>
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
