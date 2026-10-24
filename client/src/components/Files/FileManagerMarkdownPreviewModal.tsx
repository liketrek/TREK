import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSanitize from 'rehype-sanitize'
import { openFile as openFileUrl } from '../../utils/fileDownload'
import type { FileManagerState } from './useFileManager'
import { FilePreviewDialog } from './FileManagerPreviewDialog'

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
  const close = () => setPreviewFile(null)
  const openInTab = () => openFileUrl(previewFile.url, previewFile.original_name).catch(() => toast.error(t('files.openError')))

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

  return (
    <FilePreviewDialog
      name={previewFile.original_name}
      url={previewFile.url}
      onClose={close}
      onOpenInTab={openInTab}
      t={t}
      width="editor"
      bodyClassName="collab-note-md min-h-0 flex-1 overflow-y-auto px-7 py-6 leading-relaxed text-content [word-break:break-word]"
      iconClassName="text-content-muted"
    >
      {err
        ? <p className="text-content-muted">{t('files.openError')}</p>
        : <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeSanitize]}>{text}</Markdown>}
    </FilePreviewDialog>
  )
}
