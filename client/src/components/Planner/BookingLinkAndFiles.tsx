import type { ChangeEvent, RefObject } from 'react'
import { ExternalLink, FileText, Link2, X } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { openFile } from '../../utils/fileDownload'
import { BookingFileButtons } from './BookingFileButtons'
import { useFileLinker } from './useRecordLinks'
import type { TripFile } from '../../types'

const FILE_ROW_STYLE = { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8 } as const
const FILE_NAME_STYLE = { flex: 1, fontSize: 'calc(12px * var(--fs-scale-body, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const
const FILE_ICON_BUTTON_STYLE = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0 } as const

/**
 * The Link and Files row of the booking and transport dialogs, side by side:
 * the booking's URL on the left, and on the right attach a new file, link one
 * the trip already has, and the files on the booking (or waiting for its first
 * save) under the two buttons. One component for both dialogs, which used to
 * carry the same block twice.
 */
export function BookingLinkAndFiles({
  url, onUrlChange, labelClass, inputClass, reservationId, tripFiles, attachedFiles, pendingFiles,
  onRemovePending, fileInputRef, onFileChange, canAttach, uploading, onLinked, onDetached,
}: {
  url: string
  onUrlChange: (url: string) => void
  labelClass: string
  inputClass: string
  /** The saved booking; linking waits for it. */
  reservationId: number | null | undefined
  tripFiles: TripFile[]
  attachedFiles: TripFile[]
  pendingFiles: File[]
  onRemovePending: (index: number) => void
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  canAttach: boolean
  uploading: boolean
  /** A trip file was linked or let go here, so the dialog's own list follows before the reload lands. */
  onLinked: (fileId: number) => void
  onDetached: (fileId: number) => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const tripId = useTripStore(s => s.trip?.id)
  const unlinkFile = useTripStore(s => s.unlinkFileFromReservation)
  const linkFile = useFileLinker()

  const linkable = reservationId ? tripFiles.filter(f => !f.deleted_at && !attachedFiles.some(af => af.id === f.id)) : []
  const detach = async (file: TripFile) => {
    if (!tripId || !reservationId) return
    try { await unlinkFile(tripId, file, reservationId) } catch { toast.error(t('reservations.toast.updateError')) }
    onDetached(file.id)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
      <div>
        <label className={labelClass}>{t('reservations.urlLabel')}</label>
        <div className="relative">
          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
          <input type="url" value={url} onChange={e => onUrlChange(e.target.value)}
            placeholder={t('reservations.urlPlaceholder')} className={inputClass} style={{ paddingLeft: 34 }} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t('files.title')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.pkpass,.pkpasses,image/*,application/vnd.apple.pkpass,application/vnd.apple.pkpasses" style={{ display: 'none' }} onChange={onFileChange} />
          <BookingFileButtons
            canAttach={canAttach}
            uploading={uploading}
            onAttach={() => fileInputRef.current?.click()}
            linkable={linkable}
            onLink={async f => {
              const ok = await linkFile(f.id, { reservation_id: reservationId! })
              if (ok) onLinked(f.id)
              return ok
            }}
          />
          {attachedFiles.map(f => (
            <div key={f.id} className="bg-surface-secondary" style={FILE_ROW_STYLE}>
              <FileText size={12} className="text-content-muted" style={{ flexShrink: 0 }} />
              <span className="text-content-secondary" style={FILE_NAME_STYLE}>{f.original_name}</span>
              <button type="button" onClick={() => { openFile(f.url).catch(() => toast.error(t('common.unknownError'))) }} aria-label={t('common.open')}
                className="text-content-faint" style={FILE_ICON_BUTTON_STYLE}><ExternalLink size={11} /></button>
              <button type="button" onClick={() => { void detach(f) }} aria-label={t('files.unlink')} className="text-content-faint" style={FILE_ICON_BUTTON_STYLE}>
                <X size={11} />
              </button>
            </div>
          ))}
          {pendingFiles.map((f, i) => (
            <div key={`${f.name}-${i}`} className="bg-surface-secondary" style={FILE_ROW_STYLE}>
              <FileText size={12} className="text-content-muted" style={{ flexShrink: 0 }} />
              <span className="text-content-secondary" style={FILE_NAME_STYLE}>{f.name}</span>
              <button type="button" onClick={() => onRemovePending(i)} aria-label={t('common.delete')} className="text-content-faint" style={FILE_ICON_BUTTON_STYLE}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
