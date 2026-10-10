import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react'
import { downloadFile, openFile } from '../../../../utils/fileDownload'
import { lockBodyScroll } from '../../../../utils/bodyScrollLock'
import { useMediaLightbox } from '../../../../components/Files/useMediaLightbox'
import VideoPlayer from '../../../../components/Journey/VideoPlayerLazy'
import type { TranslationFn, TripFile } from '../../../../types'

interface MFileLightboxProps {
  files: TripFile[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  t: TranslationFn
}

function sheetRoot(): HTMLElement {
  return document.getElementById('m-sheet-root') ?? document.body
}

/**
 * Media viewer for the Files tab (spec 03 §5.3 f.openF, image/video branch):
 * a v1-simple version of the desktop FileManagerImageLightbox — full-screen
 * dark overlay, prev/next + swipe, download/open-in-tab, no thumbnail strip
 * (kept out deliberately, see report). Images resolve through the same
 * one-shot signed URL as desktop; video keeps the plain same-origin URL so
 * its Range requests stay cookie-authenticated (#823).
 */
export default function MFileLightbox({ files, index, onIndexChange, onClose, t }: MFileLightboxProps) {
  const { file, imgSrc, fileIsVideo, hasPrev, hasNext, goPrev, goNext, onTouchStart, onTouchEnd } = useMediaLightbox({
    files,
    index,
    onIndexChange,
    onClose,
  })

  useEffect(() => lockBodyScroll(), [])

  if (!file) return null

  return createPortal(
    <div
      // Backdrop, header bar and media pane are plain boxes: they only route the
      // tap-to-dismiss. Escape / arrow keys and the header buttons are the
      // keyboard equivalents, wired up in useMediaLightbox.
      role="presentation"
      className="m-root fixed inset-0 z-[65] flex flex-col bg-black/[.92]"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div role="presentation" className="flex flex-none items-center justify-between px-4 py-[10px]" onClick={e => e.stopPropagation()}>
        <span className="min-w-0 flex-1 truncate font-geist text-[0.75rem] text-white/70">
          {file.original_name}
          <span className="ms-2 text-white/40">{index + 1} / {files.length}</span>
        </span>
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={() => { openFile(file.url, file.original_name).catch(() => {}) }}
            aria-label={t('files.openTab')}
            className="flex h-8 w-8 items-center justify-center text-white/70"
          >
            <ExternalLink size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => { downloadFile(file.url, file.original_name).catch(() => {}) }}
            aria-label={t('files.download')}
            className="flex h-8 w-8 items-center justify-center text-white/70"
          >
            <Download size={16} strokeWidth={2} />
          </button>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="flex h-8 w-8 items-center justify-center text-white/70">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Media + nav */}
      <div
        role="presentation"
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={e => {
          if (e.target !== e.currentTarget) return
          // Without this the click also reaches the overlay handler above.
          e.stopPropagation()
          onClose()
        }}
      >
        {hasPrev && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); goPrev() }}
            aria-label={t('mobileTrip.filesPrev')}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/80"
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
        )}
        {fileIsVideo ? (
          <div role="presentation" onClick={e => e.stopPropagation()}>
            <VideoPlayer src={file.url} style={{ maxWidth: '92vw', maxHeight: '78vh', borderRadius: 8 }} />
          </div>
        ) : (
          imgSrc && (
            // The stop sits on a wrapper rather than on the <img>: a picture is
            // not something you activate, and this keeps its alt text intact.
            <div role="presentation" onClick={e => e.stopPropagation()}>
              <img
                src={imgSrc}
                alt={file.original_name}
                className="block max-h-[78vh] max-w-[92vw] rounded-lg object-contain"
              />
            </div>
          )
        )}
        {hasNext && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); goNext() }}
            aria-label={t('mobileTrip.filesNext')}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/80"
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>,
    sheetRoot(),
  )
}
