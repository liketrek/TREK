import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { Category, TranslationFn } from '../../../types'
import { categoryMeta, NO_CATEGORY_META, tint } from './collectionsMobileModel'

interface MCollCategoryPickerProps {
  categories: Category[]
  value: number | null
  onChange: (id: number | null) => void
  t: TranslationFn
}

/**
 * Category dropdown of the add/edit-place sheets: a trigger row with the tinted
 * 26px icon chip and an overlay list of "No category" + the admin categories.
 */
export default function MCollCategoryPicker({ categories, value, onChange, t }: MCollCategoryPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value != null ? categories.find(c => c.id === value) ?? null : null
  const selectedMeta = (selected && categoryMeta(selected)) || NO_CATEGORY_META
  const SelectedIcon = selectedMeta.icon
  const Chevron = open ? ChevronUp : ChevronDown

  const options: { id: number | null; name: string }[] = [
    { id: null, name: t('collections.noCategory') },
    ...categories.map(c => ({ id: c.id, name: c.name })),
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-[9px] rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] text-left"
      >
        <span
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg"
          style={{ background: tint(selectedMeta.color, '1f'), color: selectedMeta.color }}
        >
          <SelectedIcon size={14} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">
          {selected?.name ?? t('collections.noCategory')}
        </span>
        <Chevron size={15} strokeWidth={2.2} className="flex-none text-m-faint" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[5] max-h-[210px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-m-sheetop shadow-[0_20px_44px_-18px_rgba(0,0,0,.45)]">
          {options.map((opt, i) => {
            const cat = opt.id != null ? categories.find(c => c.id === opt.id) ?? null : null
            const meta = (cat && categoryMeta(cat)) || NO_CATEGORY_META
            const Icon = meta.icon
            const sel = value === opt.id
            return (
              <button
                key={opt.id ?? 'none'}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false) }}
                className={`flex w-full items-center gap-[10px] px-[13px] py-[10px] text-left ${i > 0 ? 'border-t border-[color:var(--m-rowbr)]' : ''}`}
                style={sel ? { background: tint(meta.color, '10') } : undefined}
              >
                <span
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg"
                  style={{ background: tint(meta.color, '1f'), color: meta.color }}
                >
                  <Icon size={14} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{opt.name}</span>
                {sel && <Check size={15} strokeWidth={2.6} style={{ color: meta.color }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
