import type { AssignmentsMap } from '../types'

// Collapses verbose Nominatim display_name strings (e.g. "Place, 1, Road, Neighbourhood,
// City, County, State, Country, Postcode, Country") into "Place, Postcode, Country".
// Clean short names (≤3 parts) pass through untouched.
export function formatLocationName(raw: string | null | undefined): string {
  if (!raw) return ''
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length <= 3) return raw.trim()

  // Dedup preserving insertion order
  const seen = new Set<string>()
  const unique: string[] = []
  for (const p of parts) {
    if (!seen.has(p.toLowerCase())) { seen.add(p.toLowerCase()); unique.push(p) }
  }
  if (unique.length <= 3) return unique.join(', ')

  const name = unique[0]
  const last = unique[unique.length - 1]
  const secondLast = unique.length >= 2 ? unique[unique.length - 2] : null

  // Detect postcode at tail: short alphanumeric with at least one digit, ≤10 chars
  const postalRe = /^[A-Z0-9][A-Z0-9\s\-]{1,8}$/i
  const isLastPostal = postalRe.test(last) && /\d/.test(last) && last.length <= 10
  const postcode = isLastPostal ? last : null
  const country = isLastPostal ? secondLast : last

  const result: string[] = [name]
  if (postcode && postcode !== name) result.push(postcode)
  if (country && country !== name && country !== postcode) result.push(country)

  return result.join(', ')
}

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF'])

export function currencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2
}

export function formatDate(dateStr: string | null | undefined, locale: string, timeZone?: string): string | null {
  if (!dateStr) return null
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: timeZone || 'UTC',
  }
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString(locale, opts)
}

export function formatTime(timeStr: string | null | undefined, locale: string, timeFormat: string): string {
  if (!timeStr) return ''
  try {
    const parts = timeStr.split(':')
    const h = Number(parts[0]) || 0
    const m = Number(parts[1]) || 0
    if (isNaN(h)) return timeStr
    if (timeFormat === '12h') {
      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      return `${h12}:${String(m).padStart(2, '0')} ${period}`
    }
    const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return locale?.startsWith('de') ? `${str} Uhr` : str
  } catch { return timeStr }
}

export function splitReservationDateTime(value?: string | null): { date: string | null; time: string | null } {
  if (!value) return { date: null, time: null }
  const isoDate = /^\d{4}-\d{2}-\d{2}$/
  if (value.includes('T')) {
    const [d, t] = value.split('T')
    return { date: isoDate.test(d) ? d : null, time: t ? t.slice(0, 5) : null }
  }
  if (isoDate.test(value)) return { date: value, time: null }
  if (/^\d{1,2}:\d{2}/.test(value)) return { date: null, time: value.slice(0, 5) }
  return { date: null, time: null }
}

export function dayTotalCost(dayId: number, assignments: AssignmentsMap, currency: string): string | null {
  const da = assignments[String(dayId)] || []
  const total = da.reduce((s, a) => s + (parseFloat(a.place?.price || '') || 0), 0)
  return total > 0 ? `${total.toFixed(0)} ${currency}` : null
}
