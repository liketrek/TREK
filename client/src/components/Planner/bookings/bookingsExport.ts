import type { Reservation } from '../../../types'

interface ExportLabels {
  type: (type: string) => string
  status: (status: string) => string
  headers: {
    type: string; title: string; status: string; start: string; end: string
    from: string; to: string; location: string; confirmation: string; notes: string
  }
}

/**
 * A spreadsheet cell: quoted when it holds a separator, a quote or a line break,
 * and prefixed with an apostrophe when it would otherwise open as a formula, so a
 * booking titled "=HYPERLINK(...)" stays text in Excel or Sheets.
 */
export function csvCell(value: string | null | undefined): string {
  let text = value ?? ''
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Where a booking starts and ends, from its ordered stops when it has them (#1360). */
function fromTo(r: Reservation): [string, string] {
  const stops = (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
  if (stops.length < 2) return ['', '']
  const name = (s: (typeof stops)[number]) => [s.code, s.name].filter(Boolean).join(' ')
  return [name(stops[0]), name(stops[stops.length - 1])]
}

/**
 * The bookings as a CSV for a spreadsheet (#1360), one row each in the order they
 * are shown, with a header row. Times stay as TREK stores them (ISO, local to the
 * booking), which every spreadsheet sorts correctly.
 */
export function bookingsCsv(reservations: Reservation[], labels: ExportLabels): string {
  const h = labels.headers
  const rows = [[h.type, h.title, h.status, h.start, h.end, h.from, h.to, h.location, h.confirmation, h.notes].map(csvCell).join(';')]
  for (const r of reservations) {
    const [from, to] = fromTo(r)
    rows.push([
      labels.type(r.type), r.title, labels.status(r.status), r.reservation_time, r.reservation_end_time,
      from, to, r.location, r.confirmation_number, r.notes,
    ].map(v => csvCell(v)).join(';'))
  }
  // A byte order mark, so Excel reads the umlauts as UTF-8.
  return `\uFEFF${rows.join('\r\n')}\r\n`
}

/** "berlin-2026-bookings.csv": the trip's name, made safe for a file name. */
export function bookingsFileName(tripTitle: string | undefined, section: string): string {
  const slug = (tripTitle || 'trip').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'trip'}-${section}.csv`
}
