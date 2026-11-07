import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2, Inbox, List, UserRound } from 'lucide-react';

import type { TodoCounts, TodoSmartFilter } from '../../../../components/Todo/todoListModel';
import { TODO_SMART_FILTERS } from '../../../../components/Todo/todoListModel';
import type { TodoActiveFilter } from '../../../../components/Todo/useTodoList';

const SMART_META: Record<TodoSmartFilter, { icon: LucideIcon; color: string; countOf: keyof TodoCounts }> = {
  all: { icon: Inbox, color: 'var(--m-act)', countOf: 'open' },
  my: { icon: UserRound, color: 'var(--m-st-info)', countOf: 'my' },
  overdue: { icon: AlertCircle, color: 'var(--m-st-danger)', countOf: 'overdue' },
  done: { icon: CheckCircle2, color: 'var(--m-st-confirmed)', countOf: 'done' },
};

interface MTodoSidebarProps {
  active: TodoActiveFilter;
  onPick: (filter: TodoActiveFilter) => void;
  counts: TodoCounts;
  categories: string[];
  catCount: (name: string) => number;
  smartLabel: (filter: TodoSmartFilter) => string;
  listsLabel: string;
}

/**
 * The to-do filters as the leading pane of the lists tab on a window with room
 * for two (split size class), the way Reminders lays out its lists on an iPad:
 * the four smart filters as tiles with their counts, the trip's own lists
 * underneath. The phone keeps them as the pill row above the tasks.
 */
export default function MTodoSidebar({
  active,
  onPick,
  counts,
  categories,
  catCount,
  smartLabel,
  listsLabel,
}: MTodoSidebarProps) {
  return (
    <div className="mt-[10px]">
      <div className="grid grid-cols-2 gap-2">
        {TODO_SMART_FILTERS.map((id) => {
          const meta = SMART_META[id];
          const on = active.kind === 'smart' && active.id === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick({ kind: 'smart', id })}
              aria-pressed={on}
              className={`flex flex-col gap-2 rounded-2xl border px-3 py-[11px] text-start outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)] ${
                on
                  ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg'
                  : 'border-[color:var(--m-rowbr)] bg-m-sheetop text-m-ink'
              }`}
            >
              <span className="flex items-center justify-between">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--m-sheetop)]"
                  style={{ background: on ? 'var(--m-actfg)' : meta.color, color: on ? 'var(--m-act)' : undefined }}
                >
                  <meta.icon size={15} strokeWidth={2.3} />
                </span>
                <span className="font-geist text-subtitle font-extrabold tabular-nums">{counts[meta.countOf]}</span>
              </span>
              <span className={`truncate text-caption font-bold ${on ? '' : 'text-m-muted'}`}>{smartLabel(id)}</span>
            </button>
          );
        })}
      </div>

      {categories.length > 0 && (
        <>
          <div className="mb-[4px] mt-[18px] px-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.09em] text-m-faint">
            {listsLabel}
          </div>
          <div className="overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop">
            {categories.map((name) => {
              const on = active.kind === 'category' && active.name === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPick({ kind: 'category', name })}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-3 py-[10px] text-start outline-none last:border-b-0 focus-visible:bg-[color:var(--m-ic)] ${
                    on ? 'bg-[color:var(--m-ic)]' : ''
                  }`}
                >
                  <List size={14} strokeWidth={2.2} className="flex-none text-m-muted" />
                  <span
                    className={`min-w-0 flex-1 truncate text-[length:calc(12.5px*var(--fs-scale-body,1))] ${on ? 'font-bold' : 'font-semibold'} text-m-ink`}
                  >
                    {name}
                  </span>
                  <span className="flex-none font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-bold tabular-nums text-m-faint">
                    {catCount(name)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
