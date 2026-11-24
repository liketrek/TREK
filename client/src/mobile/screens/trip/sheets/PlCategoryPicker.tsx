import { createElement, useState } from 'react'
import { Ban, Check, ChevronDown, Plus, X } from 'lucide-react'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { useNewCategory } from '../../../../components/Planner/usePlaceForm'
import { FIELD_CLS, SELECT_FIELD_CLS } from './PlSheetChrome'
import type { TripPlanner } from '../MTripShell'

interface PlCategoryPickerProps {
  planner: TripPlanner
  /** Selected category id as string, '' = no category (form convention). */
  value: string
  onChange: (categoryId: string) => void
}

const LIST = 'mt-[6px] max-h-[264px] overflow-y-auto overscroll-contain rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)]'
const ROW = 'flex w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[11px] text-start last:border-b-0'
const ROW_TEXT = 'min-w-0 flex-1 truncate text-[0.84375rem]'

/**
 * The category of the place form on the phone: one field that opens the list,
 * the way the cost sheet picks its category, instead of a pill for every
 * category, which took half the sheet on a trip with many. "No category" leads
 * the list and a new category is made at its foot, picked straight away like on
 * the desktop.
 */
export default function PlCategoryPicker({ planner, value, onChange }: PlCategoryPickerProps) {
  const { t, toast, categories, tripActions } = planner
  const [open, setOpen] = useState(false)
  const pick = (id: string) => {
    onChange(id)
    setOpen(false)
  }
  const {
    open: creating, setOpen: setCreating, name: newName, setName: setNewName, saving, submit: handleCreate,
  } = useNewCategory({ variant: 'sheet', create: tripActions.addCategory, onCreated: pick, t, toast })

  const current = (categories || []).find(cat => String(cat.id) === value)
  // The icon of the picked category, made as an element: a component looked up while
  // rendering would be a new one each time to React.
  const currentIcon = createElement(current ? getCategoryIcon(current.icon) : Ban, {
    size: 15,
    strokeWidth: 2,
    className: 'flex-none',
    style: current?.color ? { color: current.color } : undefined,
  })

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${t('places.formCategory')}: ${current ? current.name : t('places.noCategory')}`}
        onClick={() => setOpen(v => !v)}
        className={`${SELECT_FIELD_CLS} gap-[10px] text-start`}
      >
        {currentIcon}
        <span className={`${ROW_TEXT} font-medium ${current ? 'text-m-ink' : 'text-m-faint'}`}>
          {current ? current.name : t('places.noCategory')}
        </span>
        <ChevronDown size={14} strokeWidth={2} className={`flex-none text-m-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={LIST}>
          <button type="button" aria-pressed={value === ''} onClick={() => pick('')} className={ROW}>
            <Ban size={14} strokeWidth={2} className="flex-none text-m-muted" />
            <span className={`${ROW_TEXT} ${value === '' ? 'font-semibold text-m-ink' : 'text-m-muted'}`}>{t('places.noCategory')}</span>
            {value === '' && <Check size={14} strokeWidth={2.4} className="flex-none text-m-ink" />}
          </button>
          {(categories || []).map(cat => {
            const on = value === String(cat.id)
            const Icon = getCategoryIcon(cat.icon)
            return (
              <button key={cat.id} type="button" aria-pressed={on} onClick={() => pick(String(cat.id))} className={ROW}>
                <Icon size={14} strokeWidth={2} className="flex-none" style={cat.color ? { color: cat.color } : undefined} />
                <span className={`${ROW_TEXT} ${on ? 'font-semibold text-m-ink' : 'text-m-ink'}`}>{cat.name}</span>
                {on && <Check size={14} strokeWidth={2.4} className="flex-none text-m-ink" />}
              </button>
            )
          })}
          {!creating ? (
            <button type="button" onClick={() => setCreating(true)} className={ROW}>
              <Plus size={14} strokeWidth={2.2} className="flex-none text-m-muted" />
              <span className={`${ROW_TEXT} font-semibold text-m-muted`}>{t('mobileTrip.newCategory')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-[10px] py-[8px]">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleCreate()
                  }
                }}
                placeholder={t('places.categoryNamePlaceholder')}
                autoFocus
                className={`${FIELD_CLS} flex-1`}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                aria-label={t('common.add')}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg disabled:opacity-40"
              >
                <Check size={15} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setNewName('')
                }}
                aria-label={t('common.cancel')}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-m-muted"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
