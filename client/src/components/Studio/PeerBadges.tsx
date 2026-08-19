import type { BookPeer } from './useBookPresence'
import { peerColour } from './peerColour'

/**
 * Who else has the book open.
 *
 * In the bar rather than in a panel, because it answers a question people ask
 * before they start moving things: am I the only one in here. A pointer answers
 * it too, but only once the other person moves — someone reading a spread in
 * silence is invisible without this.
 *
 * The same colour as their pointer, so the two read as one person.
 */
export function PeerBadges({ peers, t }: { peers: BookPeer[]; t: (k: string) => string }) {
  if (peers.length === 0) return null

  /*
   * By person, not by socket.
   *
   * The presence list is keyed by socket because two tabs are two pointers, and
   * that is right for pointers. It is wrong here: one person with the book open
   * twice is one person, and showing them as two says the room is busier than
   * it is.
   */
  const seen = new Map<number, BookPeer>()
  for (const p of peers) if (!seen.has(p.userId)) seen.set(p.userId, p)
  const people = [...seen.values()]

  const shown = people.slice(0, 4)
  const rest = people.length - shown.length

  return (
    <div className="st-peers" title={people.map(p => p.username).join(', ')}>
      <span className="st-peer-faces">
        {shown.map(p => (
          <span
            key={p.userId}
            className="st-peer-dot"
            style={{ background: peerColour(p.userId) }}
            aria-label={p.username}
          >
            {p.avatar
              ? <img src={p.avatar} alt="" />
              : (p.username?.[0] ?? '?').toUpperCase()}
          </span>
        ))}
      </span>
      {rest > 0 && <span className="st-peer-more">+{rest}</span>}
      <span className="st-peer-label">{t('journey.studio.peersHere')}</span>
    </div>
  )
}
