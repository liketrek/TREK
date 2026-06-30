import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { ExternalLink, Download, X } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSanitize from 'rehype-sanitize'
import { openFile as openFileUrl } from '../../utils/fileDownload'
import type { FileManagerState } from './useFileManager'
import { triggerDownload } from './FileManager.helpers'

/**
 * Inline preview for uploaded Markdown files (#1345). Fetches the file's text via
 * the signed preview URL and renders it with react-markdown. Output is sanitized
 * with rehype-sanitize — these are UNTRUSTED uploads, unlike collab notes — and
 * react-markdown v10 already drops raw HTML, so no script can execute.
 */
export function MarkdownPreviewModal(S: FileManagerState) {
  const { previewFile, setPreviewFile, previewFileUrl, toast, t } = S
  const [text, setText] = useState('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!previewFileUrl) return
    let cancelled = false
    setErr(false)
    setText('')
    fetch(previewFileUrl, { credentials: 'include' })
      .then(r => (r.ok ? r.text() : Promise.reject(new Error('load failed'))))
      .then(body => { if (!cancelled) setText(body) })
      .catch(() => { if (!cancelled) setErr(true) })
    return () => { cancelled = true }
  }, [previewFileUrl])

  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={() => setPreviewFile(null)}
    >
      <div
        style={{ width: '100%', maxWidth: 820, height: '94vh', background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
          <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{previewFile.original_name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => openFileUrl(previewFile.url, previewFile.original_name).catch(() => toast.error(t('files.openError')))}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              <ExternalLink size={13} /> {t('files.openTab')}
            </button>
            <button
              onClick={() => triggerDownload(previewFile.url, previewFile.original_name)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
              <Download size={13} /> {t('files.download') || 'Download'}
            </button>
            <button onClick={() => setPreviewFile(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 4, borderRadius: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="collab-note-md" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', color: 'var(--text-primary)', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {err
            ? <p style={{ color: 'var(--text-muted)' }}>{t('files.openError')}</p>
            : <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSanitize]}>{text}</Markdown>}
        </div>
      </div>
    </div>,
    document.body
  )
}
