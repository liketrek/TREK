import ReactDOM from 'react-dom'
import { CalendarDays, Pencil, Trash2, ChevronDown, Check, Eye } from 'lucide-react'
import type { SidebarState } from './usePlacesSidebar'

export function MobileDayPickerSheet(S: SidebarState) {
  const {
    dayPickerPlace, setDayPickerPlace, setMobileShowDays, onPlaceClick, canEditPlaces, onEditPlace,
    t, days, mobileShowDays, onAssignToDay, assignments, onDeletePlace,
  } = S
  return ReactDOM.createPortal(
    <div
      onClick={() => { setDayPickerPlace(null); setMobileShowDays(false) }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-card"
        style={{ borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 'var(--bottom-nav-h)' }}
      >
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700 }}>{dayPickerPlace.name}</div>
          {dayPickerPlace.address && <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 2 }}>{dayPickerPlace.address}</div>}
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 12px' }}>
          {/* View details */}
          <button
            onClick={() => { onPlaceClick(dayPickerPlace.id); setDayPickerPlace(null); setMobileShowDays(false) }}
            className="bg-transparent text-content"
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}
          >
            <Eye size={18} color="var(--text-muted)" /> {t('places.viewDetails')}
          </button>
          {/* Edit */}
          {canEditPlaces && (
            <button
              onClick={() => { onEditPlace(dayPickerPlace); setDayPickerPlace(null); setMobileShowDays(false) }}
              className="bg-transparent text-content"
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}
            >
              <Pencil size={18} color="var(--text-muted)" /> {t('common.edit')}
            </button>
          )}
          {/* Assign to day */}
          {days?.length > 0 && (
            <>
              <button
                onClick={() => setMobileShowDays(v => !v)}
                className="bg-transparent text-content"
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}
              >
                <CalendarDays size={18} color="var(--text-muted)" /> {t('places.assignToDay')}
                <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'var(--text-faint)', transform: mobileShowDays ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {mobileShowDays && (
                <div style={{ paddingLeft: 20 }}>
                  {days.map((day, i) => (
                    <button
                      key={day.id}
                      onClick={() => { onAssignToDay(dayPickerPlace.id, day.id); setDayPickerPlace(null); setMobileShowDays(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', textAlign: 'left' }}
                    >
                      <div className="bg-surface-tertiary text-content" style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500 }}>{day.title || t('dayplan.dayN', { n: i + 1 })}</div>
                        {day.date && <div className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>{new Date(day.date + 'T00:00:00Z').toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>}
                      </div>
                      {(assignments[String(day.id)] || []).some(a => a.place?.id === dayPickerPlace.id) && <Check size={14} color="var(--text-faint)" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {/* Delete */}
          {canEditPlaces && (
            <button
              onClick={() => { onDeletePlace(dayPickerPlace.id); setDayPickerPlace(null); setMobileShowDays(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', textAlign: 'left', fontSize: 'calc(14px * var(--fs-scale-body, 1))', color: '#ef4444' }}
            >
              <Trash2 size={18} /> {t('common.delete')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
