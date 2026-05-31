// ── Twemoji helper (Apple-style emojis via CDN) ──
export function emojiToCodepoint(emoji) {
  const codepoints = []
  for (const c of emoji) {
    const cp = c.codePointAt(0)
    if (cp !== 0xfe0f) codepoints.push(cp.toString(16)) // skip variation selector
  }
  return codepoints.join('-')
}

// SQLite stores UTC without 'Z' suffix — append it so JS parses as UTC
export function parseUTC(s) { return new Date(s && !s.endsWith('Z') ? s + 'Z' : s) }

export function formatTime(isoString, is12h) {
  const d = parseUTC(isoString)
  const h = d.getHours()
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (is12h) {
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${mm} ${period}`
  }
  return `${String(h).padStart(2, '0')}:${mm}`
}

export function formatDateSeparator(isoString, t) {
  const d = parseUTC(isoString)
  const now = new Date()
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return t('collab.chat.today') || 'Today'
  if (d.toDateString() === yesterday.toDateString()) return t('collab.chat.yesterday') || 'Yesterday'

  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function shouldShowDateSeparator(msg, prevMsg) {
  if (!prevMsg) return true
  const d1 = parseUTC(msg.created_at).toDateString()
  const d2 = parseUTC(prevMsg.created_at).toDateString()
  return d1 !== d2
}
