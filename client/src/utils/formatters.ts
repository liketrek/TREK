import type { AssignmentsMap, Day } from '../types'

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

// Currencies whose smallest unit isn't 1/100. Most currencies use 2 decimals;
// these two sets cover the exceptions in the supported set (see CURRENCIES).
// HUF is kept zero-decimal by app convention even though ISO lists 2.
const ZERO_DECIMAL_CURRENCIES = new Set([
  'JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF',
  'BIF', 'DJF', 'GNF', 'KMF', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF',
])
const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'])

export function currencyDecimals(currency: string): number {
  const cur = currency.toUpperCase()
  if (ZERO_DECIMAL_CURRENCIES.has(cur)) return 0
  if (THREE_DECIMAL_CURRENCIES.has(cur)) return 3
  return 2
}

// Each currency formats in its own home convention (symbol position, grouping and
// decimal separators) regardless of the app language — so EUR is always "1.234,56 €"
// and USD always "$1,234.56". Intl derives all of that from the locale, so we map
// each supported currency to a representative locale (Latin-digit variants for the
// Arabic/Bengali ones to avoid non-Latin numerals).
const CURRENCY_LOCALE: Record<string, string> = {
  EUR: 'de-DE', USD: 'en-US', GBP: 'en-GB', JPY: 'ja-JP', CHF: 'de-CH',
  CZK: 'cs-CZ', PLN: 'pl-PL', SEK: 'sv-SE', NOK: 'nb-NO', DKK: 'da-DK',
  TRY: 'tr-TR', THB: 'th-TH', AUD: 'en-AU', CAD: 'en-CA', NZD: 'en-NZ',
  BRL: 'pt-BR', MXN: 'es-MX', INR: 'en-IN', IDR: 'id-ID', MYR: 'ms-MY',
  PHP: 'en-PH', SGD: 'en-SG', KRW: 'ko-KR', CNY: 'zh-CN', HKD: 'en-HK',
  TWD: 'zh-TW', ZAR: 'en-ZA', AED: 'en-AE', SAR: 'en-SA', ILS: 'he-IL',
  EGP: 'en-EG', MAD: 'fr-MA', HUF: 'hu-HU', RON: 'ro-RO', BGN: 'bg-BG',
  HRK: 'hr-HR', ISK: 'is-IS', RUB: 'ru-RU', UAH: 'uk-UA', KGS: 'ru-KG',
  BDT: 'en-BD', LKR: 'en-LK', VND: 'vi-VN', CLP: 'es-CL', COP: 'es-CO',
  PEN: 'es-PE', ARS: 'es-AR',
}

export function currencyLocale(currency: string): string {
  return CURRENCY_LOCALE[(currency || '').toUpperCase()] || 'en-US'
}

/**
 * Locale- and currency-correct money formatting via Intl: the symbol position,
 * thousands/decimal separators and decimal count all follow the user's locale
 * and the currency itself (e.g. de-DE EUR → "1.234,56 €", en-US USD → "$1,234.56",
 * ja-JP JPY → "￥1,235"). Falls back to a "<number> CODE" suffix for unknown codes.
 */
export function formatMoney(
  value: number,
  currency: string,
  locale: string,
  opts?: { decimals?: number },
): string {
  const cur = (currency || 'EUR').toUpperCase()
  const decimals = opts?.decimals ?? currencyDecimals(cur)
  // Format in the currency's home convention, not the app language, so the symbol
  // position and separators are always correct for that currency. `locale` stays
  // as a last-resort fallback for the error path.
  const fmtLocale = currencyLocale(cur)
  try {
    return new Intl.NumberFormat(fmtLocale, {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value || 0)
  } catch {
    return `${(value || 0).toLocaleString(locale || fmtLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${cur}`
  }
}

export function formatDate(dateStr: string | null | undefined, locale: string, timeZone?: string): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00Z')
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: timeZone || 'UTC',
  }
  // Show the year only when it isn't the current year, so this year's dates stay
  // compact while older/future ones are unambiguous.
  if (date.getUTCFullYear() !== new Date().getUTCFullYear()) opts.year = 'numeric'
  return date.toLocaleDateString(locale, opts)
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

/**
 * Resolve a date (YYYY-MM-DD or an ISO timestamp) to a trip day id: exact match, else the
 * nearest day so an out-of-range booking still lands on one. Returns '' when there is no
 * usable date or the trip has no days — callers read that as "no day selected".
 */
export function resolveDayId(days: Day[], value: string | null | undefined): Day['id'] | '' {
  const date = value ? String(value).slice(0, 10) : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || days.length === 0) return ''
  const exact = days.find(d => d.date === date)
  if (exact) return exact.id
  const target = new Date(date).getTime()
  let best: Day['id'] | '' = ''
  let bestDiff = Infinity
  for (const d of days) {
    if (!d.date) continue
    const diff = Math.abs(new Date(d.date).getTime() - target)
    if (diff < bestDiff) { bestDiff = diff; best = d.id }
  }
  return best
}

export type MoneyEntry = { amount: number; currency: string }

/**
 * Formats a sum of amounts that may span several currencies. Callers must resolve
 * each entry's currency beforehand (`place.currency || trip.currency`) — a null
 * place currency means the TRIP currency, which is not necessarily `base`.
 *
 * With usable rates (frankfurter convention: rates[X] = units of X per 1 base),
 * everything is converted into `base` and prefixed with "≈" when a conversion
 * actually happened. When any needed rate is missing, falls back to an honest
 * per-currency breakdown ("2 500 kr + $2,730.27") — never a raw foreign amount
 * labeled with the base currency.
 */
export function formatMoneySum(
  entries: MoneyEntry[],
  base: string,
  locale: string,
  rates?: Record<string, number> | null,
  opts?: { decimals?: number },
): string | null {
  const baseCur = (base || 'EUR').toUpperCase()
  const groups = new Map<string, number>()
  for (const e of entries) {
    if (!Number.isFinite(e.amount) || e.amount <= 0) continue
    const cur = (e.currency || baseCur).toUpperCase()
    groups.set(cur, (groups.get(cur) || 0) + e.amount)
  }
  if (groups.size === 0) return null

  const foreign = [...groups.keys()].filter(c => c !== baseCur)
  if (foreign.length === 0) return formatMoney(groups.get(baseCur)!, baseCur, locale, opts)

  if (foreign.every(c => (rates?.[c] ?? 0) > 0)) {
    const total = [...groups.entries()].reduce(
      (s, [cur, amount]) => s + (cur === baseCur ? amount : amount / rates![cur]),
      0,
    )
    return `≈ ${formatMoney(total, baseCur, locale, opts)}`
  }

  // Breakdown: base first, then the rest in stable code order.
  const parts = [
    ...(groups.has(baseCur) ? [baseCur] : []),
    ...foreign.sort(),
  ]
  return parts.map(cur => formatMoney(groups.get(cur)!, cur, locale, opts)).join(' + ')
}

export function dayTotalCost(
  dayId: number,
  assignments: AssignmentsMap,
  base: string,
  tripCurrency: string,
  locale: string,
  rates?: Record<string, number> | null,
): string | null {
  const da = assignments[String(dayId)] || []
  const entries = da.map(a => ({
    amount: parseFloat(String(a.place?.price ?? '')) || 0,
    currency: a.place?.currency || tripCurrency,
  }))
  return formatMoneySum(entries, base, locale, rates, { decimals: 0 })
}
