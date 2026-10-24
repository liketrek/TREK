import type { ReactNode } from 'react'
import { URL_REGEX } from './CollabChat.constants'

/* ── Message Text with clickable URLs ── */
interface MessageTextProps {
  text: string
  /** Links read as underlined words that open nothing, as in the assistant chat's copy of a message. */
  plain?: boolean
}

export function MessageText({ text, plain = false }: MessageTextProps) {
  const parts = text.split(URL_REGEX)
  const urls = text.match(URL_REGEX) || []
  const result: ReactNode[] = []
  parts.forEach((part, i) => {
    if (part) result.push(part)
    const url = urls[i]
    if (url && plain) result.push(
      <span key={i} style={{ textDecoration: 'underline', textUnderlineOffset: 2, opacity: 0.85, overflowWrap: 'anywhere' }}>
        {url}
      </span>
    )
    else if (url) result.push(
      <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, opacity: 0.85 }}>
        {url}
      </a>
    )
  })
  return <>{result}</>
}
