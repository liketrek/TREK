/**
 * Turn hand-built spreads into auto-layout templates.
 *
 * Reads the book from a journey and writes the spreads out as data: every
 * measurement divided by the page it was drawn on, so the same template lays
 * out on an A4 landscape book as it does on the 210mm square it was designed
 * for. Run from server/, output goes to the client.
 */
const Database = require('better-sqlite3')
const fs = require('fs')

const JOURNEY = Number(process.argv[2] || 7)
const OUT = process.argv[3] || '../client/src/components/Studio/bookTemplates.data.ts'

const db = new Database('data/travel.db', { readonly: true })
const row = db.prepare('SELECT document FROM journey_books WHERE journey_id = ?').get(JOURNEY)
db.close()
if (!row) throw new Error(`no book on journey ${JOURNEY}`)

/*
 * Through the contract on the way in, so a template carries every field the
 * document has — including any the schema gained since the spread was drawn.
 * Without it a template written today is missing tomorrow's defaults and does
 * not typecheck as a BookElement.
 */
const { normalizeBookDocument } = require('@trek/shared')
const doc = normalizeBookDocument(JSON.parse(row.document))
const PW = doc.page.pageWidth
const PH = doc.page.pageHeight

const r4 = n => Math.round(n * 10000) / 10000

/** A frame as fractions of one page's width and of the page height. */
function relFrame(f) {
  return { x: r4(f.x / PW), y: r4(f.y / PH), w: r4(f.w / PW), h: r4(f.h / PH) }
}

/** Type size as a fraction of the page height, so it scales with the sheet. */
const relSize = n => r4(n / PH)

function element(e) {
  // The id travels with the template and is replaced when it is applied —
  // dropping it here would leave the element off the BookElement union.
  const out = { ...e, frame: relFrame(e.frame) }
  if (typeof out.size === 'number') out.size = relSize(out.size)
  if (typeof out.radius === 'number') out.radius = r4(out.radius / PW)
  if (typeof out.strokeWidth === 'number') out.strokeWidth = r4(out.strokeWidth / PW)
  return out
}

const spreads = doc.spreads
  .map((s, i) => ({ index: i, role: s.role, background: s.background, elements: s.elements.map(element) }))
  .filter(s => s.role === 'inner')

const body = spreads.map((s, i) => `  {
    id: 'ref-${i + 1}',
    background: ${JSON.stringify(s.background)},
    elements: ${JSON.stringify(s.elements, null, 6).replace(/\n/g, '\n    ')},
  },`).join('\n')

const file = `import type { BookElement } from '@trek/shared'

/**
 * The spread templates, as data.
 *
 * ── Where these come from ────────────────────────────────────────────────
 *
 * Not from this file's author. They were built by hand in Studio and read back
 * out of the document — which is the point: what a page should look like is a
 * matter of taste, and taste is not something a layout function arrives at by
 * reasoning. The editor is the design tool, and this is its output.
 *
 * To add one: build the spread in Studio, then run
 *
 *     node scripts/extract-templates.cjs <journeyId>
 *
 * from server/ and commit what it writes here.
 *
 * ── Why the numbers are fractions ────────────────────────────────────────
 *
 * Every frame is divided by the page it was drawn on — x and w by one page's
 * width, y and h by its height — and type sizes by the page height. A template
 * built on a 210mm square therefore lays out on an A4 landscape book without
 * being redrawn, which it would otherwise have to be for every trim size the
 * picker offers.
 *
 * ── What gets filled in ──────────────────────────────────────────────────
 *
 * Elements carrying a \`binding\` take their text from the entry; empty photo
 * frames take its photographs in order; the day, coordinate and country marks
 * take what the entry knows about its stop. Everything else — the panels, the
 * rules, the shapes that run off the page — is the design, and is kept as it
 * was drawn.
 */

export interface SpreadTemplate {
  id: string
  background: string | null
  /** Frames and sizes are fractions — see the note above. */
  elements: BookElement[]
}

export const SPREAD_TEMPLATES: SpreadTemplate[] = [
${body}
]
`

fs.writeFileSync(OUT, file)
console.log(`wrote ${spreads.length} templates to ${OUT}`)
