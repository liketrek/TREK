import { expect, type Locator, type Page } from '@playwright/test'
import { PICTURE_DAY_ISO } from '../dates'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { HelpGuide } from '../../src/help/types'

/**
 * Runner for the help-center media (`npm run help:media`).
 *
 * A guide is defined once, in `src/help/contexts/<screen>.ts`; the file next to
 * this one gives every step of it an action against the real app. From that
 * single script this runner produces everything the panel shows:
 *
 *   - one framed picture per step, with the element the reader is told to use
 *     ringed and numbered (`step-<n>.png`),
 *   - the state after the last step (`result.png`).
 *
 * And because every step has to succeed for the picture to exist, the same run
 * is the test that the guide still matches the UI.
 *
 * Output lands in a staging directory; `promote.mjs` converts and moves it into
 * `public/help-media/`, so a bad run never clobbers good artwork.
 */

export const OUT_DIR = path.join(process.cwd(), 'e2e', '.tmp', 'help-media')
/**
 * A common desktop. Smaller frames squeeze the trip cards until their badges
 * overlap the action buttons, which is not what a reader on a normal screen
 * sees; the wiki shots use 1440×900 for the docs' narrower column.
 */
export const VIEWPORT = { width: 1920, height: 1080 }

/**
 * The instant every picture is taken at: nine in the morning, UTC, on the
 * picture day (`e2e/dates.ts`), which is the seeded trip's last day.
 *
 * A picture has to look the same whoever runs this and whenever, and the seed
 * is relative to that day, so the browser's clock is pinned to it: were it
 * left on the wall clock, a run late in the evening would see the trip's last
 * stops in the past, and What's Next would have nothing left to list. Only
 * the browser's `Date` is pinned, so timers keep running and nothing that
 * waits stops waiting; the server keeps its own clock, which none of the
 * pictures read.
 */
export const PICTURE_DAY = new Date(`${PICTURE_DAY_ISO}T09:00:00.000Z`)

/** Put the page on the day the pictures are taken on. Call before navigating. */
async function pinClock(page: Page): Promise<void> {
  await page.clock.setFixedTime(PICTURE_DAY)
}

export interface StepAction {
  /** Bring the screen to where the step starts (runs after the previous step's `act`). */
  prepare?: (page: Page) => Promise<void>
  /** The element the reader is told to use; ringed and framed in the picture. */
  target?: (page: Page) => Locator
  /**
   * Where to put the pointer for the picture when the target's centre is not on
   * it (an SVG region whose bounding-box centre lies in a neighbour). Default:
   * hover the target.
   */
  hover?: (page: Page) => Promise<void>
  /**
   * A drag: the target is what the reader picks up, this is where it goes.
   * Both are ringed and an arrow joins them, so one still shows the gesture.
   */
  dropTo?: (page: Page) => Locator
  /** What the step does. */
  act?: (page: Page) => Promise<void>
}

export interface GuideScript {
  guide: HelpGuide
  /** Where the guide starts: navigate, dismiss notices, wait for data. */
  start: (page: Page) => Promise<void>
  /** Exactly one entry per registered step. */
  steps: StepAction[]
  /** Undo what the guide changed, so the next one starts from the seed again. */
  cleanup?: (page: Page) => Promise<void>
}

/**
 * 'still' takes the pictures at full speed. The mode stays as a switch so a
 * recorder that plays the same scripts at a watchable pace can be added
 * without touching them; nothing sets 'paced' today.
 */
let mode: 'still' | 'paced' = 'still'

/** A pause a person would make; nothing in still mode. */
export async function beat(page: Page, ms = 700): Promise<void> {
  if (mode === 'paced') await page.waitForTimeout(ms)
}

/** Fill instantly for the pictures; type like a person when paced. */
export async function typeInto(page: Page, locator: Locator, text: string): Promise<void> {
  if (mode === 'paced') {
    await locator.click()
    await locator.pressSequentially(text, { delay: 55 })
  } else {
    await locator.fill(text)
  }
}

// ── Stills ────────────────────────────────────────────────────────────────────

/** Run a guide and take its pictures. Throws (fails the test) when a step cannot be performed. */
export async function captureGuide(page: Page, script: GuideScript): Promise<void> {
  mode = 'still'
  await pinClock(page)
  const { guide } = script
  if (script.steps.length !== guide.steps) {
    throw new Error(`guide "${guide.id}" registers ${guide.steps} steps but the script has ${script.steps.length}`)
  }
  const dir = path.join(OUT_DIR, guide.id)
  mkdirSync(dir, { recursive: true })

  await script.start(page)
  await settle(page)

  for (let i = 0; i < script.steps.length; i++) {
    const n = i + 1
    const step = script.steps[i]
    await step.prepare?.(page)
    if (step.target && guide.media.steps) {
      const target = step.target(page)
      await expect(target, `guide "${guide.id}" step ${n}: target`).toBeVisible()
      await target.scrollIntoViewIfNeeded()
      let box = await target.boundingBox()
      if (!box) throw new Error(`guide "${guide.id}" step ${n}: target has no box`)
      if (box.height > VIEWPORT.height - 2 * PAD) {
        // A block taller than the frame (a whole settings section): show its top
        // rather than its middle, which is where the heading is.
        await target.evaluate(el => el.scrollIntoView({ block: 'start' }))
        await page.evaluate(() => {
          const nav = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64
          window.scrollBy(0, -nav - 24)
        })
      } else {
        // Playwright scrolls only as far as it must, which leaves a target at the
        // bottom edge and the frame full of whatever sits above it. Centre it so
        // the picture shows the element in its surroundings. Works on whichever
        // ancestor scrolls (the dashboard has its own pane, not the document).
        await target.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }))
      }
      if (step.hover) await step.hover(page)
      else await target.hover()
      await settle(page)
      box = (await target.boundingBox()) ?? box
      if (step.dropTo) {
        const dest = step.dropTo(page)
        await expect(dest, `guide "${guide.id}" step ${n}: drop target`).toBeVisible()
        const to = await dest.boundingBox()
        if (!to) throw new Error(`guide "${guide.id}" step ${n}: drop target has no box`)
        await ringDrag(page, box, to, n)
        await page.screenshot({ path: path.join(dir, `step-${n}.png`), clip: frameFor(union(box, to)) })
      } else {
        const frame = frameFor(box)
        await ring(page, box, n, frame)
        await page.screenshot({ path: path.join(dir, `step-${n}.png`), clip: frame })
      }
      await unring(page)
    }
    await step.act?.(page)
  }

  if (guide.media.result) {
    await settle(page)
    await page.mouse.move(VIEWPORT.width - 4, VIEWPORT.height - 4) // nothing hovered in the after-picture
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(dir, 'result.png') })
  }
  await script.cleanup?.(page)
}

/** The screen overview picture for a context. */
export async function captureHero(page: Page, contextId: string, start: (page: Page) => Promise<void>): Promise<void> {
  mode = 'still'
  await pinClock(page)
  const dir = path.join(OUT_DIR, 'ctx')
  mkdirSync(dir, { recursive: true })
  await start(page)
  await settle(page)
  await page.mouse.move(VIEWPORT.width - 4, VIEWPORT.height - 4)
  await page.waitForTimeout(250)
  await page.screenshot({ path: path.join(dir, `${contextId}.png`) })
}

// ── Framing ──────────────────────────────────────────────────────────────────

const PAD = 64
const MIN_W = 960
const RATIO = 16 / 10

/**
 * A 16:10 window around the target: at least MIN_W wide, big enough to hold the
 * element with breathing room, kept inside the viewport. A target too large for
 * the largest 16:10 frame that fits gets that frame, anchored at its top, so a
 * long settings section shows its heading rather than its middle.
 */
export function frameFor(box: { x: number; y: number; width: number; height: number }) {
  const { width: vw, height: vh } = VIEWPORT
  const maxH = Math.min(vh, vw / RATIO)
  const maxW = maxH * RATIO
  let w = Math.max(MIN_W, box.width + 2 * PAD)
  let h = Math.max(w / RATIO, box.height + 2 * PAD)
  w = Math.max(w, h * RATIO)
  const tall = h > maxH
  if (w > maxW || tall) {
    w = maxW
    h = maxH
  }
  const x = clamp(box.x + box.width / 2 - w / 2, 0, vw - w)
  const y = tall ? clamp(box.y - PAD / 2, 0, vh - h) : clamp(box.y + box.height / 2 - h / 2, 0, vh - h)
  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/**
 * Ring the target, dim everything else, number it.
 *
 * The ring is the app's accent, which stands out on nearly every surface the
 * guides walk over. Over the lightbox and the other near-black overlays it does
 * not: a dark accent on a dark ground is a ring nobody can see. So the surface
 * behind the ring is measured, and only when it has too little contrast against
 * the accent does a white hairline go around the outside of the ring and the
 * badge. Everywhere else the ring keeps the single line it always had.
 */
async function ring(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  n: number,
  frame: { x: number; y: number; width: number; height: number },
): Promise<void> {
  await page.evaluate(
    ({ box, n, frame }) => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#111827'
      const accentText = getComputedStyle(document.documentElement).getPropertyValue('--accent-text').trim() || '#ffffff'
      const pad = 6

      const parse = (value: string): [number, number, number, number] | null => {
        const text = value.trim()
        if (text.startsWith('#')) {
          const hex = text.length < 7 ? text.slice(1, 4).replace(/./g, c => c + c) : text.slice(1, 7)
          const n = Number.parseInt(hex, 16)
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
        }
        const inside = /rgba?\(([^)]+)\)/.exec(text)
        if (!inside) return null
        const parts = inside[1]
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number)
        return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1]
      }
      const luminance = (colour: [number, number, number, number]): number => {
        const channel = (v: number) => {
          const c = v / 255
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(colour[0]) + 0.7152 * channel(colour[1]) + 0.0722 * channel(colour[2])
      }
      // What lies just outside the ring, through any transparent layer.
      const behind = (x: number, y: number): [number, number, number, number] => {
        let node = document.elementFromPoint(
          Math.max(1, Math.min(window.innerWidth - 2, x)),
          Math.max(1, Math.min(window.innerHeight - 2, y)),
        )
        while (node) {
          const colour = parse(getComputedStyle(node).backgroundColor)
          if (colour && colour[3] > 0.2) return colour
          node = node.parentElement
        }
        return [255, 255, 255, 1]
      }
      // The dim layer darkens that surface before the ring is drawn over it.
      const ground = luminance(behind(box.x - pad - 4, box.y + box.height / 2)) * 0.7
      const ink = luminance(parse(accent) || [17, 24, 39, 1])
      const hairline = (Math.max(ground, ink) + 0.05) / (Math.min(ground, ink) + 0.05) < 3

      const el = document.createElement('div')
      el.id = 'trek-help-ring'
      Object.assign(el.style, {
        position: 'fixed',
        left: `${box.x - pad}px`,
        top: `${box.y - pad}px`,
        width: `${box.width + 2 * pad}px`,
        height: `${box.height + 2 * pad}px`,
        borderRadius: '12px',
        boxShadow: `0 0 0 3px ${accent}${hairline ? ', 0 0 0 5px rgba(255,255,255,0.92)' : ''}, 0 0 0 100vmax rgba(0,0,0,0.30)`,
        pointerEvents: 'none',
        zIndex: '2147483647',
      })
      // Outside the corner where that is in shot, and otherwise inside, far
      // enough in to clear the frame's edge: a row wider than the picture has
      // no outside left of it, and the ring's own corner is off the picture too.
      const ringLeft = box.x - pad
      const ringTop = box.y - pad
      const left = ringLeft - 14 >= frame.x + 2 ? -14 : Math.max(10, frame.x + 10 - ringLeft)
      const top = ringTop - 14 >= frame.y + 2 ? -14 : Math.max(10, frame.y + 10 - ringTop)
      const badge = document.createElement('div')
      Object.assign(badge.style, {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: '28px',
        height: '28px',
        borderRadius: '999px',
        background: accent,
        color: accentText,
        font: '700 13px/28px Poppins, system-ui, sans-serif',
        textAlign: 'center',
        boxShadow: hairline
          ? '0 0 0 2px rgba(255,255,255,0.92), 0 2px 8px rgba(0,0,0,0.25)'
          : '0 2px 8px rgba(0,0,0,0.25)',
      })
      badge.textContent = String(n)
      el.appendChild(badge)
      document.body.appendChild(el)
    },
    { box, n, frame },
  )
}

type Box = { x: number; y: number; width: number; height: number }

/** The smallest box around two. */
function union(a: Box, b: Box): Box {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }
}

/**
 * The drag picture: a dim over everything but the two boxes, the dragged one
 * ringed and numbered, the destination ringed in a dashed line, and an arrow
 * from the one to the other, bowed a little so it reads as a movement.
 */
async function ringDrag(page: Page, from: Box, to: Box, n: number): Promise<void> {
  await page.evaluate(
    ({ from, to, n }) => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#111827'
      const accentText = getComputedStyle(document.documentElement).getPropertyValue('--accent-text').trim() || '#ffffff'
      const pad = 6
      const W = window.innerWidth
      const H = window.innerHeight
      const ns = 'http://www.w3.org/2000/svg'
      const el = (tag: string, attrs: Record<string, string | number>) => {
        const node = document.createElementNS(ns, tag)
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v))
        return node
      }
      const svg = el('svg', { id: 'trek-help-ring', width: W, height: H, viewBox: `0 0 ${W} ${H}` })
      Object.assign(svg.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '2147483647' })
      const grow = (b: typeof from) => ({ x: b.x - pad, y: b.y - pad, w: b.width + 2 * pad, h: b.height + 2 * pad })
      const a = grow(from)
      const b = grow(to)
      const defs = el('defs', {})
      const mask = el('mask', { id: 'trek-help-mask' })
      mask.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'white' }))
      mask.appendChild(el('rect', { x: a.x, y: a.y, width: a.w, height: a.h, rx: 12, fill: 'black' }))
      mask.appendChild(el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, fill: 'black' }))
      defs.appendChild(mask)
      const marker = el('marker', { id: 'trek-help-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' })
      marker.appendChild(el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: accent }))
      defs.appendChild(marker)
      svg.appendChild(defs)
      svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'rgba(0,0,0,0.30)', mask: 'url(#trek-help-mask)' }))
      svg.appendChild(el('rect', { x: a.x, y: a.y, width: a.w, height: a.h, rx: 12, fill: 'none', stroke: accent, 'stroke-width': 3 }))
      svg.appendChild(el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, fill: 'none', stroke: accent, 'stroke-width': 3, 'stroke-dasharray': '10 7' }))
      // From the edge of the dragged box that faces the destination to the facing edge there.
      const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }
      const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
      const horizontal = Math.abs(bc.x - ac.x) > Math.abs(bc.y - ac.y)
      const start = horizontal ? { x: bc.x > ac.x ? a.x + a.w : a.x, y: ac.y } : { x: ac.x, y: bc.y > ac.y ? a.y + a.h : a.y }
      const end = horizontal ? { x: bc.x > ac.x ? b.x : b.x + b.w, y: bc.y } : { x: bc.x, y: bc.y > ac.y ? b.y : b.y + b.h }
      const dx = end.x - start.x
      const dy = end.y - start.y
      const len = Math.hypot(dx, dy) || 1
      const bow = Math.min(90, len * 0.18)
      const ctrl = { x: (start.x + end.x) / 2 - (dy / len) * bow, y: (start.y + end.y) / 2 + (dx / len) * bow }
      svg.appendChild(el('path', {
        d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
        fill: 'none', stroke: 'rgba(255,255,255,0.9)', 'stroke-width': 8, 'stroke-linecap': 'round',
      }))
      svg.appendChild(el('path', {
        d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
        fill: 'none', stroke: accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': 'url(#trek-help-arrow)',
      }))
      const badge = el('g', {})
      badge.appendChild(el('circle', { cx: a.x, cy: a.y, r: 14, fill: accent }))
      const text = el('text', { x: a.x, y: a.y + 5, 'text-anchor': 'middle', fill: accentText, 'font-family': 'Poppins, system-ui, sans-serif', 'font-size': 13, 'font-weight': 700 })
      text.textContent = String(n)
      badge.appendChild(text)
      svg.appendChild(badge)
      document.body.appendChild(svg)
    },
    { from, to, n },
  )
}

async function unring(page: Page): Promise<void> {
  await page.evaluate(() => document.getElementById('trek-help-ring')?.remove())
}

/**
 * The release-notes modal greets every user once per version and its overlay
 * swallows every click underneath. clearNotices handles the plain notices; this
 * one has its own close button.
 */
export async function dismissReleaseNotice(page: Page): Promise<void> {
  const close = page.locator('.rn-close')
  await close.waitFor({ state: 'visible', timeout: 2_500 }).catch(() => {})
  for (let i = 0; i < 3 && (await close.isVisible().catch(() => false)); i++) {
    await close.click()
    await page.waitForTimeout(500)
  }
  await expect(page.locator('.rn-overlay')).toHaveCount(0)
}

/** Fonts loaded, images decoded, transitions landed, network quiet (bounded: /ws never idles). */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
  await page.evaluate(async () => { await document.fonts.ready })
  // Bounded: a picture whose request never answers (a tile, a CDN flag) must
  // not hold the run; three seconds is longer than anything that does load.
  await page.evaluate(async () => {
    const pending = Array.from(document.images)
      .filter(img => !img.complete)
      .map(img => new Promise(res => { img.onload = img.onerror = res }))
    await Promise.race([Promise.all(pending), new Promise(res => setTimeout(res, 3000))])
  })
  await showLoadedTiles(page)
  await page.waitForTimeout(450)
}

/**
 * Show the raster tiles that have arrived.
 *
 * Leaflet fades a tile in over 200 ms and works out how far it has got from
 * `+new Date()`. The clock is pinned to the picture day (see PICTURE_DAY), so
 * that difference never grows, the tile keeps the opacity 0 it was created
 * with, and the map is a grey rectangle in the picture even though every tile
 * came back with a 200. Nothing else on the page fades from the wall clock, so
 * this only ever touches tiles that are already loaded.
 */
async function showLoadedTiles(page: Page): Promise<void> {
  await page.evaluate(() => {
    // A rule, not an inline style: Leaflet re-runs the fade on every frame and
    // writes the opacity back, so the only thing that holds is a stylesheet
    // that outranks it. `leaflet-tile-loaded` is Leaflet's own class, put on a
    // tile the moment its image arrives, so a tile still in flight stays hidden.
    if (!document.getElementById('trek-help-tiles')) {
      const style = document.createElement('style')
      style.id = 'trek-help-tiles'
      style.textContent = '.leaflet-tile-loaded { opacity: 1 !important; }'
      document.head.appendChild(style)
    }
    for (const tile of document.querySelectorAll('img.leaflet-tile')) {
      const img = tile as HTMLImageElement
      if (img.complete && img.naturalWidth > 0) img.classList.add('leaflet-tile-loaded')
    }
  })
}
