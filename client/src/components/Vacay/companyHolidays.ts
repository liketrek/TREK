/** A company holiday as the plan holds it; `fraction` 0.5 is a half day (#2439). */
export interface CompanyHoliday {
  date: string
  note?: string
  fraction?: number | null
}

const isHalf = (h: CompanyHoliday) => (h.fraction ?? 1) < 1

/**
 * The plan's company holidays split by size (#2439): a whole one closes the day to
 * leave, a half one leaves half of it. Rows from before the column are whole.
 */
export function companyHolidaySets(list: CompanyHoliday[]): { full: Set<string>; half: Set<string> } {
  const full = new Set<string>()
  const half = new Set<string>()
  for (const h of list) (isHalf(h) ? half : full).add(h.date)
  return { full, half }
}

/**
 * The list after a click, ahead of the server, by its rule: the same size again
 * clears the day, the other size converts it.
 */
export function toggledCompanyHolidays(list: CompanyHoliday[], date: string, fraction: number): CompanyHoliday[] {
  const existing = list.find(h => h.date === date)
  if (!existing) return [...list, { date, fraction }]
  if ((existing.fraction ?? 1) === fraction) return list.filter(h => h.date !== date)
  return list.map(h => (h.date === date ? { ...h, fraction } : h))
}

/** The fraction a leave click may book on a day: half of a half company holiday, else what was asked. */
export function leaveFractionFor(date: string, half: Set<string>, asked: 0.5 | 1): 0.5 | 1 {
  return half.has(date) ? 0.5 : asked
}
