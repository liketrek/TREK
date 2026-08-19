import type { BookPageSetup, BookSpread } from '@trek/shared'
import { bookElementSchema } from '@trek/shared'

/**
 * A spread as a file, so a design can leave the book it was made in.
 *
 * ── Why this is worth having ─────────────────────────────────────────────
 *
 * A page somebody designs is worth more than one book. Without a way out it
 * exists once, in one journey, belonging to one person; with one it can be
 * posted, copied, argued about and improved. That is the whole feature — the
 * format is deliberately dull so the sharing is easy.
 *
 * ── Why the measurements are fractions ───────────────────────────────────
 *
 * Divided by the page they were drawn on, exactly as the auto layout's
 * templates are (see bookTemplates.data.ts), so a spread designed on a 210mm
 * square lands correctly in an A4 landscape book. A file carrying millimetres
 * would only fit the trim size it came from, which is not a thing anyone would
 * find out until it landed wrong.
 *
 * ── What is not in it ────────────────────────────────────────────────────
 *
 * Photographs. A spread file carries the *design* — the frames, the panels, the
 * type — and the frames come out empty. Anything else would mean shipping
 * someone's pictures inside a template, which is neither what the sender means
 * by "here is my layout" nor something the receiver's journey has any use for.
 *
 * Map URLs, in both directions, and this one is not about tidiness:
 *
 *   - **Out**: a static map element freezes the URL it was rendered from, and
 *     for a Mapbox instance that URL carries the instance's access token. A
 *     file meant to be posted in a forum must not have a credential in it.
 *   - **In**: a tile template from a stranger is a URL every reader's browser
 *     will fetch, tile by tile, the moment the page is opened — an IP address
 *     handed to whoever wrote the file. The receiving instance's own map
 *     settings fill the element back in instead.
 *
 * ── What an imported file is trusted for ─────────────────────────────────
 *
 * Nothing. It is a stranger's JSON, and it is treated as one:
 *
 *   - Read locally. The file is never uploaded; it is parsed in the tab that
 *     chose it, and only the resulting document — which the server validates
 *     against the same contract — is ever sent anywhere.
 *   - Parsed, not evaluated. `JSON.parse`, never `eval`, and the result goes
 *     through the document contract element by element, so unknown fields are
 *     dropped and every known one is range-checked. Colours in particular are
 *     `#rrggbb` or nothing, which is what keeps a "colour" from being a CSS
 *     expression that fetches something.
 *   - Bounded. A size limit on the file and a count limit on the elements,
 *     because the damage a hostile file can do here is not code execution —
 *     text is rendered as text, never as HTML — it is handing the editor more
 *     than it or the server will accept, and the failure mode of *that* is a
 *     document that will not save.
 */

/** What the file says it is, so a stray JSON is refused rather than half-read. */
const MAGIC = 'trek.studio.spread'
const VERSION = 1

/**
 * As many elements as the document contract allows on one spread.
 *
 * Kept in step with `bookSpreadSchema` by hand, which is a copy — but the cost
 * of it drifting is a file that imports and then will not save, and the cost of
 * not having it is the same file locking the editor up while it tries.
 */
const MAX_ELEMENTS = 60

/**
 * A spread with no photographs in it is a few kilobytes. A megabyte is already
 * far past anything this format produces, and the point of the limit is to fail
 * on a hostile or mistaken file before parsing it, not to be generous.
 */
export const MAX_SPREAD_FILE_BYTES = 1024 * 1024

/** The document contract's colour rule, applied before the contract sees it. */
const HEX = /^#[0-9a-fA-F]{6}$/

export interface SpreadFile {
  format: typeof MAGIC
  version: number
  /** Free text from whoever exported it. Shown nowhere yet; kept for later. */
  name?: string
  background: string | null
  /** Frames and type sizes as fractions — see the note above. */
  elements: unknown[]
}

const round4 = (n: number) => Math.round(n * 10000) / 10000
const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Turn a spread into a file's worth of JSON.
 *
 * Photographs are dropped to empty frames on the way out, and the ids go with
 * them: an id is only meaningful inside the document it came from.
 */
export function exportSpread(spread: BookSpread, page: BookPageSetup, name?: string): SpreadFile {
  const PW = page.pageWidth
  const PH = page.pageHeight

  const elements = spread.elements.map(el => {
    const out: Record<string, unknown> = {
      ...el,
      frame: {
        x: round4(el.frame.x / PW),
        y: round4(el.frame.y / PH),
        w: round4(el.frame.w / PW),
        h: round4(el.frame.h / PH),
      },
    }
    delete out.id
    if (typeof out.size === 'number') out.size = round4(out.size / PH)
    if (typeof out.radius === 'number') out.radius = round4(out.radius / PW)
    if (typeof out.strokeWidth === 'number') out.strokeWidth = round4(out.strokeWidth / PW)
    // The design, not the pictures.
    if (out.kind === 'photo') out.photoId = null
    /*
     * And not the map source. For a Mapbox instance this string contains the
     * access token the map was rendered with — see the note at the top. The
     * receiving instance fills it in from its own settings.
     */
    if (out.kind === 'map') { out.tileUrl = ''; out.attribution = '' }
    return out
  })

  return { format: MAGIC, version: VERSION, name, background: spread.background, elements }
}

/**
 * Read a file back into a spread for this book's page size.
 *
 * Returns null for anything that is not one of ours. Every element goes through
 * the document contract on the way in, so a file with a field this build does
 * not know — or one somebody edited by hand — cannot put a broken element into
 * a document.
 */
export function importSpread(raw: unknown, page: BookPageSetup): BookSpread | null {
  if (!raw || typeof raw !== 'object') return null
  const file = raw as Partial<SpreadFile>
  if (file.format !== MAGIC || !Array.isArray(file.elements)) return null

  const PW = page.pageWidth
  const PH = page.pageHeight

  // Past the contract's own limit the document would import and then refuse to
  // save, which is a worse outcome than refusing it here.
  const wanted = file.elements.slice(0, MAX_ELEMENTS)

  const elements = wanted.flatMap((el, i) => {
    if (!el || typeof el !== 'object') return []
    const e = el as Record<string, unknown>
    const f = e.frame as { x?: number; y?: number; w?: number; h?: number } | undefined
    if (!f) return []

    const scaled: Record<string, unknown> = {
      ...e,
      id: `i-${Date.now().toString(36)}-${i}`,
      frame: {
        x: round2((f.x ?? 0) * PW),
        y: round2((f.y ?? 0) * PH),
        w: round2((f.w ?? 0.2) * PW),
        h: round2((f.h ?? 0.2) * PH),
      },
    }
    if (typeof scaled.size === 'number') scaled.size = round2(scaled.size * PH)
    if (typeof scaled.radius === 'number') scaled.radius = round2(scaled.radius * PW)
    if (typeof scaled.strokeWidth === 'number') scaled.strokeWidth = round2(scaled.strokeWidth * PW)
    /*
     * A map arrives with no source, whatever the file says.
     *
     * The contract would accept any 500-character string here, and the browser
     * would then fetch tiles from it — so a shared template could quietly ask
     * everyone who opens it to call on a server of the author's choosing. The
     * element comes in blank and picks the instance's own map up from the
     * source picker, which is one click and reveals nothing.
     */
    if (scaled.kind === 'map') { scaled.tileUrl = ''; scaled.attribution = '' }

    // Through the contract: a file is someone else's data, and an element that
    // will not parse is dropped rather than let into the document.
    const parsed = bookElementSchema.safeParse(scaled)
    return parsed.success ? [parsed.data] : []
  })

  if (elements.length === 0) return null

  return {
    id: `sp-${Date.now().toString(36)}`,
    role: 'inner',
    // Checked here as well as in the contract: this one field is the only part
    // of the file that is not run through an element schema on its way in.
    background: typeof file.background === 'string' && HEX.test(file.background) ? file.background : null,
    elements,
    parked: [],
    entryId: null,
  }
}

/** Hand the file to the browser as a download. */
export function downloadSpread(spread: BookSpread, page: BookPageSetup, name: string) {
  const json = JSON.stringify(exportSpread(spread, page, name), null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug(name) || 'spread'}.trekspread.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoked on the next tick: revoking synchronously can cancel the download
  // in some browsers before it has started reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}
