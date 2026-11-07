import { Layers, Plus } from 'lucide-react';

import { ALL_SAVED } from '../../../store/collectionStore';

interface ListEntry {
  id: number;
  name: string;
  /** The list's own colour, already resolved to the default for a list without one. */
  color: string;
  place_count?: number | null;
}

interface MCollListNavProps {
  lists: ListEntry[];
  allSaved: boolean;
  activeId: number | typeof ALL_SAVED | null;
  onSelect: (id: number | typeof ALL_SAVED) => void;
  onNewList: () => void;
  t: (key: string) => string;
}

/**
 * The lists a user keeps: all saved places, each list with its colour and its
 * count, and a new one. The phone opens them as the header's dropdown; with
 * room for two panes they stand in a column of their own beside the places,
 * the way Notes on an iPad keeps its folders in view.
 */
export default function MCollListNav({ lists, allSaved, activeId, onSelect, onNewList, t }: MCollListNavProps) {
  const row =
    'flex w-full items-center gap-[10px] rounded-[11px] p-[10px] text-start outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--m-act)]';
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(ALL_SAVED)}
        aria-current={allSaved ? 'page' : undefined}
        className={`${row} text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink ${allSaved ? 'bg-[color:var(--m-ic)]' : 'hover:bg-[color:var(--m-ic)]'}`}
      >
        <Layers size={15} strokeWidth={2} className="flex-none" />
        <span className="min-w-0 flex-1 truncate">{t('collections.allSaved')}</span>
      </button>
      <div className="my-[2px] h-px bg-[color:var(--m-rowbr)]" />
      {lists.map((l) => {
        const active = activeId === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onSelect(l.id)}
            aria-current={active ? 'page' : undefined}
            className={`${row} ${active ? 'bg-[color:var(--m-ic)]' : 'hover:bg-[color:var(--m-ic)]'}`}
            style={active ? { boxShadow: `inset 0 0 0 1.5px ${l.color}` } : undefined}
          >
            <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: l.color }} />
            <span className="min-w-0 flex-1 truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink">
              {l.name}
            </span>
            <span className="font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-bold text-m-faint">
              {l.place_count ?? 0}
            </span>
          </button>
        );
      })}
      <div className="my-[2px] h-px bg-[color:var(--m-rowbr)]" />
      <button
        type="button"
        onClick={onNewList}
        className={`${row} py-[11px] text-[length:calc(13px*var(--fs-scale-body,1))] font-bold text-m-muted hover:bg-[color:var(--m-ic)]`}
      >
        <Plus size={15} strokeWidth={2.2} className="flex-none" /> {t('collections.newList')}
      </button>
    </>
  );
}
