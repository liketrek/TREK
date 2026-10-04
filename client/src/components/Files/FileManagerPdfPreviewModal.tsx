import { useId } from 'react'
import { ExternalLink, Download, FileText } from 'lucide-react'
import { openFile as openFileUrl } from '../../utils/fileDownload'
import type { FileManagerState } from './useFileManager'
import { triggerDownload } from './FileManager.helpers'
import { DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT, PILL } from '../shared/DialogShell'

/** A PDF read in place, in the planner's dialog: the name on the head band, open and download beside it. */
export function PdfPreviewModal(S: FileManagerState) {
  const { previewFile, setPreviewFile, previewFileUrl, toast, t } = S
  const labelId = useId()
  const close = () => setPreviewFile(null)
  const openInTab = () => openFileUrl(previewFile.url, previewFile.original_name).catch(() => toast.error(t('files.openError')))
  return (
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      width="wide"
      bodyClassName="flex min-h-0 flex-1 flex-col"
      header={(
        <DialogHeader
          tile={<DialogTile><FileText size={20} strokeWidth={1.9} className="text-danger" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          title={previewFile.original_name}
          pills={(
            <>
              <button type="button" onClick={openInTab} className={`${PILL} hover:opacity-80`}>
                <ExternalLink size={13} strokeWidth={2.2} /> {t('files.openTab')}
              </button>
              <button type="button" onClick={() => triggerDownload(previewFile.url, previewFile.original_name)} className={`${PILL} hover:opacity-80`}>
                <Download size={13} strokeWidth={2.2} /> {t('files.download') || 'Download'}
              </button>
            </>
          )}
        />
      )}
    >
      <object
        data={previewFileUrl ? `${previewFileUrl}#view=FitH` : undefined}
        type="application/pdf"
        className="h-[74vh] w-full border-0"
        title={previewFile.original_name}
      >
        <p className="p-6 text-center text-content-muted">
          <button type="button" onClick={openInTab} className="text-content underline">{t('files.downloadPdf')}</button>
        </p>
      </object>
    </DialogShell>
  )
}
