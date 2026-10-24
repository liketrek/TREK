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

/** The name a category had before this Save: a rename maps old -> new, so look the new name up. */
export const originalCategoryName = (cat: string, renames: Record<string, string>): string =>
  Object.entries(renames).find(([, to]) => to === cat)?.[0] ?? cat

/**
 * What saving the category dialog writes. A colour goes onto the notes of a category
 * that has some, looked up under the name they still carry (renames are applied to the
 * notes separately, and `notes` is the list from before them), so renaming and
 * recolouring in one Save keeps both. A category without notes is kept as an empty one.
 */
export function planCategoryColorSave(
  notes: ReadonlyArray<{ id: number; category?: string | null }>,
  currentColors: Record<string, string>,
  nextColors: Record<string, string>,
  renames: Record<string, string> = {},
): { updates: { noteId: number; color: string }[]; emptyCategories: Record<string, string> } {
  const updates: { noteId: number; color: string }[] = []
  const emptyCategories: Record<string, string> = {}
  for (const [cat, color] of Object.entries(nextColors)) {
    const original = originalCategoryName(cat, renames)
    const inCat = notes.filter(n => n.category === original || n.category === cat)
    if (inCat.length === 0) {
      emptyCategories[cat] = color
    } else if ((currentColors[original] ?? currentColors[cat]) !== color) {
      for (const n of inCat) updates.push({ noteId: n.id, color })
    }
  }
  return { updates, emptyCategories }
}
