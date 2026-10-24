import { createPortal } from 'react-dom'
import { useState, useEffect, useId } from 'react'
import { X, ExternalLink, FileText, Loader2 } from 'lucide-react'
import { getAuthUrl } from '../../api/authUrl'
import { openFile } from '../../utils/fileDownload'
import { useTranslation } from '../../i18n'
import { DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT, PILL, fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import type { NoteFile } from './CollabNotes.types'

// ── File Preview Portal ─────────────────────────────────────────────────────
interface FilePreviewPortalProps {
  file: NoteFile | null
  onClose: () => void
}

/** The round buttons over the dark image backdrop. */
const LIGHTBOX_BTN = 'grid h-9 w-9 place-items-center rounded-full bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.22)]' // theme-lint-disable: the lightbox is dark in every scheme

export function FilePreviewPortal({ file, onClose }: FilePreviewPortalProps) {
  const { t } = useTranslation()
  const labelId = useId()
  const [authUrl, setAuthUrl] = useState('')
  const rawUrl = file?.url || ''
  useEffect(() => {
    setAuthUrl('')
    if (!rawUrl) return
    void getAuthUrl(rawUrl, 'download').then(setAuthUrl)
  }, [rawUrl])

  const isImage = !!file?.mime_type?.startsWith('image/')
  // The dialog handles its own Escape; the image lightbox takes it here.
  useEffect(() => {
    if (!file || !isImage) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [file, isImage, onClose])

  if (!file) return null
  const isPdf = file.mime_type === 'application/pdf'
  const isTxt = file.mime_type?.startsWith('text/')

  const openInNewTab = () => openFile(rawUrl).catch(() => {})

  if (isImage) {
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(0,0,0,0.88)] p-4" role="presentation" onClick={onClose}> {/* theme-lint-disable: the lightbox is dark in every scheme */}
        {/* Image lightbox — floating controls */}
        <div className="relative max-h-[90vh] max-w-[90vw]" role="presentation" onClick={e => e.stopPropagation()}>
          {authUrl
            ? <img src={authUrl} alt={file.original_name} className="block max-h-[90vh] max-w-[90vw] rounded-[14px] object-contain" />
            : <Loader2 size={32} className="animate-spin text-[rgba(255,255,255,0.5)]" />
          }
          <div className="absolute inset-x-0 -top-12 flex items-center justify-between gap-3 px-1">
            <span className="truncate text-[rgba(255,255,255,0.8)]" style={fs(12, 'body')}>{file.original_name}</span>
            <div className="flex flex-none gap-2">
              <Tooltip label={t('files.openTab')}>
                <button type="button" onClick={openInNewTab} aria-label={t('files.openTab')} className={LIGHTBOX_BTN}><ExternalLink size={15} /></button>
              </Tooltip>
              <Tooltip label={t('common.close')}>
                <button type="button" onClick={onClose} aria-label={t('common.close')} className={LIGHTBOX_BTN}><X size={17} /></button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  /* Document viewer — the planner's dialog, the name on the head band */
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="wide"
      bodyClassName="flex min-h-0 flex-1 flex-col"
      header={(
        <DialogHeader
          tile={<DialogTile><FileText size={20} strokeWidth={1.9} className={isPdf ? 'text-danger' : 'text-content-muted'} /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={file.original_name}
          pills={(
            <button type="button" onClick={openInNewTab} className={`${PILL} hover:opacity-80`}>
              <ExternalLink size={13} strokeWidth={2.2} /> {t('files.openTab')}
            </button>
          )}
        />
      )}
    >
      {(isPdf || isTxt) ? (
        <object data={authUrl ? `${authUrl}#view=FitH` : ''} type={file.mime_type} className="h-[74vh] w-full border-0 bg-white" title={file.original_name}> {/* theme-lint-disable: a document page is white */}
          <p className="p-6 text-center text-content-muted">
            <button type="button" onClick={openInNewTab} className="text-content underline" style={fs(14, 'body')}>Download</button>
          </p>
        </object>
      ) : (
        <div className="flex flex-1 items-center justify-center p-10">
          <button type="button" onClick={openInNewTab} className="text-content underline" style={fs(14, 'body')}>Download {file.original_name}</button>
        </div>
      )}
    </DialogShell>
  )
}
