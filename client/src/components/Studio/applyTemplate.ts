import type { BookElement, BookPageSetup, BookSpread, JourneyStats } from '@trek/shared'
import { MAX_TEXT_LENGTH } from '@trek/shared'
import type { SpreadTemplate } from './bookTemplates.data'
import { formatBookCoords, formatBookDate } from './entryText'
import { coordValue } from './resolveBindings'

/**
 * Laying an entry out on a template somebody drew.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * The layouts written as code in autoLayout.ts are what a function can reason
 * its way to: a picture here, words there, margins that add up. What they are
 * not is *designed* — a panel bled off one edge, a shape running off the
 * corner, a strip of pictures at two sizes with the coordinates set under them.
 * Those decisions come from looking at a page, and the editor is where looking
 * at a page happens.
 *
 * So the templates are drawn in Studio and read back out (see
 * bookTemplates.data.ts). This is the other half: taking one of those spreads
 * and putting an entry into it.
 *
 * ── What it fills, and what it leaves alone ──────────────────────────────
 *
 * Only what the entry can answer for:
 *
 * - text carrying a `binding` — the title, the story, a caption
 * - empty photo frames, taking the entry's photographs in order
 * - the day, coordinate, date and country marks
 * - the stats and countries elements, from the journey's figures
 *
 * Everything else is the design and is copied as drawn. A panel stays where it
 * was put; a decorative shape keeps its colour. That division is the whole
 * contract between the person who draws a template and the code that uses it.
 *
 * ── Sizes ────────────────────────────────────────────────────────────────
 *
 * The template's numbers are fractions of the page it was drawn on, so they are
 * multiplied back up here. A template built on a 210mm square lays out on an A4
 * landscape book without being redrawn.
 */

export interface TemplateEntry {
  id: number
  title: string | null
  story: string | null
  location: string | null
  date: string | null
  photos: { photoId: number; width: number | null; height: number | null; caption?: string | null }[]
  lat?: number | null
  lng?: number | null
  country?: string | null
  dayNumber?: number | null
  dayCount?: number | null
}

export interface TemplateContext {
  page: BookPageSetup
  locale: string
  stats: JourneyStats | null
  /** Already translated, because this module has no translation context. */
  dayLabel: string
}

let seq = 0
const uid = (p: string) => `${p}-${(seq++).toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`

/** How well a template suits an entry: more is better, -1 means unusable. */
export function templateFit(template: SpreadTemplate, entry: TemplateEntry): number {
  const frames = template.elements.filter(e => e.kind === 'photo').length
  const photos = entry.photos.length
  const wantsStory = template.elements.some(e => e.kind === 'text' && e.binding?.source === 'entry.story')
  const hasStory = !!(entry.story || '').trim()

  /*
   * A template is a template *for an entry* when it uses one.
   *
   * The distinction has to come out of the drawing rather than from a label
   * somebody remembers to set: a summary spread is all figures and country
   * outlines and reads perfectly well on its own, and dropping a day's
   * photographs into it would be nonsense. Bindings are how a page says it
   * expects an entry.
   */
  const usesEntry = template.elements.some(
    e => ('binding' in e && e.binding) || (e.kind === 'photo' && e.photoId == null),
  )
  if (!usesEntry) return -1

  /*
   * A template with three frames and an entry with one picture leaves two
   * placeholders on a finished page, which is worse than a simpler layout.
   * More pictures than frames is fine — the extra ones are parked.
   */
  if (frames > photos + 1) return -1
  if (wantsStory && !hasStory) return -1

  // Closest match wins: a two-frame template for two pictures beats a one-frame
  // one, and both beat a template that would leave a hole.
  return 100 - Math.abs(frames - photos) * 10 - (wantsStory === hasStory ? 0 : 5)
}

/** Fill a template with an entry, and hand back the spread it makes. */
export function applyTemplate(
  template: SpreadTemplate,
  entry: TemplateEntry,
  ctx: TemplateContext,
): BookSpread {
  const { page } = ctx
  const PW = page.pageWidth
  const PH = page.pageHeight

  let nextPhoto = 0
  // A journal entry has no length limit and a text element does — see the note
  // in the contract. Poured in whole, one long day is a book that will not save.
  const story = (entry.story || '').trim().slice(0, MAX_TEXT_LENGTH)
  const heading = (entry.title || entry.location || '').slice(0, MAX_TEXT_LENGTH)

  const elements = template.elements.map(el => {
    const out = {
      ...el,
      id: uid(el.kind[0]),
      frame: {
        x: round2(el.frame.x * PW),
        y: round2(el.frame.y * PH),
        w: round2(el.frame.w * PW),
        h: round2(el.frame.h * PH),
      },
    } as BookElement

    // Sizes came out as fractions of the page height, so they go back up.
    if ('size' in out && typeof out.size === 'number') out.size = round2(out.size * PH)
    if ('radius' in out && typeof out.radius === 'number') out.radius = round2(out.radius * PW)
    if ('strokeWidth' in out && typeof out.strokeWidth === 'number') {
      out.strokeWidth = round2(out.strokeWidth * PW)
    }

    if (out.kind === 'text' && out.binding) {
      const source = out.binding.source
      const format = out.binding.format
      // What the words were made from, where they were made rather than copied.
      let value: string | undefined
      if (source === 'entry.title') out.text = heading
      else if (source === 'entry.story') out.text = story
      else if (source === 'entry.date') {
        out.text = formatBookDate(entry.date, ctx.locale)
        value = entry.date ?? undefined
      }
      // The place, as its name or as its point — see the `format` note in the
      // contract. A stop the entry cannot answer keeps the words the template
      // was drawn with, the same bargain fillBadge makes below.
      else if (source === 'entry.location') {
        if (format && entry.lat != null && entry.lng != null) {
          out.text = formatBookCoords(entry.lat, entry.lng, format)
          value = coordValue(entry.lat, entry.lng)
        } else if (!format && entry.location) {
          out.text = entry.location
        }
      }
      out.binding = { ...out.binding, entryId: entry.id, ...(value ? { value } : {}) }
    }

    if (out.kind === 'photo' && out.photoId == null) {
      const photo = entry.photos[nextPhoto++]
      if (photo) out.photoId = photo.photoId
    }

    if (out.kind === 'badge') fillBadge(out, entry, ctx)

    if (out.kind === 'countries' && ctx.stats) {
      out.codes = ctx.stats.countries.map(c => c.code)
      out.names = ctx.stats.countries.map(c => c.name)
    }

    // The figures live in one map on the element, keyed by metric — the same
    // shape the panels write when a stats element is placed by hand.
    if (out.kind === 'stats' && ctx.stats) {
      out.values = {
        distance: ctx.stats.distance,
        days: ctx.stats.days,
        steps: ctx.stats.steps,
        photos: ctx.stats.photos,
        places: ctx.stats.places,
        countries: ctx.stats.countries.length,
        furthest: ctx.stats.furthest,
      }
    }

    return out
  })

  return {
    id: uid('sp'),
    role: 'inner',
    background: template.background,
    elements,
    parked: [],
    entryId: entry.id,
  }
}

/**
 * The small marks, filled from the stop.
 *
 * A badge whose value the entry cannot answer keeps the one it was drawn with:
 * a template showing "DAY 1" on an entry with no date is a template that reads
 * as a placeholder, which is exactly what it is until a date exists.
 */
function fillBadge(el: BookElement & { kind: 'badge' }, entry: TemplateEntry, ctx: TemplateContext) {
  if (el.variant === 'day' && entry.dayNumber) {
    el.text = `${ctx.dayLabel} ${entry.dayNumber}`
  }
  if (el.variant === 'coords' && entry.lat != null && entry.lng != null) {
    el.text = formatBookCoords(entry.lat, entry.lng)
  }
  if ((el.variant === 'flag' || el.variant === 'country') && entry.country) {
    el.code = entry.country
    el.text = countryName(entry.country, ctx).toUpperCase()
  }
  if (el.variant === 'date' && entry.date) {
    const d = new Date(`${entry.date}T00:00:00`)
    if (!Number.isNaN(d.getTime())) {
      el.text = String(d.getDate())
      el.sub = d.toLocaleDateString(ctx.locale, { month: 'long' }).toUpperCase()
    }
  }
  if (el.variant === 'distance' && ctx.stats?.distance) {
    el.text = `${Math.round(ctx.stats.distance / 1000).toLocaleString(ctx.locale)} km`
  }
}

function countryName(code: string, ctx: TemplateContext): string {
  const known = ctx.stats?.countries.find(c => c.code === code)
  try {
    return new Intl.DisplayNames([ctx.locale], { type: 'region' }).of(code) ?? known?.name ?? code
  } catch {
    return known?.name ?? code
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
