import { openFile as openFileUrl } from '../../utils/fileDownload'
import type { FileManagerState } from './useFileManager'
import { FilePreviewDialog } from './FileManagerPreviewDialog'

/** A PDF read in place, in the planner's dialog: the name on the head band, open and download beside it. */
export function PdfPreviewModal(S: FileManagerState) {
  const { previewFile, setPreviewFile, previewFileUrl, toast, t } = S
  const close = () => setPreviewFile(null)
  const openInTab = () => openFileUrl(previewFile.url, previewFile.original_name).catch(() => toast.error(t('files.openError')))
  return (
    <FilePreviewDialog
      name={previewFile.original_name}
      url={previewFile.url}
      onClose={close}
      onOpenInTab={openInTab}
      t={t}
      width="wide"
      bodyClassName="flex min-h-0 flex-1 flex-col"
      iconClassName="text-danger"
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
    </FilePreviewDialog>
  )
}
