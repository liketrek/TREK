import { useEffect, useState } from 'react'
import { ArrowRight, Footprints, Pencil, RefreshCw, TramFront, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { splitReservationDateTime, formatTime } from '../../utils/formatters'
import type { Reservation } from '../../types'

/**
 * The journey view for an automated public-transit entry (#1065): a roomy modal
 * that shows the full itinerary (summary + stop-by-stop legs) together with the
 * editable booking fields — the generic transport form never opens for transit.
 * "Change route" re-enters the transit search pre-seeded with this journey's
 * origin/destination and replaces the itinerary on save.
 */

interface TransitLegMeta {
  mode?: string
  line?: string | null
  line_color?: string | null
  line_text_color?: string | null
  headsign?: string | null
  agency?: string | null
  duration?: number
  stops?: number
  from?: { name?: string; time?: string | null; track?: string | null }
  to?: { name?: string; time?: string | null; track?: string | null }
}

interface TransitJourneyModalProps {
  reservation: Reservation
  onClose: () => void
  /** Partial field update (title/status/confirmation/notes) — endpoints + itinerary stay untouched. */
  onSave: (fields: { title: string; status: string; confirmation_number: string | null; notes: string | null }) => Promise<unknown>
  onDelete: () => Promise<unknown>
  onChangeRoute: () => void
  canEdit: boolean
}

export default function TransitJourneyModal({ reservation, onClose, onSave, onDelete, onChangeRoute, canEdit }: TransitJourneyModalProps) {
  const { t, locale } = useTranslation()
  const timeFormat = useSettingsStore(st => st.settings.time_format) || '24h'
  const res = reservation
  const meta = typeof res.metadata === 'string' ? (() => { try { return JSON.parse(res.metadata || '{}') } catch { return {} } })() : (res.metadata || {})
  const transit = meta.transit && Array.isArray(meta.transit.legs) ? meta.transit : null

  const [title, setTitle] = useState(res.title || '')
  const [status, setStatus] = useState(res.status || 'confirmed')
  const [confirmation, setConfirmation] = useState(res.confirmation_number || '')
  const [notes, setNotes] = useState(res.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(res.title || '')
    setStatus(res.status || 'confirmed')
    setConfirmation(res.confirmation_number || '')
    setNotes(res.notes || '')
  }, [res.id])

  const dirty = title !== (res.title || '') || status !== (res.status || 'confirmed')
    || confirmation !== (res.confirmation_number || '') || notes !== (res.notes || '')

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), status, confirmation_number: confirmation.trim() || null, notes: notes.trim() || null })
      onClose()
    } finally { setSaving(false) }
  }

  const { date, time } = splitReservationDateTime(res.reservation_time)
  const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
  const dateStr = date ? new Date(date + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : ''

  const inputClass = 'w-full border border-edge rounded-[10px] px-[12px] py-[9px] text-[13px] font-[inherit] outline-none box-border text-content bg-surface-input'
  const labelClass = 'block text-[11px] font-semibold text-content-faint mb-[5px] uppercase tracking-[0.03em]'

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('transit.journey')}
      size="2xl"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canEdit && (
            <button onClick={() => setConfirmDelete(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Trash2 size={13} /> {t('common.delete')}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {canEdit && (
            <button onClick={onChangeRoute} className="text-content-muted" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
              border: '1px solid var(--border-primary)', background: 'none',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RefreshCw size={13} /> {t('transit.changeRoute')}
            </button>
          )}
          {canEdit ? (
            <button onClick={save} disabled={saving || !title.trim() || !dirty} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{
              padding: '8px 20px', borderRadius: 10, border: 'none',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              opacity: saving || !title.trim() || !dirty ? 0.5 : 1,
            }}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          ) : (
            <button onClick={onClose} className="bg-accent text-accent-text" style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('common.close')}
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'var(--font-system)' }}>
        {/* header: route + date/time + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: '#7c3aed18' }}>
            <TramFront size={22} strokeWidth={1.8} color="#7c3aed" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-content" style={{ fontSize: 'calc(17px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</div>
            <div className="text-content-muted" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', marginTop: 2 }}>
              {[dateStr, time ? `${formatTime(time, locale, timeFormat)}${endTime ? ` – ${formatTime(endTime, locale, timeFormat)}` : ''}` : ''].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className={status === 'confirmed' ? 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]' : 'bg-[rgba(217,119,6,0.1)] text-[#d97706]'} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, flexShrink: 0 }}>
            {(status === 'confirmed' ? t('planner.resConfirmed') : t('planner.resPending')).replace(/\s*·\s*$/, '')}
          </div>
        </div>

        {transit && (
          <>
            {/* journey summary */}
            <div className="bg-surface-tertiary text-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, flexWrap: 'wrap' }}>
              {transit.duration > 0 && (
                <span>{Math.floor(transit.duration / 3600) > 0 ? `${Math.floor(transit.duration / 3600)} h ${Math.round((transit.duration % 3600) / 60)} min` : t('transit.min', { count: Math.round(transit.duration / 60) })}</span>
              )}
              <span className="text-content-faint">·</span>
              <span>{transit.transfers > 0 ? t('transit.transfers', { count: transit.transfers }) : t('transit.direct')}</span>
              {transit.walk_seconds > 59 && (
                <>
                  <span className="text-content-faint">·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Footprints size={14} /> {t('transit.min', { count: Math.round(transit.walk_seconds / 60) })}</span>
                </>
              )}
            </div>

            {/* stop-by-stop itinerary — roomy */}
            <div className="bg-surface-tertiary" style={{ padding: '14px 16px', borderRadius: 12 }}>
              <div className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
                {t('transit.itinerary')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(transit.legs as TransitLegMeta[]).map((leg, i) => {
                  const isWalk = leg.mode === 'WALK'
                  const mins = leg.duration ? Math.round(leg.duration / 60) : null
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div className="text-content-muted" style={{ width: 44, flexShrink: 0, textAlign: 'right', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, paddingTop: 1 }}>
                        {!isWalk && leg.from?.time ? leg.from.time : ''}
                      </div>
                      {isWalk ? (
                        <span className="text-content-faint" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                          <Footprints size={14} />
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: leg.line_color || 'var(--bg-hover)', color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)', borderRadius: 6, padding: '2px 8px', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 700, flexShrink: 0 }}>
                          {leg.line || leg.mode}
                        </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-content" style={{ fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          {isWalk
                            ? <span className="text-content-muted" style={{ fontWeight: 500 }}>{t('transit.walkTo', { name: leg.to?.name || '' })}</span>
                            : <>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{leg.from?.name}</span>
                                {leg.from?.track && <span className="text-content-faint" style={{ fontWeight: 500 }}>({t('transit.platform', { track: leg.from.track })})</span>}
                                <ArrowRight size={12} className="text-content-faint" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{leg.to?.name}</span>
                              </>}
                        </div>
                        <div className="text-content-faint" style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', marginTop: 3 }}>
                          {[
                            !isWalk && leg.from?.time ? `${leg.from.time}${leg.to?.time ? ` – ${leg.to.time}` : ''}` : null,
                            mins ? t('transit.min', { count: mins }) : null,
                            !isWalk && leg.stops ? t('transit.stops', { count: leg.stops }) : null,
                            !isWalk && leg.headsign ? `→ ${leg.headsign}` : null,
                            !isWalk ? leg.agency : null,
                          ].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* editable booking fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div>
            <label className={labelClass}>{t('reservations.titleLabel')} *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('reservations.status')}</label>
            <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 10, padding: 3, gap: 2 }}>
              {(['pending', 'confirmed'] as const).map(sv => (
                <button key={sv} type="button" disabled={!canEdit} onClick={() => setStatus(sv)}
                  className={status === sv ? 'bg-surface-card text-content' : 'text-content-muted'}
                  style={{ flex: 1, padding: '7px 4px', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 500, borderRadius: 8, border: 0, cursor: canEdit ? 'pointer' : 'default', fontFamily: 'inherit', background: status === sv ? undefined : 'transparent', whiteSpace: 'nowrap' }}>
                  {(sv === 'confirmed' ? t('planner.resConfirmed') : t('planner.resPending')).replace(/\s*·\s*$/, '')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <label className={labelClass}>{t('reservations.confirmationCode')}</label>
            <input value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={!canEdit} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('reservations.notes')}</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} disabled={!canEdit} placeholder={canEdit ? t('reservations.notesPlaceholder') : undefined} className={inputClass} />
          </div>
        </div>

        {canEdit && !transit && (
          <div className="text-content-faint" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))' }}>
            <Pencil size={11} /> {t('transit.noItinerary')}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => { setConfirmDelete(false); await onDelete(); onClose() }}
        title={t('reservations.confirm.deleteTitle')}
        message={t('reservations.confirm.deleteBody', { name: res.title })}
      />
    </Modal>
  )
}
