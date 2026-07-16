import { useState } from 'react'
import { Ban, Check, Plus } from 'lucide-react'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { FIELD_CLS } from './PlSheetChrome'
import type { Category } from '../../../../types'
import type { TripPlanner } from '../MTripShell'

interface PlCategoryPickerProps {
  planner: TripPlanner
  /** Selected category id as string, '' = no category (form convention). */
  value: string
  onChange: (categoryId: string) => void
}

const PILL_BASE =
  'flex flex-none items-center gap-[5px] rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold'

/**
 * Category pills of the place form: "no category" + every trip category, plus
 * an inline create flow (dashed pill → name input) the demo leaves out but the
 * desktop form has — new categories are selected right away.
 */
export default function PlCategoryPicker({ planner, value, onChange }: PlCategoryPickerProps) {
  const { t, toast, categories, tripActions } = planner
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim() || saving) return
    setSaving(true)
    try {
      const created: Category = await tripActions.addCategory({ name: newName.trim(), color: '#6366f1', icon: 'MapPin' })
      onChange(String(created.id))
      setNewName('')
      setCreating(false)
    } catch {
      toast.error(t('places.categoryCreateError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-[6px]">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`${PILL_BASE} ${value === '' ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'}`}
      >
        <Ban size={13} strokeWidth={2} />
        {t('places.noCategory')}
      </button>
      {(categories || []).map(cat => {
        const active = value === String(cat.id)
        const Icon = getCategoryIcon(cat.icon)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(String(cat.id))}
            className={`${PILL_BASE} ${active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'}`}
          >
            <Icon size={13} strokeWidth={2} />
            {cat.name}
          </button>
        )
      })}
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={`${PILL_BASE} border-[1.5px] border-dashed border-[color:var(--m-trackoff)] text-m-muted`}
        >
          <Plus size={13} strokeWidth={2.2} />
          {t('mobileTrip.newCategory')}
        </button>
      ) : (
        <div className="mt-1 flex w-full items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
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
            className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40"
          >
            <Check size={15} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false)
              setNewName('')
            }}
            className="flex-none text-[0.78125rem] font-semibold text-m-muted"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
