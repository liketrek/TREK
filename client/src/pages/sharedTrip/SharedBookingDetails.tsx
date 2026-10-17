import { ExternalLink } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { fs } from '../../components/shared/DialogShell'
import { BOX, Block } from '../../components/Planner/bookings/bookingParts'
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
  const { t } = useTranslation()
  const note = notes?.trim() || null
  const link = isHttpUrl(url) ? url.trim() : null
  if (!note && !link) return null
  return (
    <>
      {note && (
        <Block label={t('reservations.notes')}>
          <div className={`${BOX} whitespace-pre-wrap px-[10px] py-2 text-content-secondary [overflow-wrap:anywhere]`} style={fs(12, 'body')}>{note}</div>
        </Block>
      )}
      {link && (
        <Block label={t('reservations.urlLabel')}>
          <a href={link} target="_blank" rel="noopener noreferrer" className={`${BOX} flex items-center gap-1.5 px-[10px] py-[7px] font-semibold text-content hover:bg-surface-hover`} style={fs(12.5, 'body')}>
            <ExternalLink size={12} strokeWidth={2} className="flex-none text-content-muted" />
            <span className="truncate">{linkHost(link)}</span>
          </a>
        </Block>
      )}
    </>
  )
}
