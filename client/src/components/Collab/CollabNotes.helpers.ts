// Pure formatting helper for note timestamps. Falls back to translated
// relative labels for recent timestamps and a localized short date beyond a week.
export const formatTimestamp = (ts, t, locale) => {
  if (!ts) return ''
  const d = new Date(ts.endsWith?.('Z') ? ts : ts + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return t('collab.chat.justNow') || 'just now'
  if (diffMins < 60) return t('collab.chat.minutesAgo', { n: diffMins }) || `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return t('collab.chat.hoursAgo', { n: diffHrs }) || `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return t('collab.notes.daysAgo', { n: diffDays }) || `${diffDays}d ago`
  return d.toLocaleDateString(locale || undefined, { month: 'short', day: 'numeric' })
}
