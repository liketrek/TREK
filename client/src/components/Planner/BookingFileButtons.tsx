import { useEffect, useRef, useState } from 'react'
import { Paperclip, Link2, FileText } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { TripFile } from '../../types'

/**
 * The file actions of a booking or transport dialog: attach a new file, and
 * once the record exists link a file the trip already has. Two equal buttons
 * side by side, the same row the Costs block uses below them.
 */
export function BookingFileButtons({ canAttach, uploading, onAttach, linkable, onLink }: {
  canAttach: boolean
  uploading: boolean
  onAttach: () => void
  /** Files of the trip this record could take; empty (or before the first save) hides the link button. */
  linkable: TripFile[]
  /** Links one; resolves true when it worked, which closes the list. */
  onLink: (file: TripFile) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  const canLink = linkable.length > 0
  if (!canAttach && !canLink) return null

  const buttonClass = 'bg-surface-secondary border border-edge text-content transition-colors hover:bg-surface-tertiary disabled:cursor-default disabled:opacity-60'
  const buttonStyle = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 13px',
    borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  } as const

  return (
    <div style={{ display: 'grid', gridTemplateColumns: canAttach && canLink ? '1fr 1fr' : '1fr', gap: 8 }}>
      {canAttach && (
        <button type="button" onClick={onAttach} disabled={uploading} className={buttonClass} style={buttonStyle}>
          <Paperclip size={14} />
          {uploading ? t('reservations.uploading') : t('reservations.attachFile')}
        </button>
      )}
      {canLink && (
        <div ref={pickerRef} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className={buttonClass} style={buttonStyle}>
            <Link2 size={14} /> {t('reservations.linkExisting')}
          </button>
          {open && (
            <div className="bg-surface-card" style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6, zIndex: 50,
              border: '1px solid var(--border-secondary)', borderRadius: 12,
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.06)', padding: 6, maxHeight: 220, overflowY: 'auto',
            }}>
              {linkable.map(f => (
                <button key={f.id} type="button" onClick={async () => { if (await onLink(f)) setOpen(false) }}
                  className="text-content transition-colors hover:bg-surface-tertiary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px',
                    border: 'none', cursor: 'pointer', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontFamily: 'inherit',
                    borderRadius: 8, textAlign: 'left',
                  }}>
                  <FileText size={13} className="text-content-faint" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
