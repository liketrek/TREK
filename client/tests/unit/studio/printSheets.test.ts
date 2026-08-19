import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { printSheets } from '../../../src/components/Studio/printSheets'

/**
 * The print view (#1973).
 *
 * The browser is what turns this into a PDF, so the things worth pinning are
 * the ones a browser silently gets wrong: a `@page` rule that does not match
 * the sheets, a document printed before its photographs arrived, and a save
 * button offered while neither has happened.
 */

const labels = { save: 'Save as PDF', close: 'Close', count: '17 sheets', preparing: 'Preparing' }

function open(over: Partial<Parameters<typeof printSheets>[0]> = {}) {
  return printSheets({
    html: '<div class="bx-sheet"></div>',
    sheetWidth: 224,
    sheetHeight: 224,
    title: 'Iceland',
    labels,
    ...over,
  })
}

const overlay = () => document.getElementById('bx-overlay')
const frame = () => overlay()!.querySelector('iframe')!
const saveButton = () => overlay()!.querySelector<HTMLButtonElement>('#bx-save')!

beforeEach(() => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

afterEach(() => {
  overlay()?.remove()
})

describe('the document', () => {
  /*
   * The rule the printer measures. A mismatch here scales the whole book to fit
   * whatever the browser thought the paper was — and looks perfect on screen.
   */
  it('sets one page rule to the sheet size, with no printer margin', () => {
    open({ sheetWidth: 224, sheetHeight: 303 })
    expect(frame().srcdoc).toContain('@page { size: 224mm 303mm; margin: 0; }')
  })

  it('puts the sheets in the body', () => {
    open({ html: '<div class="bx-sheet">page one</div>' })
    expect(frame().srcdoc).toContain('<body><div class="bx-sheet">page one</div></body>')
  })

  /*
   * The sheets are the editor's own components, so they need the editor's own
   * CSS — including the @font-face rules. Without them a book proofread in one
   * typeface prints in a substitute, which is the whole reason the faces are
   * bundled in the first place.
   */
  it('carries the app stylesheets across, inline and linked alike', () => {
    const style = document.createElement('style')
    style.textContent = '.st-x { color: red }'
    document.head.appendChild(style)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'http://localhost/assets/app.css'
    document.head.appendChild(link)

    open()
    const html = frame().srcdoc
    expect(html).toContain('.st-x { color: red }')
    expect(html).toContain('<link rel="stylesheet" href="http://localhost/assets/app.css">')
  })

  /*
   * Photographs are the point of the thing. Browsers drop backgrounds and
   * colour-managed fills by default, which is right for a web page and would
   * print a photo book as an outline of itself.
   */
  it('asks the browser not to strip colour', () => {
    open()
    expect(frame().srcdoc).toContain('print-color-adjust: exact')
  })

  it('escapes the title rather than letting it into the markup', () => {
    open({ title: '<script>x</script> & co' })
    const html = frame().srcdoc
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt; &amp; co')
    expect(html).not.toContain('<script>x</script>')
  })

  /* Nothing inside the frame runs, so printing is driven from out here. */
  it('withholds allow-scripts from the frame', () => {
    open()
    expect(frame().getAttribute('sandbox')).toBe('allow-same-origin allow-modals')
  })
})

describe('the save button', () => {
  it('starts disabled, because nothing has loaded yet', () => {
    open()
    expect(saveButton().disabled).toBe(true)
    expect(saveButton().textContent).toBe('Preparing')
  })

  /*
   * Enabled only once the images and the fonts are in. Printing early is how a
   * book comes back from the press with empty rectangles where the photographs
   * were.
   */
  it('waits for the pictures before offering to save', async () => {
    open()
    const iframe = frame()

    let resolveImage: () => void = () => {}
    const pending = new Promise<void>(r => { resolveImage = r })
    const image = {
      complete: false,
      addEventListener: (event: string, fn: () => void) => {
        if (event === 'load') void pending.then(fn)
      },
    }
    Object.defineProperty(iframe, 'contentDocument', {
      value: { images: [image], fonts: { ready: Promise.resolve() } },
      configurable: true,
    })
    Object.defineProperty(iframe, 'contentWindow', { value: { print: vi.fn() }, configurable: true })

    iframe.dispatchEvent(new Event('load'))
    await Promise.resolve()
    expect(saveButton().disabled).toBe(true)

    resolveImage()
    await new Promise(r => setTimeout(r, 0))
    expect(saveButton().disabled).toBe(false)
    expect(saveButton().textContent).toBe('Save as PDF')
  })

  /* One picture that will not load must not hold the whole book hostage. */
  it('gives up on a broken image rather than waiting forever', async () => {
    open()
    const iframe = frame()
    const image = {
      complete: false,
      addEventListener: (event: string, fn: () => void) => {
        if (event === 'error') setTimeout(fn, 0)
      },
    }
    Object.defineProperty(iframe, 'contentDocument', {
      value: { images: [image], fonts: { ready: Promise.resolve() } },
      configurable: true,
    })
    Object.defineProperty(iframe, 'contentWindow', { value: { print: vi.fn() }, configurable: true })

    iframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 5))
    expect(saveButton().disabled).toBe(false)
  })

  it('prints the frame, not the page around it', async () => {
    open()
    const iframe = frame()
    const print = vi.fn()
    Object.defineProperty(iframe, 'contentDocument', {
      value: { images: [], fonts: { ready: Promise.resolve() } },
      configurable: true,
    })
    Object.defineProperty(iframe, 'contentWindow', { value: { print }, configurable: true })

    iframe.dispatchEvent(new Event('load'))
    await new Promise(r => setTimeout(r, 0))
    saveButton().click()
    expect(print).toHaveBeenCalled()
  })
})

describe('closing', () => {
  it('takes the overlay with it', () => {
    open()
    expect(overlay()).not.toBeNull()
    overlay()!.querySelector<HTMLButtonElement>('#bx-close')!.click()
    expect(overlay()).toBeNull()
  })

  it('closes on a click outside the card, but not inside it', () => {
    open()
    overlay()!.querySelector<HTMLElement>('.bx-card')!.click()
    expect(overlay()).not.toBeNull()

    overlay()!.click()
    expect(overlay()).toBeNull()
  })

  it('hands back a way to close it', () => {
    const close = open()
    close()
    expect(overlay()).toBeNull()
  })
})
