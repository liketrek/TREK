import type { LucideIcon } from 'lucide-react';
import { useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';

import '../../styles/studio-panels.css';
import { rovingTarget, runsRtl } from './studioRoving';

/**
 * The tab rows inside Studio's panels: Content's photos and entries, the six
 * kinds of thing the Elements panel adds.
 *
 * A grid rather than a strip, so every tab keeps its whole word: a strip of six
 * cuts "Klistermärken" to "Kliste…" or wraps into a ragged second row, where a
 * grid of three across wraps into an even one. A long word breaks inside its
 * cell instead of leaving it. The count beside a label is plain figures in the
 * label's own colour, quieter than the word, never a pill inside the tab.
 *
 * The keyboard is the rail's (studioRoving.ts): the arrows move along the row,
 * Enter or Space opens the tab. In a grid of more than one line, up and down
 * move to the tab above or below.
 */

interface StudioTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** How many there are behind the tab, when that is worth reading before opening it. */
  count?: number;
}

export function StudioTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idBase,
  columns = tabs.length,
}: {
  tabs: readonly StudioTab<T>[];
  value: T;
  onChange: (id: T) => void;
  /** The row's own name for a screen reader, which the tabs alone do not give. */
  label: string;
  /** The ids the tabs and their panel share; the panel is `${idBase}-panel`. */
  idBase: string;
  /** How many tabs share a line before the next one starts a second. */
  columns?: number;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const across = Math.max(1, Math.min(columns, tabs.length));
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const below = e.key === 'ArrowDown' ? index + across : e.key === 'ArrowUp' ? index - across : null;
    const next =
      below !== null && across < tabs.length
        ? below >= 0 && below < tabs.length
          ? below
          : null
        : rovingTarget(e.key, index, tabs.length, { vertical: false, rtl: runsRtl(e.currentTarget) });
    if (next === null) return;
    e.preventDefault();
    buttons.current[next]?.focus();
  };
  return (
    <div
      className={`st-subtabs ${tabs.some((tab) => tab.icon) ? 'has-icons' : ''}`}
      role="tablist"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${across}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab, i) => {
        const on = tab.id === value;
        const Icon = tab.icon;
        return (
          <button
            type="button"
            role="tab"
            key={tab.id}
            id={`${idBase}-tab-${tab.id}`}
            aria-selected={on}
            aria-controls={`${idBase}-panel`}
            tabIndex={on ? 0 : -1}
            className={`st-subtab ${on ? 'is-on' : ''}`}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {Icon && <Icon size={15} strokeWidth={1.8} aria-hidden className="st-subtab-icon" />}
            <span className="st-subtab-label">{tab.label}</span>
            {tab.count != null && <span className="st-subtab-count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** What a tab row opens: the region the chosen tab names. */
export function StudioTabPanel({
  idBase,
  value,
  className,
  children,
  ...rest
}: {
  idBase: string;
  value: string;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'role' | 'className' | 'children'>) {
  return (
    <div
      {...rest}
      id={`${idBase}-panel`}
      role="tabpanel"
      aria-labelledby={`${idBase}-tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}
