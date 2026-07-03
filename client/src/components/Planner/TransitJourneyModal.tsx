import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { ArrowRight, ArrowRightLeft, Bold, Clock, Code, Footprints, Heading2, Italic, Link2, List, ListChecks, MoveRight, Pencil, RefreshCw, Strikethrough, TramFront, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { splitReservationDateTime, formatTime } from '../../utils/formatters'
import { TransitTitle, TransitMetaBadges, TransitWalkDivider, fmtTransitDuration } from './transitDisplay'
import type { Reservation } from '../../types'

/**
 * The journey view for an automated public-transit entry (#1065): a roomy modal
 * around the stop-by-stop itinerary. The title renames inline right in the
 * header, notes get the full width with markdown support, and "Change route"
 * re-enters the transit search pre-seeded with this journey's route.
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
  /** Partial field update — endpoints + itinerary stay untouched. */
  onSave: (fields: { title: string; notes: string | null }) => Promise<unknown>
  onDelete: () => Promise<unknown>
  onChangeRoute: () => void
  canEdit: boolean
}

export default function TransitJourneyModal({ reservation, onClose, onSave, onDelete, onChangeRoute, canEdit }: TransitJourneyModalProps) {
  const { t, locale } = useTranslation()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const timeFormat = useSettingsStore(st => st.settings.time_format) || '24h'
  const res = reservation
  const meta = typeof res.metadata === 'string' ? (() => { try { return JSON.parse(res.metadata || '{}') } catch { return {} } })() : (res.metadata || {})
  const transit = meta.transit && Array.isArray(meta.transit.legs) ? meta.transit : null

  const [title, setTitle] = useState(res.title || '')
  const [editingTitle, setEditingTitle] = useState(false)
  const [notes, setNotes] = useState(res.notes || '')
  // Existing notes open rendered; the write tab is for editing.
  const [notesTab, setNotesTab] = useState<'write' | 'preview'>(() => (res.notes ? 'preview' : 'write'))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const notesRef = useRef<HTMLTextAreaElement | null>(null)

  // Markdown toolbar: wrap the selection / prefix the current lines, then
  // restore focus and a sensible cursor.
  const applyMd = (action: { wrap?: [string, string]; linePrefix?: string }) => {
    const el = notesRef.current
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const value = notes
    let next = value
    let selStart = start
    let selEnd = end
    if (action.wrap) {
      const [pre, post] = action.wrap
      const selected = value.slice(start, end)
      next = value.slice(0, start) + pre + selected + post + value.slice(end)
      selStart = start + pre.length
      selEnd = selStart + selected.length
    } else if (action.linePrefix) {
      const prefix = action.linePrefix
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const block = value.slice(lineStart, end)
      const prefixed = block.split('\n').map(l => prefix + l).join('\n')
      next = value.slice(0, lineStart) + prefixed + value.slice(end)
      selStart = start + prefix.length
      selEnd = end + (prefixed.length - block.length)
    }
    setNotes(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(selStart, selEnd)
    })
  }

  const MD_TOOLS: { Icon: typeof Bold; label: string; action: { wrap?: [string, string]; linePrefix?: string } }[] = [
    { Icon: Bold, label: 'Bold', action: { wrap: ['**', '**'] } },
    { Icon: Italic, label: 'Italic', action: { wrap: ['*', '*'] } },
    { Icon: Strikethrough, label: 'Strikethrough', action: { wrap: ['~~', '~~'] } },
    { Icon: Heading2, label: 'Heading', action: { linePrefix: '## ' } },
    { Icon: List, label: 'List', action: { linePrefix: '- ' } },
    { Icon: ListChecks, label: 'Checklist', action: { linePrefix: '- [ ] ' } },
    { Icon: Link2, label: 'Link', action: { wrap: ['[', '](https://)'] } },
    { Icon: Code, label: 'Code', action: { wrap: ['`', '`'] } },
  ]

  useEffect(() => {
    setTitle(res.title || '')
    setNotes(res.notes || '')
    setEditingTitle(false)
    setNotesTab(res.notes ? 'preview' : 'write')
  }, [res.id])

  useEffect(() => { if (editingTitle) titleInputRef.current?.focus() }, [editingTitle])

  const dirty = title !== (res.title || '') || notes !== (res.notes || '')

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), notes: notes.trim() || null })
      onClose()
    } finally { setSaving(false) }
  }

  const { date, time } = splitReservationDateTime(res.reservation_time)
  const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
  const dateStr = date ? new Date(date + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : ''

  const statTiles = transit ? [
    { Icon: Clock, value: transit.duration > 0 ? fmtTransitDuration(transit.duration, t) : '—', label: t('transit.durationLabel') },
    { Icon: ArrowRightLeft, value: String(transit.transfers ?? 0), label: t('transit.transfersLabel') },
    { Icon: Footprints, value: transit.walk_seconds > 59 ? t('transit.min', { count: Math.round(transit.walk_seconds / 60) }) : '—', label: t('transit.walkLabel') },
  ] : []

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('transit.journey')}
      size="2xl"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {canEdit && (
            <button onClick={() => setConfirmDelete(true)} aria-label={t('common.delete')} title={t('common.delete')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: isMobile ? '9px 11px' : '8px 14px', borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Trash2 size={13} /> {!isMobile && t('common.delete')}
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
        {/* header: icon + inline-renamable title + date/time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: '#7c3aed18' }}>
            <TramFront size={isMobile ? 19 : 23} strokeWidth={1.8} color="#7c3aed" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); if (e.key === 'Escape') { setTitle(res.title || ''); setEditingTitle(false) } }}
                className="text-content"
                aria-label={t('reservations.titleLabel')}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', fontSize: 'calc(17px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.015em', borderBottom: '1.5px solid var(--text-primary)' }}
              />
            ) : (
              <div className="text-content" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 'calc(17px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.015em', minWidth: 0 }}>
                <span style={{ minWidth: 0, overflow: 'hidden' }}><TransitTitle title={title} iconSize={15} /></span>
                {canEdit && (
                  <button onClick={() => setEditingTitle(true)} aria-label={t('common.edit')} title={t('common.edit')} className="text-content-faint" style={{ border: 'none', background: 'none', padding: 3, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                    <Pencil size={13} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            )}
            <div className="text-content-muted" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', marginTop: 3 }}>
              {[dateStr, time ? `${formatTime(time, locale, timeFormat)}${endTime ? ` – ${formatTime(endTime, locale, timeFormat)}` : ''}` : ''].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        {transit && (
          <>
            {/* journey stats — three full-width tiles; iconless and flat on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: isMobile ? 6 : 10 }}>
              {statTiles.map(({ Icon, value, label }, i) => (
                isMobile ? (
                  <div key={i} className="bg-surface-tertiary" style={{ padding: '7px 6px 6px', borderRadius: 11, textAlign: 'center', minWidth: 0 }}>
                    <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                    <div className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>{label}</div>
                  </div>
                ) : (
                  <div key={i} className="bg-surface-tertiary" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12 }}>
                    <div className="bg-surface-card" style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                      <Icon size={16} strokeWidth={1.9} className="text-content-muted" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{value}</div>
                      <div className="text-content-faint" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* stop-by-stop itinerary */}
            <div className="bg-surface-tertiary" style={{ padding: isMobile ? '11px 10px' : '14px 16px', borderRadius: 12 }}>
              <div className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
                {t('transit.itinerary')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(transit.legs as TransitLegMeta[]).map((leg, i) => {
                  if (leg.mode === 'WALK') return <TransitWalkDivider key={i} leg={leg} t={t} size={isMobile ? 'sm' : 'md'} />
                  const mins = leg.duration ? Math.round(leg.duration / 60) : null
                  if (isMobile) {
                    // The wide from → to line plus the chip row doesn't fit a
                    // phone: each leg becomes a depart / ride / arrive rail in
                    // the line's color, meta as one quiet text line.
                    const color = leg.line_color || 'var(--text-muted)'
                    const metaLine = [
                      mins ? t('transit.min', { count: mins }) : null,
                      leg.stops ? t('transit.stops', { count: leg.stops }) : null,
                      leg.agency || null,
                    ].filter(Boolean).join(' · ')
                    // Names wrap instead of clipping; the platform gets its
                    // own quiet line below so it never pushes the name out.
                    const stopName = (stop: TransitLegMeta['from']) => (
                      <div style={{ minWidth: 0 }}>
                        <div className="text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                          {stop?.name}
                        </div>
                        {stop?.track && (
                          <div className="text-content-faint" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 500, marginTop: 1 }}>
                            {t('transit.platform', { track: stop.track })}
                          </div>
                        )}
                      </div>
                    )
                    const timeCell = (time?: string | null) => (
                      <div className="text-content-muted" style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, textAlign: 'right', paddingTop: 1 }}>
                        {time || ''}
                      </div>
                    )
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px 14px 1fr', columnGap: 8 }}>
                        {timeCell(leg.from?.time)}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${color}`, background: 'var(--bg-tertiary)', flexShrink: 0, marginTop: 3 }} />
                          <span style={{ flex: 1, width: 3, borderRadius: 2, background: color, marginTop: 2 }} />
                        </div>
                        {stopName(leg.from)}
                        <div />
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span style={{ width: 3, borderRadius: 2, background: color }} />
                        </div>
                        <div style={{ padding: '6px 0 8px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', background: leg.line_color || 'var(--bg-hover)', color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)', borderRadius: 6, padding: '1px 7px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, flexShrink: 0 }}>
                              {leg.line || leg.mode}
                            </span>
                            {leg.headsign && (
                              <span className="text-content-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', minWidth: 0 }}>
                                <MoveRight size={10} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leg.headsign}</span>
                              </span>
                            )}
                          </div>
                          {metaLine && (
                            <div className="text-content-faint" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', marginTop: 3 }}>{metaLine}</div>
                          )}
                        </div>
                        {timeCell(leg.to?.time)}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2.5px solid ${color}`, background: 'var(--bg-tertiary)', marginTop: 3 }} />
                        </div>
                        {stopName(leg.to)}
                      </div>
                    )
                  }
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div className="text-content-muted" style={{ width: 44, flexShrink: 0, textAlign: 'right', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, paddingTop: 1 }}>
                        {leg.from?.time || ''}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: leg.line_color || 'var(--bg-hover)', color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)', borderRadius: 6, padding: '2px 8px', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 700, flexShrink: 0 }}>
                        {leg.line || leg.mode}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-content" style={{ fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{leg.from?.name}</span>
                          {leg.from?.track && <span className="text-content-faint" style={{ fontWeight: 500 }}>({t('transit.platform', { track: leg.from.track })})</span>}
                          <ArrowRight size={12} className="text-content-faint" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{leg.to?.name}</span>
                        </div>
                        <div style={{ marginTop: 3 }}>
                          <TransitMetaBadges items={[
                            { icon: Clock, text: leg.from?.time ? `${leg.from.time}${leg.to?.time ? ` – ${leg.to.time}` : ''}` : '' },
                            { text: mins ? t('transit.min', { count: mins }) : '' },
                            { text: leg.stops ? t('transit.stops', { count: leg.stops }) : '' },
                            { icon: MoveRight, text: leg.headsign || '' },
                            { text: leg.agency || '', dim: true },
                          ]} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* notes — full width, markdown */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
            <label className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('reservations.notes')}</label>
            {canEdit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {notesTab === 'write' && (
                  <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 8, padding: 2, gap: 1 }}>
                    {MD_TOOLS.map(({ Icon, label, action }) => (
                      <button key={label} type="button" onClick={() => applyMd(action)} title={label} aria-label={label}
                        className="text-content-muted"
                        style={{ width: 26, height: 24, display: 'grid', placeItems: 'center', borderRadius: 6, border: 0, background: 'transparent', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <Icon size={13} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 8, padding: 2, gap: 2 }}>
                  {([['write', t('common.edit')], ['preview', t('common.preview')]] as const).map(([tab, label]) => (
                    <button key={tab} type="button" onClick={() => setNotesTab(tab)}
                      className={notesTab === tab ? 'bg-surface-card text-content' : 'text-content-muted'}
                      style={{ padding: '4px 12px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, borderRadius: 6, border: 0, cursor: 'pointer', fontFamily: 'inherit', background: notesTab === tab ? undefined : 'transparent' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {canEdit && notesTab === 'write' ? (
            <textarea
              ref={notesRef}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('reservations.notesPlaceholder')}
              className="w-full border border-edge rounded-[10px] px-[12px] py-[10px] text-[13px] font-[inherit] outline-none box-border text-content bg-surface-input"
              style={{ minHeight: 130, resize: 'vertical', lineHeight: 1.55 }}
            />
          ) : (
            <div className="bg-surface-tertiary" style={{ borderRadius: 10, padding: '12px 14px', minHeight: canEdit ? 130 : undefined }}>
              {notes.trim()
                ? <div className="collab-note-md text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', wordBreak: 'break-word', overflowWrap: 'anywhere' }}><Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{notes}</Markdown></div>
                : <span className="text-content-faint" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))' }}>{t('reservations.notesPlaceholder')}</span>}
            </div>
          )}
        </div>
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
