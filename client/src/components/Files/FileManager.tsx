import { isMarkdown } from './FileManager.helpers';
import { AssignModal } from './FileManagerAssignModal';
import { FilesView } from './FileManagerFilesView';
import { ImageLightbox } from './FileManagerImageLightbox';
import { MarkdownPreviewModal } from './FileManagerMarkdownPreviewModal';
import { PdfPreviewModal } from './FileManagerPdfPreviewModal';
import { FileManagerToolbar } from './FileManagerToolbar';
import { TrashView } from './FileManagerTrashView';
import DocSyncPanel from './docsync/DocSyncPanel';
import { useFileManager, type FileManagerProps } from './useFileManager';

export default function FileManager(props: FileManagerProps) {
  const S = useFileManager(props);
  const { lightboxIndex, setLightboxIndex, mediaFiles, assignFileId, previewFile, handlePaste, showTrash } = S;
  return (
    <div
      className="flex h-full flex-col"
      style={{ fontFamily: 'var(--font-system)' }}
      onPaste={handlePaste}
      tabIndex={-1}
    >
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox files={mediaFiles} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {/* Assign modal */}
      {assignFileId && <AssignModal {...S} />}

      {/* Document preview modal (markdown is rendered inline; everything else PDF/object) */}
      {previewFile &&
        (isMarkdown(previewFile.mime_type, previewFile.original_name) ? (
          <MarkdownPreviewModal {...S} />
        ) : (
          <PdfPreviewModal {...S} />
        ))}

      {/* Document sync opens as its own dialog: it is configuration for the
          documents on this screen, so it belongs here rather than in settings,
          but it is a task with a beginning and an end and does not belong
          inside the list it configures. */}
      {S.showDocSync && (
        <DocSyncPanel
          tripId={props.tripId}
          tripTitle={S.trip?.title}
          canManage={S.canManageSync}
          onClose={() => S.setShowDocSync(false)}
        />
      )}

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
  );
}
