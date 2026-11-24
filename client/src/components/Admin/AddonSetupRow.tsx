import { ChevronRight, Settings2 } from 'lucide-react';
import React, { type ReactNode } from 'react';
import { fs } from '../shared/DialogShell';

/**
 * The last row of an addon's shelf that opens its settings dialog: a gear, what
 * the dialog sets up, and a chevron. It keeps a card of addons as short as its
 * switches and puts the long forms behind one tap (AI, booking mails, paddle
 * water data). A badge says what waits inside, such as requests to look at.
 */
export default function AddonSetupRow({
  label,
  onOpen,
  badge,
}: {
  label: string;
  onOpen: () => void;
  badge?: ReactNode;
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-[44px] w-full items-center gap-2.5 border-0 bg-transparent py-1.5 pe-4 ps-[60px] text-start transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
      >
        <span className="grid h-6 w-6 flex-none place-items-center text-content-muted">
          <Settings2 size={14} />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(12.5, 'body')}>
          {label}
        </span>
        {badge}
        <ChevronRight size={15} strokeWidth={2.2} className="flex-none text-content-faint rtl:rotate-180" />
      </button>
    </li>
  );
}
