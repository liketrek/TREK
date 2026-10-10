import { ChevronRight } from 'lucide-react';
import React from 'react';

/**
 * The clickable head of a native <details> fold on the admin settings page: a
 * chevron that turns when the fold opens, then whatever the fold calls itself.
 * The surrounding <details> needs the `group` class for the chevron to turn.
 */
export default function FoldSummary({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--text-primary)] [&::-webkit-details-marker]:hidden">
      <ChevronRight
        size={15}
        strokeWidth={2}
        className="flex-none text-content-faint transition-transform group-open:rotate-90"
        aria-hidden="true"
      />
      {children}
    </summary>
  );
}
