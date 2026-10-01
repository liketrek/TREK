import { useRef } from 'react'
import { Printer } from 'lucide-react'
import Modal from '../shared/Modal'
import { useTranslation } from '../../i18n'

interface PackingPrintPreviewProps {
  /** The page to print; the preview is closed while this is null. */
  html: string | null
  title: string
  onClose: () => void
}

/**
 * The printable packing list, shown before it goes to the printer (#1420).
 *
 * Printed from its own frame, so the page that reaches the printer is the list and
 * nothing of the planner around it, and "Save as PDF" in the browser's print dialog
 * is the PDF export. No script runs inside the frame; printing is started from here.
 */
export default function PackingPrintPreview({ html, title, onClose }: PackingPrintPreviewProps) {
  const { t } = useTranslation()
  const frameRef = useRef<HTMLIFrameElement>(null)
  return (
    <Modal
      isOpen={html != null}
      onClose={onClose}
      title={title}
      size="3xl"
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-edge px-4 py-2 text-body text-content-muted hover:bg-surface-hover">
            {t('common.close')}
          </button>
          <button
            type="button"
            onClick={() => frameRef.current?.contentWindow?.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-text hover:bg-accent-hover"
          >
            <Printer size={15} strokeWidth={2.2} />
            {t('packing.exportPrint')}
          </button>
        </div>
      )}
    >
      {html != null && (
        <iframe
          ref={frameRef}
          title={title}
          srcDoc={html}
          sandbox="allow-same-origin allow-modals"
          className="block h-[62vh] w-full rounded-lg border border-edge"
        />
      )}
    </Modal>
  )
}
