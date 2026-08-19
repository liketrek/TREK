import { describe, it, expect, vi } from 'vitest'
import type { BookRecord } from '@trek/shared'
import { fireEvent, render, screen } from '../../helpers/render'
import { SaveIndicator } from '../../../src/components/Studio/SaveIndicator'

/**
 * The save status (#1973).
 *
 * Autosave without a sign of it is a promise the user has to take on faith, and
 * the moment they stop doing that is the moment they close the tab to check. So
 * the interesting cases here are the two that are not "fine": an error the user
 * can retry, and a conflict that has to offer a real choice rather than
 * announcing that one exists.
 */

const t = (k: string) => k

const current = (over: Partial<BookRecord> = {}): BookRecord => ({
  id: 3, journeyId: 9, title: 'Theirs', version: 6,
  updatedAt: '2026-08-19 10:00:00', updatedBy: 2,
  document: { version: 1, title: 'Theirs', page: {}, spreads: [] },
  ...over,
} as BookRecord)

function draw(state: Parameters<typeof SaveIndicator>[0]['state'], handlers = {}) {
  const props = {
    state, t,
    onAcceptTheirs: vi.fn(), onKeepMine: vi.fn(), onRetry: vi.fn(),
    ...handlers,
  }
  render(<SaveIndicator {...props} />)
  return props
}

describe('the quiet states', () => {
  /*
   * Idle shows nothing at all. A status that is always there is a status people
   * learn to stop reading, which is exactly the wrong habit for the one time it
   * says something else.
   */
  it('renders nothing while idle', () => {
    const { container } = render(
      <SaveIndicator
        state={{ status: 'idle' }} t={t}
        onAcceptTheirs={vi.fn()} onKeepMine={vi.fn()} onRetry={vi.fn()}
      />,
    )
    expect(container.textContent).toBe('')
  })

  it('says it is saving, and then that it saved', () => {
    const { unmount } = render(
      <SaveIndicator
        state={{ status: 'saving' }} t={t}
        onAcceptTheirs={vi.fn()} onKeepMine={vi.fn()} onRetry={vi.fn()}
      />,
    )
    expect(screen.getByText('journey.studio.saving')).toBeTruthy()
    unmount()

    draw({ status: 'saved', at: 0 })
    expect(screen.getByText('journey.studio.saved')).toBeTruthy()
  })
})

describe('an error', () => {
  it('is a button, because the way out is to try again', () => {
    const props = draw({ status: 'error' })
    fireEvent.click(screen.getByText('journey.studio.saveFailed'))
    expect(props.onRetry).toHaveBeenCalled()
  })
})

describe('a conflict', () => {
  /*
   * There is no merge here, and pretending otherwise would be worse than saying
   * so: one of these two documents is going to be the book. Both ways out are
   * on screen, stated plainly.
   */
  it('offers both ways out, and hands back the record it was given', () => {
    const record = current()
    const props = draw({ status: 'conflict', current: record })

    expect(screen.getByText('journey.studio.saveConflict')).toBeTruthy()

    fireEvent.click(screen.getByText('journey.studio.saveTakeTheirs'))
    expect(props.onAcceptTheirs).toHaveBeenCalledWith(record)

    fireEvent.click(screen.getByText('journey.studio.saveKeepMine'))
    expect(props.onKeepMine).toHaveBeenCalledWith(record)
  })

  /*
   * Announced, not just drawn. Losing an edit to someone else's save is the one
   * thing here a screen-reader user must not have to notice by scanning.
   */
  it('is announced rather than only drawn', () => {
    draw({ status: 'conflict', current: current() })
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
