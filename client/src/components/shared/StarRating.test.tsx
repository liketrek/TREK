// FE-W4STAR-001 to FE-W4STAR-014
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PlaceRatingVote } from '@trek/shared'
import { render, screen, fireEvent, within } from '../../../tests/helpers/render'
import { useAuthStore } from '../../store/authStore'
import PlaceRating, { Stars } from './StarRating'

const VOTES: PlaceRatingVote[] = [
  { user_id: 1, username: 'ada', avatar: 'ada.png', rating: 5 },
  { user_id: 2, username: 'bob', avatar: null, rating: 3 },
]

beforeEach(() => {
  useAuthStore.setState({ user: { id: 1, username: 'ada' } as never })
})

describe('Stars', () => {
  it('FE-W4STAR-001: renders five stars and is not a radiogroup in display mode', () => {
    const { container } = render(<Stars value={3} />)

    expect(container.querySelectorAll('svg')).toHaveLength(3 + 5)
    expect(container.querySelector('[role="radiogroup"]')).toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })

  it('FE-W4STAR-002: clips the overlay for a fractional average', () => {
    const { container } = render(<Stars value={3.4} />)
    const overlays = Array.from(container.querySelectorAll('span > span')) as HTMLElement[]
    const widths = overlays.map(o => o.style.width).filter(Boolean)

    expect(widths).toHaveLength(4)
    expect(widths.slice(0, 3)).toEqual(['100%', '100%', '100%'])
    expect(Math.round(parseFloat(widths[3]))).toBe(40)
  })

  it('FE-W4STAR-003: exposes a radiogroup with five radios when interactive', () => {
    render(<Stars value={0} onRate={() => {}} ariaLabel="Your rating" />)

    expect(screen.getByRole('radiogroup', { name: 'Your rating' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('FE-W4STAR-004: marks the own vote as checked', () => {
    render(<Stars value={4} onRate={() => {}} myRating={4} />)

    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'false')
  })

  it('FE-W4STAR-005: casting a new vote reports the star index', () => {
    const onRate = vi.fn()
    render(<Stars value={0} onRate={onRate} myRating={null} />)

    fireEvent.click(screen.getByRole('radio', { name: '4' }))

    expect(onRate).toHaveBeenCalledWith(4)
  })

  it('FE-W4STAR-006: clicking the own vote clears it', () => {
    const onRate = vi.fn()
    render(<Stars value={3} onRate={onRate} myRating={3} />)

    fireEvent.click(screen.getByRole('radio', { name: '3' }))

    expect(onRate).toHaveBeenCalledWith(null)
  })

  it('FE-W4STAR-007: hovering previews the hovered value and leaving restores it', () => {
    const { container } = render(<Stars value={1} onRate={() => {}} />)
    const filled = () => Array.from(container.querySelectorAll('span > span')).filter(o => (o as HTMLElement).style.width).length

    expect(filled()).toBe(1)
    fireEvent.mouseEnter(screen.getByRole('radio', { name: '4' }))
    expect(filled()).toBe(4)

    fireEvent.mouseLeave(container.querySelector('[role="radiogroup"]')!)
    expect(filled()).toBe(1)
  })

  it('FE-W4STAR-008: focus previews and blur clears the preview', () => {
    const { container } = render(<Stars value={0} onRate={() => {}} />)
    const filled = () => Array.from(container.querySelectorAll('span > span')).filter(o => (o as HTMLElement).style.width).length

    fireEvent.focus(screen.getByRole('radio', { name: '5' }))
    expect(filled()).toBe(5)

    fireEvent.blur(screen.getByRole('radio', { name: '5' }))
    expect(filled()).toBe(0)
  })
})

describe('PlaceRating', () => {
  it('FE-W4STAR-009: shows the rounded average and the vote count', () => {
    render(<PlaceRating ratings={VOTES} ratingAvg={4.25} />)

    // The average is rendered through toLocaleString, so build the expectation the same way.
    expect(screen.getByText('(2)').parentElement).toHaveTextContent(`${(4.3).toLocaleString()} (2)`)
  })

  it('FE-W4STAR-010: shows the not-rated hint when there is no average', () => {
    render(<PlaceRating ratings={[]} ratingAvg={null} />)

    expect(screen.getByText(/not rated/i)).toBeInTheDocument()
  })

  it('FE-W4STAR-011: renders the voter avatar strip with image and initial fallback', () => {
    const { container } = render(<PlaceRating ratings={VOTES} ratingAvg={4} />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/uploads/avatars/ada.png')
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('FE-W4STAR-012: hides the avatar strip in compact mode', () => {
    const { container } = render(<PlaceRating ratings={VOTES} ratingAvg={4} compact />)

    expect(container.querySelector('img')).toBeNull()
  })

  it('FE-W4STAR-013: hovering opens a voter tooltip that marks the current user', () => {
    const { container } = render(<PlaceRating ratings={VOTES} ratingAvg={4} />)
    fireEvent.mouseEnter(container.firstElementChild!)

    const tip = screen.getByRole('tooltip')
    expect(within(tip).getByText('ada (you)')).toBeInTheDocument()
    expect(within(tip).getByText('bob')).toBeInTheDocument()

    fireEvent.mouseLeave(container.firstElementChild!)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4STAR-014: does not open a tooltip when nobody voted', () => {
    const { container } = render(<PlaceRating ratings={[]} ratingAvg={null} />)
    fireEvent.mouseEnter(container.firstElementChild!)

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('FE-W4STAR-015: pre-selects the signed-in user own vote in the stars', () => {
    useAuthStore.setState({ user: { id: 2, username: 'bob' } as never })
    render(<PlaceRating ratings={VOTES} ratingAvg={4} onRate={() => {}} />)

    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'true')
  })
})
