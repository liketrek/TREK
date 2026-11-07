import type { LucideIcon } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export interface MSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MSectionRowProps {
  section: MSection;
  active: boolean;
  /** Marks the row as the page on show, for the list that stands beside the page. */
  current?: boolean;
  onPick: () => void;
}

/** One section of a settings-like screen, in its dropdown or in the list beside the page. */
export function MSectionRow({ section, active, current = false, onPick }: MSectionRowProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-current={current ? 'page' : undefined}
      className={`flex w-full items-center gap-[10px] rounded-[11px] p-[10px] text-start text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)] ${
        active ? 'bg-[color:var(--m-ic)]' : 'hover:bg-[color:var(--m-ic)]'
      }`}
    >
      <section.icon size={15} strokeWidth={2} className="flex-none" />
      <span className="min-w-0 flex-1 truncate">{section.label}</span>
    </button>
  );
}

/**
 * The frame of a settings-like screen (settings, administration), one rule for
 * both: the page column on a phone, a centred column on a wide window, and from
 * the split size class the list of sections beside a page that runs to the same
 * width on both screens.
 */
export const SECTION_SCREEN =
  'px-4 pb-[calc(var(--bottom-nav-h,84px)+16px)] pt-[var(--m-safe-top,12px)] wide:mx-auto wide:max-w-[1040px] wide:px-6 split:grid split:max-w-[1240px] split:grid-cols-[260px_minmax(0,1fr)] split:items-start split:gap-8';

interface MSectionNavProps {
  title: string;
  backLabel: string;
  onBack: () => void;
  sections: MSection[];
  activeId: string;
  onPick: (id: string) => void;
  /**
   * An action of the screen (admin: a new user), on a line of its own under the
   * title, so a long title in a long language keeps the whole width.
   */
  action?: ReactNode;
}

/**
 * The sections of a settings-like screen (settings, administration) as a list
 * of their own beside the page, the way Settings on an iPad shows them, once
 * the window has room for two panes. It stays in view while the page scrolls.
 * Narrower windows keep the dropdown in the screen's header.
 */
export default function MSectionNav({
  title,
  backLabel,
  onBack,
  sections,
  activeId,
  onPick,
  action,
}: MSectionNavProps) {
  return (
    <nav
      aria-label={title}
      className="sticky top-[var(--m-safe-top,12px)] flex max-h-[calc(100dvh-var(--m-safe-top,12px)-16px)] flex-col gap-1 overflow-y-auto rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-[6px] shadow-[0_16px_40px_-24px_rgba(0,0,0,.3)] [scrollbar-width:none]"
    >
      <div className="mb-1 flex items-center gap-2 p-[4px]">
        <button
          type="button"
          aria-label={backLabel}
          onClick={onBack}
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full text-m-ink outline-none hover:bg-[color:var(--m-ic)] focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)]"
        >
          <ChevronLeft size={18} strokeWidth={2.2} className="rtl:-scale-x-100" />
        </button>
        <span className="min-w-0 flex-1 truncate text-subtitle font-bold text-m-ink">{title}</span>
      </div>
      {action && <div className="mb-1 px-[4px]">{action}</div>}
      {sections.map((section) => (
        <MSectionRow
          key={section.id}
          section={section}
          active={section.id === activeId}
          current={section.id === activeId}
          onPick={() => onPick(section.id)}
        />
      ))}
    </nav>
  );
}
