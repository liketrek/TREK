import { createPortal } from 'react-dom'
import { useRef, useState } from 'react'
import { ScanLine, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { RECEIPT_PHOTO_ACCEPT, type ReceiptScan } from './useReceiptScan'

/**
 * The dialog behind "Scan receipt", laid out like the booking import's: what it
 * takes, a drop zone that is also the picker (on a phone the picker offers the
 * camera), then Scan, which hands the photo to the background read and closes.
 */
export function ReceiptScanModal({ scan }: { scan: ReceiptScan }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  if (!scan.isOpen) return null

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    scan.choose(Array.from(e.dataTransfer.files))
  }

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) scan.close() }}>
      <div role="dialog" aria-modal="true" aria-label={t('costs.scan.title')} className="flex max-h-[90vh] w-full max-w-[540px] flex-col rounded-2xl bg-surface-card p-6 shadow-2xl">
        <div className="mb-3.5 flex items-center gap-2">
          <h2 className="flex-1 text-subtitle font-bold text-content">{t('costs.scan.title')}</h2>
          <button type="button" onClick={scan.close} aria-label={t('common.close')} className="flex rounded-md p-1 text-content-faint">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="mb-3.5 text-caption leading-snug text-content-faint">{t('costs.scan.accepted')}</p>
          <input ref={inputRef} type="file" accept={RECEIPT_PHOTO_ACCEPT} hidden data-testid="receipt-scan-input"
            onChange={(e) => { scan.choose(e.target.files ? Array.from(e.target.files) : []); e.target.value = '' }} />
          <button type="button" onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={(e) => { if (e.target === e.currentTarget) setDragOver(false) }}
            onDrop={onDrop}
            className={`mb-3 flex min-h-[100px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-4 text-body font-medium transition-colors ${dragOver ? 'border-accent bg-surface-tertiary' : 'border-edge bg-transparent'}`}>
            <ScanLine size={18} strokeWidth={1.8} className={`pointer-events-none ${dragOver ? 'text-accent' : 'text-content-faint'}`} />
            <span className={`pointer-events-none break-all text-center ${scan.photo ? 'text-content' : 'text-content-faint'}`}>
              {dragOver ? t('costs.scan.dropActive') : scan.photo ? scan.photo.name : t('costs.scan.dropHere')}
            </span>
          </button>
          {scan.error && (
            <div role="alert" className="mt-2 rounded-lg border border-danger bg-danger-soft px-2.5 py-2 text-caption text-danger">{scan.error}</div>
          )}
        </div>

        <div className="mt-3.5 flex justify-end gap-2 border-t border-edge-secondary pt-3.5">
          <button type="button" onClick={scan.close} className="rounded-lg border border-edge px-4 py-2 text-body font-medium text-content">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={scan.start} disabled={!scan.photo || scan.starting}
            className={`rounded-lg px-4 py-2 text-body font-medium ${scan.photo && !scan.starting ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}`}>
            {scan.starting ? t('costs.scan.reading') : t('costs.scan.start')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
