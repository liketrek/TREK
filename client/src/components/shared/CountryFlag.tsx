import { useState } from 'react'
import { countryCodeToFlag } from '../../pages/atlas/atlasModel'

/**
 * A country's flag, drawn on every platform.
 *
 * The emoji alone is not enough. A flag is two regional-indicator code points,
 * and Windows has never shipped glyphs for the pairs — Chrome and Edge there
 * fall back to drawing the two letters, so `DE` appears where a flag was meant
 * and reads as something broken. Atlas has always had that, and the journey
 * cards inherited it.
 *
 * So the emoji is turned into its Twemoji image, the same way the collaboration
 * chat draws emoji (`CollabChatTwemojiImg`). When that image cannot be fetched —
 * offline, or an install that blocks the CDN — the emoji itself is rendered
 * instead, which is the old behaviour: a flag on Apple and Android, two letters
 * on Windows. Nothing is worse than it was, and on most screens it is a flag.
 */
export default function CountryFlag({ code, size = 14, title }: { code: string | null | undefined; size?: number; title?: string }) {
  const [failed, setFailed] = useState(false)
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null

  const emoji = countryCodeToFlag(code)
  if (!emoji) return null
  if (failed) {
    return (
      <span aria-hidden style={{ fontSize: size, lineHeight: 1 }} title={title}>
        {emoji}
      </span>
    )
  }

  const cp = [...code.toUpperCase()]
    .map(c => (0x1f1e6 + c.charCodeAt(0) - 65).toString(16))
    .join('-')
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${cp}.png`}
      alt={code.toUpperCase()}
      title={title}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size, display: 'block', borderRadius: 2 }}
    />
  )
}
