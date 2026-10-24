// ── Twemoji helper (Apple-style emojis via CDN) ──
export function emojiToCodepoint(emoji) {
  const codepoints = []
  for (const c of emoji) {
    const cp = c.codePointAt(0)
    if (cp !== 0xfe0f) codepoints.push(cp.toString(16)) // skip variation selector
  }
  return codepoints.join('-')
}
