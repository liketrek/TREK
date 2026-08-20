/**
 * Handing the book to the printer.
 *
 * ── Why the browser prints it ────────────────────────────────────────────
 *
 * The alternative was a renderer on the server — headless Chromium, or a PDF
 * library drawing the pages a second time. Both were rejected for the same
 * reason: TREK is self-hosted, and neither Chromium in the image nor a parallel
 * renderer to proofread against is a cost worth carrying when the browser
 * already produces exactly what the editor shows. It is also how TREK's other
 * exports work, so this is the house style rather than a new one.
 *
 * What comes out is a real PDF: vector text, embedded fonts, images at full
 * resolution. What does not come out is PDF metadata and the TrimBox/BleedBox
 * entries — a browser sets neither. Which is why the sheets carry crop marks:
 * a press reads where to cut from the marks, and has done for rather longer
 * than the PDF format has existed.
 *
 * ── Why an iframe rather than a window ───────────────────────────────────
 *
 * Same reason as the Journey export: `window.open` is blocked by Safari on iOS
 * inside an async callback, and `window.close` does not work reliably in a
 * standalone PWA. An overlay with a `srcdoc` iframe works everywhere.
 */

/*
 * The only literal colours in Studio, and deliberately so.
 *
 * The print view is a document of its own — a `srcdoc` iframe that inherits
 * none of the app's tokens — and paper is white whatever theme the editor is
 * in. Naming them here keeps the stylesheets below readable and puts the
 * exception in one place instead of on every rule.
 */
const PAPER = '#ffffff' // theme-lint-disable — paper, not app chrome
const WORKTOP = '#52525b' // theme-lint-disable — the grey the sheets sit on
const BAR = '#0f172a' // theme-lint-disable — the print view's own header
const BAR_LINE = '#e4e4e7' // theme-lint-disable — and the line under it

/** Everything the print document needs, gathered before the iframe exists. */
export interface PrintSheetsInput {
  /** The rendered sheets, as HTML. */
  html: string
  /** Sheet size in millimetres, bleed and crop-mark room included. */
  sheetWidth: number
  sheetHeight: number
  /**
   * The size of a one-page sheet, when the document also holds two-page ones.
   *
   * Spread mode mixes them: the covers are single leaves and everything between
   * is a spread. Omitted when every sheet is the same size, which is the whole
   * of page mode.
   */
  singleWidth?: number
  singleHeight?: number
  title: string
  /** Chrome for the overlay itself. */
  labels: { save: string; close: string; count: string; preparing: string }
}

/**
 * Every stylesheet the app is currently using, as markup for the iframe head.
 *
 * Copied rather than re-listed. The sheets are the editor's own components, so
 * they need the editor's own CSS — including the `@font-face` rules for the
 * seven bundled families, which is the difference between a book that prints in
 * the typeface it was proofread in and one that prints in a substitute.
 *
 * In a build that is one `<link>`; under Vite it is a pile of inline `<style>`
 * tags. Both are handled by taking the DOM as it is rather than guessing.
 */
function collectStyles(): string {
  const out: string[] = []
  for (const node of Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))) {
    if (node.tagName === 'LINK') {
      const href = (node as HTMLLinkElement).href
      if (href) out.push(`<link rel="stylesheet" href="${escapeAttr(href)}">`)
    } else {
      out.push(`<style>${node.textContent ?? ''}</style>`)
    }
  }
  return out.join('\n')
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * A page box for the single-page sheets, when the document mixes widths.
 *
 * A named page rule, which is how CSS says "these elements print on a different
 * sheet size". The alternative was making every sheet as wide as the widest,
 * and that laid a cover in the middle of a spread-sized page with white either
 * side — which is not a cover, it is a cover with a mistake around it.
 */
function singleRule(input: PrintSheetsInput): string {
  if (!input.singleWidth || !input.singleHeight) return ''
  if (input.singleWidth === input.sheetWidth && input.singleHeight === input.sheetHeight) return ''
  return `  @page single { size: ${input.singleWidth}mm ${input.singleHeight}mm; margin: 0; }
  .bx-sheet.is-single { page: single; }`
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Open the print view.
 *
 * Resolves once the document is on screen and ready to print — which is *after*
 * its images and fonts have loaded, not merely after the markup is in place.
 * Printing early is how a book comes out with blank rectangles where the
 * photographs were.
 */
export function printSheets(input: PrintSheetsInput): () => void {
  /*
   * The document's language, carried over from the editor.
   *
   * Not decoration: `hyphens: auto` does nothing at all until the browser knows
   * which language's rules to break the words by, and it reads that from the
   * nearest `lang`. Without it a heading the editor had set as "Lorem ip-sum"
   * came out unhyphenated in the export, ran past its own frame and was clipped
   * — the one place where what you proofread and what you print disagreed.
   * TranslationContext sets this on the app, so taking it from there is what
   * makes the two agree by construction rather than by a second setting.
   */
  const lang = document.documentElement.lang || 'en'

  const doc = `<!doctype html>
<html lang="${escapeAttr(lang)}">
<head>
<meta charset="utf-8">
<title>${escapeText(input.title)}</title>
<base href="${escapeAttr(window.location.origin)}/">
${collectStyles()}
<style>
  /*
   * One page rule for every sheet — see BookSheetsView on why they are all the
   * same size. No margin: the sheet already carries its own bleed and marks,
   * and a printer margin on top would scale the whole thing down to fit.
   */
  @page { size: ${input.sheetWidth}mm ${input.sheetHeight}mm; margin: 0; }
${singleRule(input)}
  /*
   * On screen the sheets are scaled to fit the window; on paper they are not.
   *
   * A spread sheet is over 400 mm across, which at 1:1 is wider than any
   * preview pane — the book ran off the side and had to be scrolled sideways to
   * read it. The --bx-fit factor is set from outside the frame (nothing runs
   * inside it) and only ever shrinks, so a small book is still shown at its
   * real size. zoom rather than transform: it scales the layout rather than
   * painting over it, so the page does not reserve the unscaled height.
   *
   * (No backticks in here — this whole stylesheet is a template literal.)
   */
  @media screen { .bx-book { zoom: var(--bx-fit, 1); } }
  html, body { margin: 0; padding: 0; background: ${WORKTOP}; }
  .bx-book { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0; }
  .bx-sheet { box-shadow: 0 2px 12px rgba(0,0,0,0.35); }
  @media print {
    html, body { background: ${PAPER}; }
    .bx-book { display: block; gap: 0; padding: 0; }
    .bx-sheet { box-shadow: none; }
    /* Photographs are the point. Without this the browser drops backgrounds
       and colour-managed fills to save toner, which is right for a web page
       and wrong for a photo book. */
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>${input.html}</body>
</html>`

  const overlay = document.createElement('div')
  overlay.id = 'bx-overlay'
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:8px;'

  const style = document.createElement('style')
  style.textContent = `
    #bx-overlay .bx-card { width:100%;max-width:1100px;height:95vh;background:${PAPER};border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.35); }
    #bx-overlay .bx-head { display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 16px;border-bottom:1px solid ${BAR_LINE};flex-shrink:0;background:${BAR}; }
    #bx-overlay .bx-name { min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:rgba(255,255,255,0.45);font-weight:500;letter-spacing:0.03em; }
    #bx-overlay .bx-actions { display:flex;align-items:center;gap:8px;flex:none; }
    #bx-overlay .bx-btn { min-height:44px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap; }
    #bx-overlay .bx-btn[disabled] { opacity:0.5;cursor:default; }
    #bx-overlay .bx-save { border:none;background:${PAPER};color:${BAR}; }
    #bx-overlay .bx-close { border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7); }
    @media (max-width: 640px) {
      #bx-overlay { padding:0; }
      #bx-overlay .bx-card { height:100dvh;max-width:none;border-radius:0; }
      #bx-overlay .bx-name { display:none; }
      #bx-overlay .bx-actions { flex:1; }
      #bx-overlay .bx-btn { flex:1;padding:10px 12px;font-size:13px; }
    }
  `

  const card = document.createElement('div')
  card.className = 'bx-card'

  const header = document.createElement('div')
  header.className = 'bx-head'
  header.innerHTML = `
    <span class="bx-name">${escapeText(input.title)} &middot; ${escapeText(input.labels.count)}</span>
    <div class="bx-actions">
      <button id="bx-save" class="bx-btn bx-save" disabled>${escapeText(input.labels.preparing)}</button>
      <button id="bx-close" class="bx-btn bx-close">${escapeText(input.labels.close)}</button>
    </div>
  `

  const iframe = document.createElement('iframe')
  iframe.style.cssText = `flex:1;width:100%;border:none;background:${WORKTOP};`
  // Nothing inside the document runs — printing is triggered from here through
  // contentWindow.print() — so allow-scripts is deliberately withheld.
  iframe.setAttribute('sandbox', 'allow-same-origin allow-modals')
  iframe.srcdoc = doc

  card.appendChild(header)
  card.appendChild(iframe)
  overlay.appendChild(style)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  const close = () => { stopFitting(); overlay.remove() }
  overlay.onclick = e => { if (e.target === overlay) close() }
  header.querySelector<HTMLButtonElement>('#bx-close')!.onclick = close

  const save = header.querySelector<HTMLButtonElement>('#bx-save')!
  save.onclick = () => { iframe.contentWindow?.print() }

  /** CSS millimetres are defined against 96dpi, so this ratio is exact. */
  const PX_PER_MM = 96 / 25.4

  /** Shrink the preview until a sheet fits across the pane. Never enlarge. */
  const fitPreview = () => {
    const root = iframe.contentDocument?.documentElement
    if (!root) return
    const available = iframe.clientWidth - 32
    if (available <= 0) return
    const scale = Math.min(1, available / (input.sheetWidth * PX_PER_MM))
    root.style.setProperty('--bx-fit', String(Math.round(scale * 1000) / 1000))
  }

  window.addEventListener('resize', fitPreview)
  const stopFitting = () => window.removeEventListener('resize', fitPreview)

  iframe.addEventListener('load', () => {
    fitPreview()
    void whenReady(iframe).then(() => {
      save.disabled = false
      save.textContent = input.labels.save
    })
  })

  return close
}

/**
 * When the document is actually printable.
 *
 * Both halves matter and neither is covered by the load event: a photograph
 * still decoding prints as an empty box, and a face still loading prints in the
 * fallback — the exact substitution the bundled typefaces exist to prevent.
 */
async function whenReady(iframe: HTMLIFrameElement): Promise<void> {
  const win = iframe.contentWindow
  const doc = iframe.contentDocument
  if (!win || !doc) return

  const settle = (el: Element) => new Promise<void>(resolve => {
    // A picture that will not load must not hold the button hostage — better a
    // book with one gap than a dialog that never finishes.
    el.addEventListener('load', () => resolve(), { once: true })
    el.addEventListener('error', () => resolve(), { once: true })
  })

  const images = Array.from(doc.images).map(img => (img.complete ? Promise.resolve() : settle(img)))

  /*
   * The photographs inside the map's markers are SVG `<image>`, which
   * `doc.images` does not collect and which has no `complete` to ask, so there
   * is nothing to do but wait on the events. Missing them meant a book could go
   * to print with its route beads still blank.
   */
  const svgImages = Array.from(doc.querySelectorAll?.('image') ?? []).map(settle)

  /*
   * And a ceiling over the lot. Without `complete` to fall back on there is no
   * way to tell a picture that is still coming from one whose events already
   * fired before this ran, and a Save button that never enables is worse than a
   * marker that prints blank.
   */
  const wait = win.setTimeout?.bind(win) ?? setTimeout
  const ceiling = new Promise<void>(resolve => { wait(resolve, 8000) })

  await Promise.race([
    Promise.all([...images, ...svgImages, doc.fonts?.ready ?? Promise.resolve()]),
    ceiling,
  ])
}
