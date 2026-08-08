import { Link2, Plus, Trash2 } from 'lucide-react'
import type { CollectionLink } from '@trek/shared'
import type { TranslationFn } from '../../../types'

interface MCollLinksEditorProps {
  links: CollectionLink[]
  onChange: (links: CollectionLink[]) => void
  t: TranslationFn
}

/** Label + URL rows with a dashed add-row, for list and place links. */
export default function MCollLinksEditor({ links, onChange, t }: MCollLinksEditorProps) {
  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const rowInput =
    'box-border rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[11px] py-[9px] font-[inherit] text-[0.78125rem] text-m-ink outline-none placeholder:text-m-faint'

  return (
    <div className="flex flex-col gap-2">
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={l.label ?? ''}
            onChange={e => setLink(i, { label: e.target.value })}
            placeholder={t('collections.linkLabel')}
            className={`w-24 flex-none ${rowInput}`}
          />
          <input
            value={l.url}
            onChange={e => setLink(i, { url: e.target.value })}
            placeholder="https://…"
            className={`min-w-0 flex-1 ${rowInput}`}
          />
          <button
            type="button"
            onClick={() => onChange(links.filter((_, idx) => idx !== i))}
            aria-label={t('common.delete')}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-m-faint active:bg-[color:var(--m-ic)]"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { url: '' }])}
        className="flex items-center gap-2 self-start rounded-[12px] border border-dashed border-[color:var(--m-rowbr)] px-3 py-[9px] text-[0.78125rem] font-semibold text-m-muted"
      >
        <Plus size={14} strokeWidth={2.2} /> <Link2 size={13} strokeWidth={2} /> {t('collections.addLink')}
      </button>
    </div>
  )
}
