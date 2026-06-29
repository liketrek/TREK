import ReactDOM from 'react-dom'
import { X, MapPin, Ticket, Check } from 'lucide-react'
import { filesApi } from '../../api/client'
import type { Place, Reservation, Day } from '../../types'
import type { FileManagerState } from './useFileManager'
import { TRANSPORT_TYPES } from './FileManager.constants'
import { transportIcon } from './FileManager.helpers'

export function AssignModal(S: FileManagerState) {
  const { files, assignFileId, setAssignFileId, t, days, assignments, places, reservations, tripId, handleAssign, refreshFiles } = S
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => setAssignFileId(null)}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: 'min(600px, calc(100vw - 32px))', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, color: 'var(--text-primary)' }}>{t('files.assignTitle')}</div>
            <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {files.find(f => f.id === assignFileId)?.original_name || ''}
            </div>
          </div>
          <button onClick={() => setAssignFileId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, display: 'flex', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '8px 12px 0' }}>
          <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '0 2px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('files.noteLabel') || 'Note'}
          </div>
          <input
            type="text"
            placeholder={t('files.notePlaceholder')}
            defaultValue={files.find(f => f.id === assignFileId)?.description || ''}
            onBlur={e => {
              const val = e.target.value.trim()
              const file = files.find(f => f.id === assignFileId)
              if (file && val !== (file.description || '')) {
                handleAssign(file.id, { description: val } as any)
              }
            }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            style={{
              width: '100%', padding: '7px 10px', fontSize: 'calc(13px * var(--fs-scale-body, 1))', borderRadius: 8,
              border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto', padding: 8 }}>
          {(() => {
            const file = files.find(f => f.id === assignFileId)
            if (!file) return null
            const assignedPlaceIds = new Set<number>()
            const dayGroups: { day: Day; dayPlaces: Place[] }[] = []
            for (const day of days) {
              const da = assignments[String(day.id)] || []
              const dayPlaces = da.map(a => places.find(p => p.id === a.place?.id || p.id === a.place_id)).filter(Boolean) as Place[]
              if (dayPlaces.length > 0) {
                dayGroups.push({ day, dayPlaces })
                dayPlaces.forEach(p => assignedPlaceIds.add(p.id))
              }
            }
            const unassigned = places.filter(p => !assignedPlaceIds.has(p.id))
            const placeBtn = (p: Place, idx: number) => {
              const isLinked = file.place_id === p.id || (file.linked_place_ids || []).includes(p.id)
              return (
                <button key={`${p.id}-${idx}`} onClick={async () => {
                  if (isLinked) {
                    if (file.place_id === p.id) {
                      await handleAssign(file.id, { place_id: null })
                    } else {
                      try {
                        const linksRes = await filesApi.getLinks(tripId, file.id)
                        const link = (linksRes.links || []).find((l: any) => l.place_id === p.id)
                        if (link) await filesApi.removeLink(tripId, file.id, link.id)
                        refreshFiles()
                      } catch {}
                    }
                  } else {
                    if (!file.place_id) {
                      await handleAssign(file.id, { place_id: p.id })
                    } else {
                      try {
                        await filesApi.addLink(tripId, file.id, { place_id: p.id })
                        refreshFiles()
                      } catch {}
                    }
                  }
                }} style={{
                  width: '100%', textAlign: 'left', padding: '6px 10px 6px 20px', background: isLinked ? 'var(--bg-hover)' : 'none',
                  border: 'none', cursor: 'pointer', fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-primary)',
                  borderRadius: 8, fontFamily: 'inherit', fontWeight: isLinked ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = isLinked ? 'var(--bg-hover)' : 'transparent'}>
                  <MapPin size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  {isLinked && <Check size={14} style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--accent)' }} />}
                </button>
              )
            }

            const placesSection = places.length > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('files.assignPlace')}
                </div>
                {dayGroups.map(({ day, dayPlaces }) => (
                  <div key={day.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', padding: '8px 10px 2px' }}>
                      <span>{day.title || t('dayplan.dayN', { n: day.day_number })}</span>
                      {(() => {
                        const badge = day.date || (day.title ? t('dayplan.dayN', { n: day.day_number }) : null)
                        return badge ? (
                          <span style={{
                            fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)',
                            background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 999,
                          }}>{badge}</span>
                        ) : null
                      })()}
                    </div>
                    {dayPlaces.map(placeBtn)}
                  </div>
                ))}
                {unassigned.length > 0 && (
                  <div>
                    {dayGroups.length > 0 && <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', padding: '8px 10px 2px' }}>{t('files.unassigned')}</div>}
                    {unassigned.map(placeBtn)}
                  </div>
                )}
              </div>
            )

            const bookingReservations = reservations.filter(r => !TRANSPORT_TYPES.has(r.type))
            const transportReservations = reservations.filter(r => TRANSPORT_TYPES.has(r.type))

            const reservationBtn = (r: Reservation) => {
              const isLinked = file.reservation_id === r.id || (file.linked_reservation_ids || []).includes(r.id)
              const Icon = TRANSPORT_TYPES.has(r.type) ? transportIcon(r.type) : Ticket
              return (
                <button key={r.id} onClick={async () => {
                  if (isLinked) {
                    if (file.reservation_id === r.id) {
                      await handleAssign(file.id, { reservation_id: null })
                    } else {
                      try {
                        const linksRes = await filesApi.getLinks(tripId, file.id)
                        const link = (linksRes.links || []).find((l: any) => l.reservation_id === r.id)
                        if (link) await filesApi.removeLink(tripId, file.id, link.id)
                        refreshFiles()
                      } catch {}
                    }
                  } else {
                    if (!file.reservation_id) {
                      await handleAssign(file.id, { reservation_id: r.id })
                    } else {
                      try {
                        await filesApi.addLink(tripId, file.id, { reservation_id: r.id })
                        refreshFiles()
                      } catch {}
                    }
                  }
                }} style={{
                  width: '100%', textAlign: 'left', padding: '6px 10px 6px 20px', background: isLinked ? 'var(--bg-hover)' : 'none',
                  border: 'none', cursor: 'pointer', fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-primary)',
                  borderRadius: 8, fontFamily: 'inherit', fontWeight: isLinked ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = isLinked ? 'var(--bg-hover)' : 'transparent'}>
                  <Icon size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                  {isLinked && <Check size={14} style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--accent)' }} />}
                </button>
              )
            }

            const bookingsSection = reservations.length > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                {bookingReservations.length > 0 && (
                  <>
                    <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('files.assignBooking')}
                    </div>
                    {bookingReservations.map(reservationBtn)}
                  </>
                )}
                {transportReservations.length > 0 && (
                  <>
                    <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: bookingReservations.length > 0 ? 4 : 0 }}>
                      {t('files.assignTransport')}
                    </div>
                    {transportReservations.map(reservationBtn)}
                  </>
                )}
              </div>
            )

            const hasBoth = placesSection && bookingsSection
            return (
              <div className={hasBoth ? 'md:flex' : ''}>
                <div className={hasBoth ? 'md:w-1/2' : ''} style={{ overflowY: 'auto', maxHeight: '55vh', paddingRight: hasBoth ? 6 : 0 }}>{placesSection}</div>
                {hasBoth && <div className="hidden md:block" style={{ width: 1, background: 'var(--border-primary)', flexShrink: 0 }} />}
                {hasBoth && <div className="block md:hidden" style={{ height: 1, background: 'var(--border-primary)', margin: '8px 0' }} />}
                <div className={hasBoth ? 'md:w-1/2' : ''} style={{ overflowY: 'auto', maxHeight: '55vh', paddingLeft: hasBoth ? 6 : 0 }}>{bookingsSection}</div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>,
    document.body
  )
}
