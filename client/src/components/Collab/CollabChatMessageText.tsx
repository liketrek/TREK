import { URL_REGEX } from './CollabChat.constants'

/* ── Message Text with clickable URLs ── */
interface MessageTextProps {
  text: string
}

export function MessageText({ text }: MessageTextProps) {
  const parts = text.split(URL_REGEX)
  const urls = text.match(URL_REGEX) || []
  const result = []
  parts.forEach((part, i) => {
    if (part) result.push(part)
    if (urls[i]) result.push(
      <a key={i} href={urls[i]} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, opacity: 0.85 }}>
        {urls[i]}
      </a>
    )
  })
  return <>{result}</>
}
