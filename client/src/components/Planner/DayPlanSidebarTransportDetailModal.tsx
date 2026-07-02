import ReactDOM from 'react-dom'
import { Ticket, FileText, ExternalLink, Footprints, ArrowRight } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { useSettingsStore } from '../../store/settingsStore'
import { useTripStore } from '../../store/tripStore'
import { formatTime, splitReservationDateTime } from '../../utils/formatters'
import { RES_ICONS, TRANSPORT_DETAIL_COLORS } from './DayPlanSidebar.constants'
import type { Reservation } from '../../types'

interface DayPlanSidebarTransportDetailModalProps {
  transportDetail: Reservation | null
  setTransportDetail: (v: Reservation | null) => void
  onNavigateToFiles?: () => void
  t: (key: string, params?: Record<string, any>) => string
  locale: string
  timeFormat: string
}

export function DayPlanSidebarTransportDetailModal({
  transportDetail, setTransportDetail, onNavigateToFiles, t, locale, timeFormat,
}: DayPlanSidebarTransportDetailModalProps) {
  if (!transportDetail) return null
  return ReactDOM.createPortal(
    <div className="bg-[rgba(0,0,0,0.3)]" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)',
    }} onClick={() => setTransportDetail(null)}>
      <div className="bg-surface-card" style={{
        width: 380, maxHeight: '80vh', overflowY: 'auto',
        borderRadius: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)', padding: '22px 22px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }} onClick={e => e.stopPropagation()}>
        {(() => {
          const res = transportDetail
          const TransportIcon = RES_ICONS[res.type] || Ticket
          const TRANSPORT_COLORS = TRANSPORT_DETAIL_COLORS
          const color = TRANSPORT_COLORS[res.type] || 'var(--text-muted)'
          const meta = typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {})

          const detailFields = []
          if (res.type === 'flight') {
            if (meta.airline) detailFields.push({ label: t('reservations.meta.airline'), value: meta.airline })
            if (meta.flight_number) detailFields.push({ label: t('reservations.meta.flightNumber'), value: meta.flight_number })
            if (meta.departure_airport) detailFields.push({ label: t('reservations.meta.from'), value: meta.departure_airport })
            if (meta.arrival_airport) detailFields.push({ label: t('reservations.meta.to'), value: meta.arrival_airport })
            if (meta.seat) detailFields.push({ label: t('reservations.meta.seat'), value: meta.seat })
          } else if (res.type === 'train') {
            if (meta.train_number) detailFields.push({ label: t('reservations.meta.trainNumber'), value: meta.train_number })
            if (meta.platform) detailFields.push({ label: t('reservations.meta.platform'), value: meta.platform })
            if (meta.seat) detailFields.push({ label: t('reservations.meta.seat'), value: meta.seat })
          }
          if (res.confirmation_number) detailFields.push({ label: t('reservations.confirmationCode'), value: res.confirmation_number, sensitive: true })
          if (res.location) detailFields.push({ label: t('reservations.locationAddress'), value: res.location })

          return (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', background: `${color}18`,
                }}>
                  <TransportIcon size={18} strokeWidth={1.8} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600 }}>{res.title}</div>
                  <div className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 2 }}>
                    {(() => {
                      const { date, time } = splitReservationDateTime(res.reservation_time)
                      const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
                      const dateStr = date
                        ? new Date(date + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
                        : ''
                      const timeStr = time ? formatTime(time, locale, timeFormat) : ''
                      const endStr = endTime ? formatTime(endTime, locale, timeFormat) : ''
                      const parts: string[] = []
                      if (dateStr) parts.push(dateStr)
                      if (timeStr) parts.push(timeStr + (endStr ? ` – ${endStr}` : ''))
                      return parts.join(', ')
                    })()}
                  </div>
                </div>
                <div className={res.status === 'confirmed' ? 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]' : 'bg-[rgba(217,119,6,0.1)] text-[#d97706]'} style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600,
                }}>
                  {(res.status === 'confirmed' ? t('planner.resConfirmed') : t('planner.resPending')).replace(/\s*·\s*$/, '')}
                </div>
              </div>

              {/* Detail-Felder */}
              {detailFields.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {detailFields.map((f, i) => {
                    const shouldBlur = f.sensitive && useSettingsStore.getState().settings.blur_booking_codes
                    return (
                      <div key={i} className="bg-surface-tertiary" style={{ padding: '8px 10px', borderRadius: 8 }}>
                        <div className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{f.label}</div>
                        <div
                          onMouseEnter={e => { if (shouldBlur) e.currentTarget.style.filter = 'none' }}
                          onMouseLeave={e => { if (shouldBlur) e.currentTarget.style.filter = 'blur(5px)' }}
                          onClick={e => { if (shouldBlur) { const el = e.currentTarget; el.style.filter = el.style.filter === 'none' ? 'blur(5px)' : 'none' } }}
                          className="text-content"
                          style={{
                            fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, wordBreak: 'break-word',
                            filter: shouldBlur ? 'blur(5px)' : 'none', transition: 'filter 0.2s',
                            cursor: shouldBlur ? 'pointer' : 'default',
                            userSelect: shouldBlur ? 'none' : 'auto',
                          }}
                        >{f.value}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Public-transit itinerary (#1065) — legs from the transit search */}
              {meta.transit?.legs && Array.isArray(meta.transit.legs) && meta.transit.legs.length > 0 && (
                <div className="bg-surface-tertiary" style={{ padding: '10px 12px', borderRadius: 8 }}>
                  <div className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
                    {t('transit.itinerary')}
                    {typeof meta.transit.transfers === 'number' && meta.transit.transfers > 0 && ` · ${t('transit.transfers', { count: meta.transit.transfers })}`}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {meta.transit.legs.map((leg: { mode?: string; line?: string | null; line_color?: string | null; line_text_color?: string | null; headsign?: string | null; duration?: number; stops?: number; from?: { name?: string; time?: string | null }; to?: { name?: string; time?: string | null } }, i: number) => {
                      const isWalk = leg.mode === 'WALK'
                      const mins = leg.duration ? Math.round(leg.duration / 60) : null
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {isWalk ? (
                            <span className="text-content-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 1 }}>
                              <Footprints size={12} />
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', background: leg.line_color || 'var(--bg-hover)', color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)', borderRadius: 5, padding: '1px 6px', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, flexShrink: 0 }}>
                              {leg.line || leg.mode}
                            </span>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="text-content" style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              {isWalk
                                ? <span className="text-content-muted">{t('transit.walkTo', { name: leg.to?.name || '' })}</span>
                                : <>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{leg.from?.name}</span>
                                    <ArrowRight size={10} className="text-content-faint" style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{leg.to?.name}</span>
                                  </>}
                            </div>
                            <div className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', marginTop: 1 }}>
                              {[
                                leg.from?.time && !isWalk ? `${leg.from.time}${leg.to?.time ? ` – ${leg.to.time}` : ''}` : null,
                                mins ? t('transit.min', { count: mins }) : null,
                                !isWalk && leg.stops ? t('transit.stops', { count: leg.stops }) : null,
                                !isWalk && leg.headsign ? `→ ${leg.headsign}` : null,
                              ].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notizen */}
              {res.notes && (
                <div className="bg-surface-tertiary" style={{ padding: '8px 10px', borderRadius: 8 }}>
                  <div className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 3 }}>{t('reservations.notes')}</div>
                  <div className="collab-note-md text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', wordBreak: 'break-word', overflowWrap: 'anywhere' }}><Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{res.notes}</Markdown></div>
                </div>
              )}

              {/* Dateien */}
              {(() => {
                const resFiles = (useTripStore.getState().files || []).filter(f =>
                  !f.deleted_at && (
                    f.reservation_id === res.id ||
                    (f.linked_reservation_ids && f.linked_reservation_ids.includes(res.id))
                  )
                )
                if (resFiles.length === 0) return null
                return (
                  <div>
                    <div className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>{t('files.title')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {resFiles.map(f => (
                        <div key={f.id}
                          onClick={() => { setTransportDetail(null); onNavigateToFiles?.() }}
                          className="bg-surface-tertiary"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                            borderRadius: 8, cursor: 'pointer',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        >
                          <FileText size={14} className="text-content-muted" style={{ flexShrink: 0 }} />
                          <span className="text-content" style={{ flex: 1, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.original_name}
                          </span>
                          <ExternalLink size={11} className="text-content-faint" style={{ flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Schließen */}
              <div style={{ textAlign: 'right' }}>
                <button onClick={() => setTransportDetail(null)} className="bg-accent text-accent-text" style={{
                  fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                  border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                }}>
                  {t('common.close')}
                </button>
              </div>
            </>
          )
        })()}
      </div>
    </div>,
    document.body
  )
}
