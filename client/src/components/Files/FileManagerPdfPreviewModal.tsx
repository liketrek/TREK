import ReactDOM from 'react-dom'
import { ExternalLink, Download, X } from 'lucide-react'
import { openFile as openFileUrl } from '../../utils/fileDownload'
import type { FileManagerState } from './useFileManager'
import { triggerDownload } from './FileManager.helpers'

export function PdfPreviewModal(S: FileManagerState) {
  const { previewFile, setPreviewFile, previewFileUrl, toast, t } = S
  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={() => setPreviewFile(null)}
    >
      <div
        style={{ width: '100%', maxWidth: 950, height: '94vh', background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{previewFile.original_name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => openFileUrl(previewFile.url, previewFile.original_name).catch(() => toast.error(t('files.openError')))}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              <ExternalLink size={13} /> {t('files.openTab')}
            </button>
            <button
              onClick={() => triggerDownload(previewFile.url, previewFile.original_name)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              <Download size={13} /> {t('files.download') || 'Download'}
            </button>
            <button onClick={() => setPreviewFile(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <X size={18} />
            </button>
          </div>
        </div>
        <object
          data={previewFileUrl ? `${previewFileUrl}#view=FitH` : undefined}
          type="application/pdf"
          style={{ flex: 1, width: '100%', border: 'none' }}
          title={previewFile.original_name}
        >
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            <button onClick={() => openFileUrl(previewFile.url, previewFile.original_name).catch(() => toast.error(t('files.openError')))} style={{ color: 'var(--text-primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>{t('files.downloadPdf')}</button>
          </p>
        </object>
      </div>
    </div>,
    document.body
  )
}
