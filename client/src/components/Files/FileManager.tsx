import { useFileManager, type FileManagerProps } from './useFileManager'
import { ImageLightbox } from './FileManagerImageLightbox'
import { AssignModal } from './FileManagerAssignModal'
import { PdfPreviewModal } from './FileManagerPdfPreviewModal'
import { MarkdownPreviewModal } from './FileManagerMarkdownPreviewModal'
import { isMarkdown } from './FileManager.helpers'
import { FileManagerToolbar } from './FileManagerToolbar'
import { TrashView } from './FileManagerTrashView'
import { FilesView } from './FileManagerFilesView'

export default function FileManager(props: FileManagerProps) {
  const S = useFileManager(props)
  const { lightboxIndex, setLightboxIndex, mediaFiles, assignFileId, previewFile, handlePaste, showTrash } = S
  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "var(--font-system)" }} onPaste={handlePaste} tabIndex={-1}>
      {/* Lightbox */}
      {lightboxIndex !== null && <ImageLightbox files={mediaFiles} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}

      {/* Assign modal */}
      {assignFileId && <AssignModal {...S} />}

      {/* Document preview modal (markdown is rendered inline; everything else PDF/object) */}
      {previewFile && (isMarkdown(previewFile.mime_type, previewFile.original_name)
        ? <MarkdownPreviewModal {...S} />
        : <PdfPreviewModal {...S} />)}

      {/* Toolbar */}
      <FileManagerToolbar {...S} />

      {showTrash ? <TrashView {...S} /> : <FilesView {...S} />}

      <style>{`
        @media (max-width: 767px) {
          .file-actions button { padding: 8px !important; }
          .file-actions svg { width: 18px !important; height: 18px !important; }
        }
      `}</style>
    </div>
  )
}
