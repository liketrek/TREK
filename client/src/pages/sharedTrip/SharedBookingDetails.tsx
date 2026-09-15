import { ExternalLink, FileText } from 'lucide-react'
import { isHttpUrl, linkHost } from './sharedTripModel'

/**
 * The note and the link on a shared booking (#2320).
 *
 * A booking on a public link used to be its title, its time and its status.
 * The note the owner attached ("meet at the north entrance") and the booking
 * page they linked are what a fellow traveller opens the link for, so both
 * show now. What does not show is anything that would let a stranger touch
 * the booking: the server keeps the confirmation number and the ticket data
 * back, and this block only knows the two fields it is handed.
 *
 * The link opens in a new tab with no opener, and only when it is http(s) —
 * checked here as well as on the server, so the page never trusts a payload
 * to have done it.
 */
export function SharedBookingDetails({ notes, url }: { notes?: string | null; url?: string | null }) {
  const note = notes?.trim() || null
  const link = isHttpUrl(url) ? url.trim() : null
  if (!note && !link) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
      {note && (
        <div className="text-[#374151]" style={{ fontSize: 'calc(11px * var(--fs-scale-body, 1))', display: 'flex', alignItems: 'flex-start', gap: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}> {/* theme-lint-disable — public page, no user theme */}
          <FileText size={10} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{note}</span>
        </div>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563eb]" // theme-lint-disable — public page, no user theme
          style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none', width: 'fit-content' }}
        >
          <ExternalLink size={10} />
          {linkHost(link)}
        </a>
      )}
    </div>
  )
}
