import ReactDOM from 'react-dom'
import { useState, useEffect } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { getAuthUrl } from '../../api/authUrl'
import { openFile } from '../../utils/fileDownload'
import type { NoteFile } from './CollabNotes.types'

// ── File Preview Portal ─────────────────────────────────────────────────────
interface FilePreviewPortalProps {
  file: NoteFile | null
  onClose: () => void
}

export function FilePreviewPortal({ file, onClose }: FilePreviewPortalProps) {
  const [authUrl, setAuthUrl] = useState('')
  const rawUrl = file?.url || ''
  useEffect(() => {
    setAuthUrl('')
    if (!rawUrl) return
    getAuthUrl(rawUrl, 'download').then(setAuthUrl)
  }, [rawUrl])

  if (!file) return null
  const isImage = file.mime_type?.startsWith('image/')
  const isPdf = file.mime_type === 'application/pdf'
  const isTxt = file.mime_type?.startsWith('text/')

  const openInNewTab = () => openFile(rawUrl).catch(() => {})

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      {isImage ? (
        /* Image lightbox — floating controls */
        <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
          {authUrl
            ? <img src={authUrl} alt={file.original_name} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, display: 'block' }} />
            : <Loader2 size={32} className="animate-spin text-[rgba(255,255,255,0.5)]" />
          }
          <div style={{ position: 'absolute', top: -36, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{file.original_name}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={openInNewTab} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 0 }}><ExternalLink size={15} /></button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 0 }}><X size={17} /></button>
            </div>
          </div>
        </div>
      ) : (
        /* Document viewer — card with header */
        <div style={{ width: '100%', maxWidth: 950, height: '94vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.original_name}</span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={openInNewTab} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)', padding: 0 }}><ExternalLink size={13} /></button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 2 }}><X size={18} /></button>
            </div>
          </div>
          {(isPdf || isTxt) ? (
            <object data={authUrl ? `${authUrl}#view=FitH` : ''} type={file.mime_type} style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }} title={file.original_name}>
              <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                <button onClick={openInNewTab} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', textDecoration: 'underline', fontSize: 14, padding: 0 }}>Download</button>
              </p>
            </object>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <button onClick={openInNewTab} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', textDecoration: 'underline', fontSize: 14, padding: 0 }}>Download {file.original_name}</button>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}
