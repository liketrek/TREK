import type { ReactElement } from 'react';
import MSheet from './MSheet';

/**
 * The menu a long press on a card opens (useLongPress): what it is about on
 * top, then its actions, the destructive one in red. The same actions the
 * card's own buttons offer, so this is a second way, never the only one.
 */

export interface ContextAction {
  key: string;
  label: string;
  icon: ReactElement;
  onClick: () => void;
}

interface MContextMenuProps {
  open: boolean;
  title: string;
  actions: ContextAction[];
  onClose: () => void;
}

export default function MContextMenu({ open, title, actions, onClose }: MContextMenuProps) {
  return (
    <MSheet open={open} onClose={onClose} variant="bottom" wideWidth="compact" ariaLabel={title}>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-[10px]">
        <div dir="auto" className="truncate px-[10px] pb-2 pt-1 text-caption font-semibold text-m-muted">
          {title}
        </div>
        {actions.map((action) => {
          const danger = action.key === 'delete';
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => {
                onClose();
                action.onClick();
              }}
              className={`flex w-full items-center gap-[11px] rounded-xl px-[10px] py-[11px] text-start text-[0.84375rem] font-semibold active:bg-[color:var(--m-ic)] ${
                danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'
              }`}
            >
              <span className={`flex flex-none ${danger ? '' : 'text-m-muted'}`}>{action.icon}</span>
              <span className="min-w-0 flex-1 truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </MSheet>
  );
}
