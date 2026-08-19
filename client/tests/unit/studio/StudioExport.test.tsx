import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { BookDocument, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { fireEvent, render, screen } from '../../helpers/render'

const printed = vi.hoisted(() => vi.fn())
vi.mock('../../../src/components/Studio/printSheets', () => ({ printSheets: printed }))

import { StudioExport } from '../../../src/components/Studio/StudioExport'

/**
 * The export dialog (#1973).
 *
 * Two questions and a button. What is worth pinning is what the button hands
 * over: the sheet size the `@page` rule is built from, and markup that actually
 * contains the book — a print view assembled from an empty stage is a stack of
 * blank pages, and it looks fine right up until it is printed.
 */

const spread = (role: BookSpread['role'], id: string): BookSpread => ({
  id, role, background: '#ffffff', elements: [], parked: [], entryId: null,
})

const doc = (spreads: BookSpread[] = [spread('cover', 'c'), spread('inner', 'a')]): BookDocument => ({
  version: 1,
  title: 'Iceland',
  page: bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3 }),
  spreads,
} as BookDocument)

const t = (key: string) => key

function open(over: Partial<Parameters<typeof StudioExport>[0]> = {}) {
  const onClose = vi.fn()
  render(<StudioExport doc={doc()} title="Iceland" t={t} onClose={onClose} {...over} />)
  return { onClose }
}

beforeEach(() => { printed.mockReset() })
afterEach(() => { vi.useRealTimers() })

describe('the choices', () => {
  it('starts on single pages, which is what a printer takes', () => {
    open()
    expect(screen.getByText('journey.studio.exportPages').closest('button')!.className)
      .toContain('is-on')
  })

  it('starts with crop marks on', () => {
    open()
    expect(screen.getByText('journey.studio.exportMarks').closest('button')!.getAttribute('aria-pressed'))
      .toBe('true')
  })

  it('switches to spreads when asked', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportSpreads'))
    expect(screen.getByText('journey.studio.exportSpreads').closest('button')!.className)
      .toContain('is-on')
    expect(screen.getByText('journey.studio.exportPages').closest('button')!.className)
      .not.toContain('is-on')
  })

  it('turns the marks off again', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportMarks'))
    expect(screen.getByText('journey.studio.exportMarks').closest('button')!.getAttribute('aria-pressed'))
      .toBe('false')
  })
})

describe('handing over', () => {
  /*
   * The sheet size is the `@page` rule. Get it wrong and the printer scales the
   * whole book to fit whatever it thought the paper was, which is the one defect
   * that survives every proofread because it looks correct on screen.
   */
  it('passes the sheet size the marks and bleed add up to', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))

    expect(printed).toHaveBeenCalledTimes(1)
    const call = printed.mock.calls[0][0]
    // 210 trim + 2 × (3 bleed + 4 marks).
    expect(call.sheetWidth).toBe(224)
    expect(call.sheetHeight).toBe(224)
  })

  it('drops the room for marks when they are off', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportMarks'))
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))

    expect(printed.mock.calls[0][0].sheetWidth).toBe(216)
  })

  it('sizes the sheet to the spread when spreads were chosen', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportSpreads'))
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))

    expect(printed.mock.calls[0][0].sheetWidth).toBe(420 + (3 + 4) * 2)
  })

  /* An empty stage prints as blank pages, and only says so on paper. */
  it('hands over markup with the book in it', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))

    const { html } = printed.mock.calls[0][0]
    expect(html).toContain('bx-sheet')
    // Cover, then both leaves of the inner spread.
    expect(html.match(/bx-sheet/g)).toHaveLength(3)
  })

  it('carries the book title into the print view', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))
    expect(printed.mock.calls[0][0].title).toBe('Iceland')
  })

  it('closes itself once the print view is up', () => {
    const { onClose } = open()
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))
    expect(onClose).toHaveBeenCalled()
  })

  /* Two clicks used to mean two print views, the second hidden behind the first. */
  it('opens one print view, not one per render', () => {
    open()
    fireEvent.click(screen.getByText('journey.studio.exportOpen'))
    expect(printed).toHaveBeenCalledTimes(1)
  })
})

describe('leaving', () => {
  it('closes without printing anything', () => {
    const { onClose } = open()
    fireEvent.click(screen.getByText('common.cancel'))
    expect(onClose).toHaveBeenCalled()
    expect(printed).not.toHaveBeenCalled()
  })
})
