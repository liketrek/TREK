import { useState } from 'react'
import { Plus, X, MapPin } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { Place, AssignmentsMap } from '../../types'

export function MobileAddPlaceButton({ dayId, places, assignments, onAssign, onAddNew }: {
  dayId: number
  places: Place[]
  assignments: AssignmentsMap
  onAssign?: (placeId: number, dayId: number) => void
  onAddNew?: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Find places not assigned to this day
  const assignedToDay = new Set((assignments[String(dayId)] || []).map(a => a.place_id))
  const available = places.filter(p => !assignedToDay.has(p.id))
  const filtered = search.trim()
    ? available.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : available

  return (
    <div className="md:hidden" style={{ padding: '8px 12px 12px' }}>
      {!open ? (
        <button
          onClick={e => { e.stopPropagation(); setOpen(true) }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 0', borderRadius: 12,
            border: '1.5px dashed var(--border-primary)',
            background: 'transparent', color: 'var(--text-muted)',
            fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Add Place
        </button>
      ) : (
        <div style={{ borderRadius: 14, border: '1px solid var(--border-primary)', background: 'var(--bg-card)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-faint)', display: 'flex', gap: 6 }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('dayplan.mobile.searchPlaces')}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontFamily: 'inherit', color: 'var(--text-primary)' }}
            />
            <button onClick={() => { setOpen(false); setSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)' }}>
                {available.length === 0 ? t('dayplan.mobile.allAssigned') : t('dayplan.mobile.noMatch')}
              </div>
            )}
            {filtered.slice(0, 20).map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onAssign?.(p.id, dayId)
                  setOpen(false)
                  setSearch('')
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <MapPin size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
            ))}
          </div>
          {onAddNew && (
            <button
              onClick={() => { onAddNew(); setOpen(false); setSearch('') }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 0', borderTop: '1px solid var(--border-faint)',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              Create new place
            </button>
          )}
        </div>
      )}
    </div>
  )
}
