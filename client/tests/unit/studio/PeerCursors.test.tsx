import { describe, it, expect } from 'vitest'
import { render } from '../../helpers/render'
import { PeerCursors } from '../../../src/components/Studio/PeerCursors'
import { peerColour } from '../../../src/components/Studio/peerColour'
import { PeerBadges } from '../../../src/components/Studio/PeerBadges'
import type { PeerCursor } from '../../../src/components/Studio/useBookPresence'

/**
 * Drawing the other people (#1973).
 */

const cursor = (over: Partial<PeerCursor> = {}): PeerCursor => ({
  socketId: 3, userId: 2, username: 'ada', spreadIndex: 0, x: 100, y: 50, at: 0, ...over,
})

const t = (k: string) => k

describe('the pointers', () => {
  /* A pointer on page 40 has no business being drawn on page 2. */
  it('draws only the ones on the spread being looked at', () => {
    const { container } = render(
      <PeerCursors
        cursors={[cursor({ socketId: 1, spreadIndex: 0 }), cursor({ socketId: 2, spreadIndex: 7 })]}
        spreadIndex={0}
        zoom={1}
      />,
    )
    expect(container.querySelectorAll('.st-peer')).toHaveLength(1)
  })

  it('renders nothing at all when nobody is on this spread', () => {
    const { container } = render(
      <PeerCursors cursors={[cursor({ spreadIndex: 3 })]} spreadIndex={0} zoom={1} />,
    )
    expect(container.querySelector('.st-peer')).toBeNull()
  })

  it('places it in the spread millimetres it was given', () => {
    const { container } = render(
      <PeerCursors cursors={[cursor({ x: 140, y: 80 })]} spreadIndex={0} zoom={1} />,
    )
    const el = container.querySelector<HTMLElement>('.st-peer')!
    expect(el.style.left).toBe('140mm')
    expect(el.style.top).toBe('80mm')
  })

  /*
   * The sheet is scaled, the arrow is not: one that grew with the zoom would be
   * a postage stamp at 30% and a dinner plate at 400%.
   */
  it('undoes the sheet scale so the arrow stays one size', () => {
    const { container } = render(
      <PeerCursors cursors={[cursor()]} spreadIndex={0} zoom={0.5} />,
    )
    expect(container.querySelector<HTMLElement>('.st-peer')!.style.transform).toBe('scale(2)')
  })

  it('says whose it is', () => {
    const { container } = render(<PeerCursors cursors={[cursor()]} spreadIndex={0} zoom={1} />)
    expect(container.querySelector('.st-peer-name')!.textContent).toBe('ada')
  })
})

describe('the colours', () => {
  /* Same colour in everybody's window, and tomorrow, without storing anything. */
  it('are the same for the same person, every time', () => {
    expect(peerColour(7)).toBe(peerColour(7))
  })

  it('differ between neighbouring ids, which is the common case', () => {
    expect(peerColour(1)).not.toBe(peerColour(2))
  })

  it('hold up for an id that is negative or enormous', () => {
    expect(peerColour(-3)).toMatch(/^#[0-9a-f]{6}$/)
    expect(peerColour(9_999_999)).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('the badges', () => {
  it('show nothing when nobody else is here', () => {
    const { container } = render(<PeerBadges peers={[]} t={t} />)
    expect(container.querySelector('.st-peers')).toBeNull()
  })

  /*
   * By person, not by socket. The presence list is keyed by socket because two
   * tabs are two pointers; showing them as two people says the room is busier
   * than it is.
   */
  it('count one person once, however many tabs they have open', () => {
    const { container } = render(
      <PeerBadges
        peers={[
          { socketId: 1, userId: 2, username: 'ada' },
          { socketId: 2, userId: 2, username: 'ada' },
        ]}
        t={t}
      />,
    )
    expect(container.querySelectorAll('.st-peer-dot')).toHaveLength(1)
  })

  it('fall back to an initial when somebody has no picture', () => {
    const { container } = render(
      <PeerBadges peers={[{ socketId: 1, userId: 2, username: 'ada' }]} t={t} />,
    )
    expect(container.querySelector('.st-peer-dot')!.textContent).toBe('A')
  })

  it('stop at four faces and count the rest', () => {
    const peers = Array.from({ length: 7 }, (_, i) => ({
      socketId: i, userId: i, username: `p${i}`,
    }))
    const { container } = render(<PeerBadges peers={peers} t={t} />)
    expect(container.querySelectorAll('.st-peer-dot')).toHaveLength(4)
    expect(container.querySelector('.st-peer-more')!.textContent).toBe('+3')
  })
})
