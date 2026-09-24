import type { CSSProperties } from 'react'
import type {
  BookBadgeElement, BookCountriesElement, BookElement, BookListElement, BookMapElement,
  BookMetric, BookStatsElement, BookUnits,
} from '@trek/shared'
import {
  Camera, CalendarDays, Footprints, Globe, MapPin, Navigation, Route,
  type LucideIcon,
} from 'lucide-react'
import { fontStack } from './bookFonts'
import { brightness } from './folioColour'
import { COUNTRY_SHAPES, countryParts, countryWorldPath, projectMercator, unprojectMercator } from './countryShapes'
import { projectOntoTiles, tileView, usableStaticUrl } from './mapTiles'
import { useCartoApiKey } from '../../hooks/useTileUrl'
import { FLAG_H, FLAG_W, flagBands, flagDisc, flagSpec } from './flags'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'
import { useTranslation } from '../../i18n'

/**
 * The elements drawn from the journey itself: a route map, the figures, the
 * countries, and the small marks that go between them.
 *
 * ── Why these exist at all ────────────────────────────────────────────────
 *
 * A photo book of a trip is not an album. The trip carries facts — how far, how
 * long, which countries, which way round — and those facts make pages that
 * photographs cannot. It is also the one thing TREK is in a position to do
 * properly: the numbers are sitting in the trips already, and nobody has to
 * type them in.
 *
 * ── Why they carry their own values ───────────────────────────────────────
 *
 * Every one of them is drawn from what is *in the element*, never from a live
 * query. The document holds the numbers, the coordinates and the country codes
 * as of when the element was placed. See the note in `book.schema.ts` for the
 * reasoning; the short version is that the print renderer is headless Chromium
 * loading a page, and a page that needs an authenticated fetch to know what it
 * says will one day print blank.
 *
 * ── Why the map is vector ─────────────────────────────────────────────────
 *
 * Map tiles carry a licence, need fetching at render time, and go soft the
 * moment they are printed larger than the zoom they were cut for. The
 * silhouettes here come from the boundaries the server already bundles for
 * Atlas, simplified offline into `countryShapes.ts`, and they print sharp at
 * any size because they are outlines rather than pictures of outlines.
 */

/** The elements this file draws. */
type TravelElement =
  | BookMapElement | BookStatsElement | BookCountriesElement | BookBadgeElement | BookListElement

/**
 * Type sizes are a fraction of the frame, not a fixed number of points.
 *
 * A stats panel dragged from 60mm to 200mm has to grow its figures with it —
 * everywhere else in Studio type is set in points and stays put when the box
 * changes, but these elements are compositions rather than paragraphs, and a
 * composition that keeps 8pt labels while its box triples is broken. `textScale`
 * is the user's thumb on top of that.
 *
 * The fraction is of the **height**. Taking the shorter side instead looked
 * equivalent and was not: a badge is 50mm wide and 17mm tall, so the shorter
 * side is the height anyway — but a country list is 130mm by 22mm, and reading
 * 6% off the *height* of a row is what sets a name, while 6% of 22 for an
 * element that is 130 across produced 1.4mm type nobody could read. Height is
 * what a line of text has to fit into; width only ever limits it.
 */
function typeSize(el: TravelElement, base: number): number {
  return Math.max(1.2, el.frame.h * base * el.textScale)
}

/** Two decimals of a millimetre, matching what the document stores. */
const round2 = (n: number) => Math.round(n * 100) / 100
/** Tile geometry, kept finer than the rest: see the note where it is used. */
const round3 = (n: number) => Math.round(n * 1000) / 1000

/**
 * How far each tile is drawn past its own square, in millimetres.
 *
 * ── Why it is this large, and why it is a fraction ───────────────────────
 *
 * A tile boundary that lands mid-pixel leaves a hairline of paper showing
 * through the map, and the eye finds it immediately: it reads as a fold or a
 * scratch rather than as rounding. Drawing each tile slightly larger than its
 * spacing closes that, and costs nothing, because the strip that overlaps is
 * the same picture the neighbour draws there anyway.
 *
 * It used to be a flat twelve hundredths of a millimetre, which is about half a
 * device pixel at 1:1 — and the editor does not draw at 1:1. The page is
 * scaled, so at a third of full size that overlap is a sixth of a pixel and the
 * seams come back, which is exactly when a map is full of them: a page-sized
 * satellite map is a hundred and fifty tiles, so it has some three hundred
 * internal edges to get wrong.
 *
 * Four percent of a tile survives every zoom the canvas offers, and the floor
 * covers the case of a tile drawn very small. The element clips, so the
 * overhang at the last row and column never shows.
 */
const tileOverlapMm = (size: number) => Math.max(0.8, size * 0.04)

/** #rrggbb plus an alpha. */
function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function TravelElementView({ el, frameStyle, big = false }: {
  el: BookElement
  frameStyle: CSSProperties
  /** Drawn at a size worth fetching real imagery for, rather than as a thumbnail. */
  big?: boolean
}) {
  if (el.kind === 'map') return <MapView el={el} frameStyle={frameStyle} big={big} />
  if (el.kind === 'stats') return <StatsView el={el} frameStyle={frameStyle} />
  if (el.kind === 'countries') return <CountriesView el={el} frameStyle={frameStyle} />
  if (el.kind === 'badge') return <BadgeView el={el} frameStyle={frameStyle} />
  if (el.kind === 'list') return <ListView el={el} frameStyle={frameStyle} />
  return null
}

/* ── Map ──────────────────────────────────────────────────────────────── */

/**
 * Land and border only — no fill behind the map.
 *
 * The dark and paper styles used to paint their own background across the whole
 * frame, and on a page that is exactly wrong: a map is a piece of geography
 * sitting on the paper, not a window cut through it. A filled rectangle covers
 * whatever the spread had there, cannot be laid over a photograph, and prints
 * a slab of ink for no reason. What distinguishes the four styles is how the
 * land is drawn, which is enough.
 */
/**
 * How heavy the type is set, and one step down for the labels under it.
 *
 * These elements draw at two levels at once — a figure over its caption, a
 * country's name over its outline — and the pair has to move together, the way
 * `textScale` moves their size. Hard-coded 700s meant the only way to lighten a
 * stats block was to not use one.
 */
const heavy = (el: { weight: number }) => el.weight
const light = (el: { weight: number }) => Math.max(400, el.weight - 100)

const MAP_PALETTES = {
  minimal: { land: '#e9e5dc', border: '#d6d0c4', onDark: false },
  outline: { land: 'transparent', border: '#b9b3a6', onDark: false },
  dark: { land: '#2b3038', border: '#4a515c', onDark: true },
  paper: { land: '#efe8d8', border: '#cbbb96', onDark: false },
}

/**
 * What the route is drawn in.
 *
 * The element's accent, except on the dark map, where the accent's default —
 * ink — would be a black line on a near-black country. A colour someone chose
 * is still theirs: only the default is overridden, and only where it would be
 * invisible.
 */
const DEFAULT_ACCENT = '#111111' // theme-lint-disable — the contract's default, matched here

/** Ink for a mark that picks its own, and its opposite. */
const BADGE_DARK_INK = '#1c1b19' // theme-lint-disable — ink on a printed page, not a UI token
const BADGE_LIGHT_INK = '#ffffff' // theme-lint-disable — paper white on a filled chip

/**
 * What colour a mark's words are.
 *
 * Automatic unless the element says otherwise, and what automatic means depends
 * on what the mark is: a chip carries its words on its own fill, so they answer
 * to the fill's brightness; a day or a date drawn plain takes the accent,
 * because that is the figure the page is built around. Anything else is
 * ordinary text in the text colour.
 *
 * The moment somebody picks a colour this steps aside completely. That is the
 * point of the flag: automatic is a good default and a bad cage.
 */
function badgeInk(el: BookBadgeElement): string {
  if (!el.autoColor) return el.color
  if (el.style === 'chip') return brightness(el.accent) > 0.55 ? BADGE_DARK_INK : BADGE_LIGHT_INK
  if (el.variant === 'day' || el.variant === 'date') return el.accent
  return el.color
}
function routeInk(accent: string, onDark: boolean): string {
  if (!onDark) return accent
  return accent.toLowerCase() === DEFAULT_ACCENT ? '#f2efe9' : accent // theme-lint-disable — paper on a dark map
}

/**
 * The route, drawn.
 *
 * The view is fitted to whatever it has to show — the countries and the stops
 * together — with a uniform scale, so a route across Iceland is not stretched
 * to fill a spread-wide frame. Padding is a share of the fitted span rather
 * than a fixed number of millimetres, which keeps the margin looking the same
 * whether the map is 40mm across or 300.
 */
function MapView({ el, frameStyle, big = false }: {
  el: BookMapElement
  frameStyle: CSSProperties
  /** False in a thumbnail, where a page of imagery would be a page of waste. */
  big?: boolean
}) {
  const cartoKey = useCartoApiKey()
  const palette = MAP_PALETTES[el.style]
  // Per element: two cut maps on one spread sharing a stencil would both be cut
  // to whichever of them rendered last.
  const clipId = `st-clip-${el.id}`
  const ink = routeInk(el.accent, palette.onDark)
  /** Whether the ground under the line is a photograph rather than paper. */
  const imagery = el.source === 'tiles' || el.source === 'static'
  /*
   * Country outlines are the vector map's *subject*; over real imagery they are
   * a second coastline drawn on top of the one in the picture. So they are only
   * drawn when there is no picture underneath.
   */
  /*
   * The outlines are needed for two different jobs, and only one of them is
   * drawing. As a picture they are the vector map's subject, and over real
   * imagery they would be a second coastline on top of the one already in the
   * photograph. As a stencil they are what the imagery is cut to, which is
   * exactly the case where there IS imagery — so the geometry is loaded
   * whenever either job wants it, and drawn only for the first.
   */
  const wantsStencil = el.clip === 'country'
  const shapes = (el.showLand && !imagery) || wantsStencil
    ? el.countries.map(c => COUNTRY_SHAPES[c.toUpperCase()]).filter(Boolean)
    : []
  const drawLand = el.showLand && !imagery
  const points = el.points.map(p => ({ ...p, ...projectMercator(p.lng, p.lat) }))
  /*
   * The travelled way, projected the same as everything else.
   *
   * Segments stay separate: two tracks that do not join must not be drawn as
   * though they did, or a book about a trip with a flight in the middle of it
   * shows a road across the sea.
   */
  /*
   * Defended rather than assumed, unlike the rest of the element's fields.
   *
   * A document that came through the contract always has this. One built by
   * hand somewhere in the editor might not, and the cost of being wrong is not
   * a missing line: reading `.map` off undefined here takes the whole spread
   * down with it, in a renderer that also has to run for print.
   */
  const path = el.path ?? []
  /*
   * The roads, one per leg, `null` where a leg has none. Read the same
   * defensive way `path` is: an element built by hand and cast rather than
   * parsed genuinely has the field missing, and `.length` on undefined takes
   * the whole spread down in a renderer that also has to run for print.
   */
  const roads = el.roads ?? []
  const trail = path.map(seg => seg.map(([lat, lng]) => projectMercator(lng, lat)))

  /*
   * ── What the view is fitted to ────────────────────────────────────────
   *
   * The journey, not the geography. Fitting to the country outlines meant a
   * trip that stayed inside Berlin was drawn as the whole of Germany with two
   * dots in the middle of it: technically a map of where you were, useless as
   * a page about the trip. The outlines are still drawn, they simply run off
   * the edge of the frame the way a coastline does on any real map.
   *
   * `fitToCountries` asks for the other behaviour deliberately, for the page
   * every travel book has: the country entire, with the route inside it.
   */
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  /*
   * Cutting to the coastline only means anything if the coastline is in view,
   * so `clip` implies the country fit however the element was configured.
   */
  const cutToLand = el.clip === 'country' && shapes.length > 0
  const fitToLand = el.fitToCountries || cutToLand || (points.length === 0 && trail.length === 0)
  for (const p of points) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
  }
  for (const seg of trail) {
    for (const p of seg) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
    }
  }
  /*
   * A road wanders well outside the box around the two stops it joins — that is
   * the whole point of drawing it. Fitted to the stops alone, the interesting
   * part of it would be outside the frame.
   */
  for (const road of roads) {
    if (!road) continue
    for (const [lat, lng] of road) {
      const q = projectMercator(lng, lat)
      minX = Math.min(minX, q.x); minY = Math.min(minY, q.y)
      maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y)
    }
  }

  /*
   * The country fit comes last, because it needs to know where the journey is.
   *
   * A country is one path but not one landmass. France's is five rings, three
   * of them Kerguelen, French Guiana and New Caledonia, so unioning its whole
   * bounding box fitted a Paris-Lyon-Nice route to 221 degrees of longitude and
   * printed the three stops as a single dot. Britain does the same through
   * South Georgia, Norway through Svalbard, Ecuador through the Galapagos.
   *
   * So only the rings the journey is near are fitted to. The margin is the
   * route's own size, floored at two degrees, and that floor is the whole of
   * the judgement: at two degrees a Paris-Nice route still pulls in Corsica,
   * which is the picture that trip wants, while Kerguelen at 68 degrees east
   * stays out. Raise it far and the territories come back; drop it to zero and
   * a coastal route sitting just off a simplified coastline stops matching the
   * country it is in.
   *
   * The whole shape is still the fallback — with no route there is nothing to
   * measure against, and a country none of whose rings match is better drawn
   * whole than not at all. The outlines themselves are unchanged either way:
   * the overseas rings are still painted, they just run off the frame the way
   * a coastline does.
   */
  if (fitToLand) {
    const routed = Number.isFinite(minX)
    const margin = Math.max(maxX - minX, maxY - minY, 2)
    const nearX0 = minX - margin, nearY0 = minY - margin
    const nearX1 = maxX + margin, nearY1 = maxY + margin
    for (const s of shapes) {
      const near = routed
        ? countryParts(s).filter(p => p[0] <= nearX1 && p[2] >= nearX0 && p[1] <= nearY1 && p[3] >= nearY0)
        : []
      for (const b of near.length > 0 ? near : [s.b]) {
        minX = Math.min(minX, b[0]); minY = Math.min(minY, b[1])
        maxX = Math.max(maxX, b[2]); maxY = Math.max(maxY, b[3])
      }
    }
  }

  /*
   * ── The bow ───────────────────────────────────────────────────────────
   *
   * A straight line between two stops a continent apart is a claim about the
   * journey that is plainly false, and a shallow curve is how printed maps have
   * always said "this part was a flight". Two gates decide how much:
   *
   * **How far it was, in kilometres.** A fact about the journey rather than
   * about the zoom, so two cafes four kilometres apart stay straight at every
   * size and Tokyo to Los Angeles bows at every size. Ramped smoothly from
   * 150km to 15000km rather than switched at a threshold, or a route would have
   * one leg visibly curved and its neighbour dead straight.
   *
   * **Which way it runs.** A meridian is a great circle *and* a straight line
   * in Mercator, so bowing a due north-south leg draws a detour that never
   * happened. The east-west share of the leg damps it.
   *
   * The direction is poleward from the route's MEAN latitude, decided once for
   * the element: per leg, a chain crossing the equator would flip sides halfway
   * along and read as random rather than as drawn.
   */
  const bowed = el.routeArc === 'bow' && trail.length === 0 && points.length > 1

  /** Kilometres between two coordinates, for the ramp. */
  const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const r = (d: number) => (d * Math.PI) / 180
    const dLat = r(b.lat - a.lat)
    const dLng = r(b.lng - a.lng)
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  const meanLat = el.points.length
    ? el.points.reduce((sum, p) => sum + p.lat, 0) / el.points.length
    : 0

  /**
   * How far each leg bows, as a share of its own chord, and which way.
   *
   * A fraction rather than a distance, so the same numbers are right on a 40mm
   * inset and a 400mm spread — what the eye reads is the angle the line leaves
   * its marker at, and that is scale free.
   */
  const bows: { k: number; nx: number; ny: number }[] = bowed
    ? el.points.slice(0, -1).map((a, i) => {
      const b = el.points[i + 1]
      const pa = projectMercator(a.lng, a.lat)
      const pb = projectMercator(b.lng, b.lat)
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const d = Math.hypot(dx, dy)
      if (d < 1e-6) return { k: 0, nx: 0, ny: 0 }

      const u = Math.min(1, Math.max(0, Math.log(km(a, b) / 150) / Math.log(10)))
      const ramp = u * u * (3 - 2 * u)
      // How much of the leg runs east-west, which is where a bow is truthful.
      const eastWest = 0.35 + 0.65 * Math.abs(dx / d)

      // The normal, turned to point away from the equator side the route is on.
      let nx = -dy / d
      let ny = dx / d
      const poleward = meanLat >= 0 ? -1 : 1
      if (Math.abs(ny) < 1e-9) {
        // A due north-south leg has no poleward side; break the tie east.
        nx = Math.abs(nx)
      } else if (Math.sign(ny) !== poleward) {
        nx = -nx
        ny = -ny
      }
      return { k: 0.07 * ramp * eastWest, nx, ny }
    })
    : []

  /*
   * The apexes join the extent before it is fitted. Without this the tile
   * window and the vector fit are both cut to the straight chords, and a bowed
   * leg is clipped by the very frame it was fitted to.
   */
  bows.forEach((bow, i) => {
    if (!bow.k) return
    const a = points[i]
    const b = points[i + 1]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    const ax = (a.x + b.x) / 2 + bow.k * d * bow.nx
    const ay = (a.y + b.y) / 2 + bow.k * d * bow.ny
    minX = Math.min(minX, ax); maxX = Math.max(maxX, ax)
    minY = Math.min(minY, ay); maxY = Math.max(maxY, ay)
  })

  const empty = !Number.isFinite(minX)
  if (empty) { minX = -1; minY = -1; maxX = 1; maxY = 1 }
  /*
   * One stop is a place, not an extent.
   *
   * The window around it used to be two whole degrees, which put a single
   * hotel on a map of half a country. A hundredth of the projected world is
   * roughly a large city and its surroundings: near enough to see where it is,
   * close enough that the pin means something.
   */
  const SINGLE = 0.01
  if (maxX - minX < SINGLE) { const c = (minX + maxX) / 2; minX = c - SINGLE / 2; maxX = c + SINGLE / 2 }
  if (maxY - minY < SINGLE) { const c = (minY + maxY) / 2; minY = c - SINGLE / 2; maxY = c + SINGLE / 2 }

  const W = el.frame.w
  const H = el.frame.h
  /*
   * Room around the route, as a share of the route rather than of the frame.
   *
   * A fixed margin in millimetres is the wrong shape twice over: on a wide
   * route it is a hairline, and on a short one it is most of the picture. A
   * share of the extent keeps the same amount of air around a walk across a
   * city and a drive across a continent.
   */
  // Same defence as `path`: undefined would make this NaN, and a NaN here
  // propagates into every coordinate on the map rather than failing loudly.
  const grow = Math.max(0, el.fitPadding ?? 0.18)
  const spanX = (maxX - minX) * (1 + grow)
  const spanY = (maxY - minY) * (1 + grow)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  minX = cx - spanX / 2; maxX = cx + spanX / 2
  minY = cy - spanY / 2; maxY = cy + spanY / 2

  /*
   * ── The window takes the frame's proportions ─────────────────────────
   *
   * Two fits used to disagree about what the map was of. The outlines and the
   * route were *contained* in the frame — fitted whole, with air on the long
   * side — while the imagery *covered* it, because a map with a strip of paper
   * down one edge is not a map. On a frame whose shape did not match the
   * route's, those are different windows, and the tiles won: the picture filled
   * the box and the route ran off the top of it. Drag a map narrow enough and
   * the line simply left the page.
   *
   * Widening the window to the frame's own proportions makes the two the same
   * window. Cover and contain agree by construction, the route is inside
   * whatever shape the element is dragged to, and the imagery still reaches
   * every edge — it just shows a little more ground on the short side, which is
   * what the extra room was always going to be filled with.
   */
  const aspect = W / H
  const haveW = maxX - minX
  const haveH = maxY - minY
  if (haveW / haveH < aspect) {
    const want = haveH * aspect
    minX = cx - want / 2
    maxX = cx + want / 2
  } else {
    const want = haveW / aspect
    minY = cy - want / 2
    maxY = cy + want / 2
  }

  const scale = Math.min(W / (maxX - minX), H / (maxY - minY))
  const offX = (W - (maxX - minX) * scale) / 2 - minX * scale
  const offY = (H - (maxY - minY) * scale) / 2 - minY * scale
  const at = (x: number, y: number) => ({ x: x * scale + offX, y: y * scale + offY })

  const stroke = Math.max(0.12, Math.min(W, H) * 0.006)
  /*
   * Finer than the first version, which drew a 5mm dot and a 2mm line on a
   * 150mm page: at that weight the route stops being a line on a map and
   * becomes a diagram of one. A printed map's marks are small — the reader is
   * six inches from the page, not across a room from a screen.
   */
  const routeWidth = Math.max(0.3, Math.min(W, H) * 0.0075)
  const pin = Math.max(0.35, Math.min(W, H) * 0.0085)
  const label = typeSize(el, 0.035)

  /*
   * ── The drawn treatment ───────────────────────────────────────────────
   *
   * A separate scale from the plain one above, because it is a different
   * drawing rather than the same drawing recoloured. Fractions of the shorter
   * side with a floor and a ceiling: the floor keeps a 40mm inset from losing
   * the line, and the ceiling is what the plain route is missing — `routeWidth`
   * has no upper bound and reaches 1.6mm on a page, which is part of why the
   * current map reads as plotted rather than as drawn.
   *
   * The line lands at about a third of a marker's radius, which is the ratio
   * the printed reference holds at every size.
   */
  const S = Math.min(W, H)
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const drawn = el.routeStyle === 'drawn'
  const coreW = clamp(S * 0.0055, 0.32, 1.3)
  const casingW = coreW * 1.9
  const beadR = clamp(coreW * 3.1, 1.7, 4.8)
  const beadRing = beadR * 0.2
  const dotR = coreW * 1.5
  /*
   * A numbered stop is bigger than a dot and smaller than a photograph: it has
   * to hold two digits legibly at page size without competing with the pictures
   * beside it.
   */
  const numR = clamp(coreW * 2.2, 1.3, 3.4)
  /*
   * The digit reads against the marker's own fill rather than against the page,
   * so it inverts with it: dark on a light line, light on a dark one. Measured
   * the same way the marks decide their ink.
   */
  const numInk = brightness(el.accent) > 0.55 ? '#1c1b19' : '#ffffff' // theme-lint-disable — print ink
  const dashOn = coreW * 2.4
  const dashOff = coreW * 1.8

  /*
   * ── Why the colours key on the ground rather than on the accent ───────
   *
   * One route crosses near-black bathymetry and bright desert in the same
   * picture, so no single colour works: what works is a light line with a dark
   * edge under it over imagery, and the same idea inverted over pale paper.
   * Keying it on what is underneath means any accent the user picks stays
   * legible, instead of the panel having to warn them off half the palette.
   */
  const lightGround = imagery || palette.onDark
  /*
   * The line is the element's accent, full stop — which is why a map placed
   * over imagery is given a white accent rather than being special-cased here.
   * Guessing "the accent is still the default, so I will override it" cannot
   * tell a colour somebody chose from one a constructor happened to write, and
   * the moment it guesses wrong the user has a control that does nothing.
   *
   * The casing is the part that reads the ground: a dark halo under a light
   * line over photography, a light halo under a dark line on pale paper. That
   * is what keeps one route legible across near-black sea and bright desert in
   * the same picture, whatever colour the line itself is.
   */
  const coreInk = el.accent
  const casingInk = lightGround ? '#000000' : '#ffffff' // theme-lint-disable — a halo, not app chrome
  const casingAlpha = lightGround ? 0.3 : 0.55

  /*
   * Real imagery, when the element was placed with a source that has some.
   *
   * It sits *under* the SVG rather than inside it: tiles are raster and the
   * route is vector, and layering them as two elements keeps the line sharp at
   * any print size instead of resampling it along with the picture.
   */
  /*
   * The tiles are cut to the same thing the vector fit uses, the travelled way
   * included — otherwise a route that wanders outside the box around its stops
   * runs off the edge of its own map.
   */
  const tileExtent = [
    ...el.points.map(p => ({ lat: p.lat, lng: p.lng })),
    ...path.flatMap(seg => seg.map(([lat, lng]) => ({ lat, lng }))),
  ]
  // The window the fit above arrived at, back in coordinates, so the tiles
  // cover exactly what the vector map covers.
  const topLeft = unprojectMercator(minX, minY)
  const bottomRight = unprojectMercator(maxX, maxY)
  const tiled = el.source === 'tiles'
    ? tileView(tileExtent, { w: W, h: H }, el.tileUrl, el.zoom, {
      minLng: topLeft.lng,
      maxLat: topLeft.lat,
      maxLng: bottomRight.lng,
      minLat: bottomRight.lat,
    }, big ? 'print' : 'preview', cartoKey)
    : null

  /*
   * The route, in whichever projection is drawing.
   *
   * Two projections are in play — the vector fit, which sizes itself to the
   * country outlines, and the tile grid, which is cut from Web Mercator at a
   * zoom level. Using the wrong one puts the line next to the road rather than
   * on it, which is the sort of error that only shows up once it is printed.
   */
  const route = tiled
    ? el.points.map(p => projectOntoTiles(tiled, p.lng, p.lat))
    : points.map(p => at(p.x, p.y))

  /*
   * The drawn line, which is the travelled way when there is one.
   *
   * Falling back to the stops joined in order is honest for a trip with no
   * routed geometry — it says "these places, in this order" — but where the
   * trip knows the roads, drawing the straight line instead is drawing
   * something that did not happen.
   */
  const trailOnScreen = tiled
    ? path.map(seg => seg.map(([lat, lng]) => projectOntoTiles(tiled, lng, lat)))
    : trail.map(seg => seg.map(p => at(p.x, p.y)))
  /*
   * ── What the plain line is made of ────────────────────────────────────
   *
   * A recorded track wins outright, as it always has. Otherwise the stop chain,
   * cut at every leg that has a road so the road can be drawn in its place —
   * without that cut, a journey with roads for three legs of twelve would print
   * the three and silently drop the other nine, which is what `path` does today
   * when it only covers part of a trip.
   */
  const roadOnScreen = (leg: number) => {
    const road = roads[leg]
    if (!road || road.length < 2) return null
    return road.map(([lat, lng]) => {
      const q = projectMercator(lng, lat)
      return tiled ? projectOntoTiles(tiled, lng, lat) : at(q.x, q.y)
    })
  }

  const chain: { x: number; y: number }[][] = []
  if (route.length > 1) {
    let run: { x: number; y: number }[] = [route[0]]
    for (let i = 0; i < route.length - 1; i++) {
      const road = roadOnScreen(i)
      if (road) {
        if (run.length > 1) chain.push(run)
        chain.push(road)
        run = [route[i + 1]]
      } else {
        run.push(route[i + 1])
      }
    }
    if (run.length > 1) chain.push(run)
  }

  const lines = trailOnScreen.length ? trailOnScreen : chain

  /*
   * ── The drawn line, as path strings ───────────────────────────────────
   *
   * One strand per contiguous run. A recorded track is always straight
   * segments and always solid: bowing a line somebody actually walked, or
   * dashing it, would be drawing a journey that did not happen. The inferred
   * stop chain is where the bows and the dashes live.
   *
   * The bow is faded out a second time here, in millimetres. `bows` decided how
   * much a leg curves as a share of its own chord, which is a fact about the
   * journey; this is the fact about the page, and it stops a 40mm inset from
   * showing a hairline wobble that reads as a wobble rather than as a curve.
   */
  const strands: { d: string; dash?: string }[] = []
  if (drawn) {
    if (trailOnScreen.length) {
      for (const seg of trailOnScreen) {
        if (seg.length < 2) continue
        strands.push({ d: `M${seg.map(pt => `${round2(pt.x)} ${round2(pt.y)}`).join(' L')}` })
      }
    } else if (route.length > 1) {
      // Straight legs join into one strand; each bowed leg is its own, so it
      // can be dashed without dashing its neighbours.
      let run: string[] = []
      const flush = () => {
        if (run.length > 1) strands.push({ d: `M${run.join(' L')}` })
        run = []
      }
      for (let i = 0; i < route.length - 1; i++) {
        const a = route[i]
        const b = route[i + 1]

        /*
         * A leg somebody asked the roads for is drawn as the road, solid and
         * unbowed: it is the way that was actually taken, so neither the curve
         * nor the dash — both of which mean "inferred" — belongs on it.
         */
        const road = roads[i]
        if (road && road.length > 1) {
          flush()
          const onScreen = road.map(([lat, lng]) => {
            const q = projectMercator(lng, lat)
            return tiled ? projectOntoTiles(tiled, lng, lat) : at(q.x, q.y)
          })
          strands.push({ d: `M${onScreen.map(pt => `${round2(pt.x)} ${round2(pt.y)}`).join(' L')}` })
          continue
        }

        const bow = bows[i]
        const dmm = Math.hypot(b.x - a.x, b.y - a.y)
        let sag = bow ? bow.k * dmm : 0
        if (sag > 0) {
          // Below about a stroke width the curve is not read as one.
          const v = Math.min(1, Math.max(0, (sag - coreW * 0.6) / coreW))
          sag *= v * v * (3 - 2 * v)
        }
        if (!sag) {
          if (!run.length) run.push(`${round2(a.x)} ${round2(a.y)}`)
          run.push(`${round2(b.x)} ${round2(b.y)}`)
          continue
        }
        flush()
        /*
         * A quadratic reaches only half way to its control point at the middle,
         * which is why the apex is doubled here — the same arithmetic the shape
         * paths already rely on.
         */
        const cxp = (a.x + b.x) / 2 + 2 * sag * bow.nx
        const cyp = (a.y + b.y) / 2 + 2 * sag * bow.ny
        const d = `M${round2(a.x)} ${round2(a.y)} Q${round2(cxp)} ${round2(cyp)} ${round2(b.x)} ${round2(b.y)}`
        if (el.routeDash === 'arcs') {
          /*
           * Phase-fitted, so every leg ends on a whole dash at its marker
           * rather than on a stub. Butt caps: a round cap swells each dash by a
           * full stroke width and closes the gaps it was drawn for.
           */
          const arcLen = dmm * (1 + (8 / 3) * (sag / dmm) ** 2)
          const n = Math.max(1, Math.round(arcLen / (dashOn + dashOff)))
          const fit = arcLen / (n * (dashOn + dashOff))
          strands.push({ d, dash: `${round2(dashOn * fit)} ${round2(dashOff * fit)}` })
        } else {
          strands.push({ d })
        }
      }
      flush()
    }
  }

  /*
   * ── Which stops carry a photograph ────────────────────────────────────
   *
   * Walked in order, carrying the last bead's position: a stop closer than a
   * bead's width to the one before it becomes a dot instead. That is what
   * produces the reference's string of beads that touch and overlap slightly,
   * rather than a solid caterpillar of overlapping discs — and nothing is
   * dropped, so the shape of the route survives whatever the spacing does.
   *
   * The two ends always keep their picture when they have one: they are where
   * a reader looks first.
   */
  const beads: { i: number; x: number; y: number; photo: number | null }[] = []
  let numbered = false
  if (drawn) {
    // Too small to carry photographs at all: a bead wider than a twelfth of the
    // frame is a picture with a map around it.
    const roomForPhotos = el.pinStyle === 'photo' && big && beadR * 2 <= S * 0.16
    /*
     * Numbers stand in for the photographs that are not there, so they belong
     * to the photo treatment alone. A map asked for dots gets dots, and a
     * thumbnail gets dots too: two digits at 130px is a smudge.
     */
    numbered = el.pinStyle === 'photo' && big && numR * 2 <= S * 0.12
    let last: { x: number; y: number } | null = null
    route.forEach((pt, i) => {
      const photoId = (el.points[i] as { photoId?: number | null } | undefined)?.photoId ?? null
      const isEnd = i === 0 || i === route.length - 1
      const room = !last || Math.hypot(pt.x - last.x, pt.y - last.y) >= beadR * 1.15
      const bead = roomForPhotos && photoId != null && (isEnd || room)
      if (bead) last = { x: pt.x, y: pt.y }
      beads.push({ i, x: pt.x, y: pt.y, photo: bead ? photoId : null })
    })
  }
  const anyBead = beads.some(b => b.photo != null)

  return (
    <div style={{ ...frameStyle, overflow: 'hidden' }}>
      {/*
        The tile grid, laid out in millimetres under the route.

        Each tile is placed rather than flowed: a grid of images with no gaps
        between them is not something CSS layout gives you for free at
        fractional millimetre sizes. They are drawn past their own square on
        purpose — see `tileOverlapMm`, which is what keeps the seams closed at
        every zoom the canvas offers.
      */}
      {tiled && !cutToLand && tiled.tiles.map(t => (
        <img
          key={`${t.z}-${t.x}-${t.y}`}
          src={t.url}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: `${round3(tiled.originX + t.x * tiled.size)}mm`,
            top: `${round3(tiled.originY + t.y * tiled.size)}mm`,
            width: `${round3(tiled.size + tileOverlapMm(tiled.size))}mm`,
            height: `${round3(tiled.size + tileOverlapMm(tiled.size))}mm`,
            display: 'block',
          }}
        />
      ))}

      {/*
        Or one picture, for the styles that only exist as a rendered map. The
        URL was resolved when the element was placed, so nothing is negotiated
        at print time.
      */}
      {el.source === 'static' && el.tileUrl && !cutToLand && (
        <img
          src={usableStaticUrl(el.tileUrl)}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      <svg
        width={`${W}mm`}
        height={`${H}mm`}
        viewBox={`0 0 ${W} ${H}`}
        /*
         * Accuracy over speed, everywhere on this map.
         *
         * The default lets a browser trade geometric precision for drawing
         * speed once a picture gets busy, and a route with two hundred stops
         * over a hundred and fifty tiles is busy. What that trade costs is
         * exactly what a printed line must not lose: a bowed leg goes faceted
         * and a bead's ring goes lumpy. Nothing here is a filter, so the whole
         * drawing stays vector into the PDF and the press resolves it, not the
         * browser.
         */
        shapeRendering="geometricPrecision"
        style={{ display: 'block', position: 'relative' }}
      >
        {/*
          The land as a stencil.

          Defined once and used by both the picture and, on a cut map, nothing
          else: the outlines below draw themselves normally when the map is a
          rectangle, and become the edge of the picture when it is not.
        */}
        {/*
          A stencil per bead, in the map's own millimetres.

          Its own `defs` rather than a shared one: the block below belongs to
          cutting the map to a coastline and only exists when that is on, and a
          stencil nested inside a condition that has nothing to do with it is
          how the photographs came out square — the clip-path pointed at an id
          that was never written, so `slice` showed the corners it was supposed
          to cut off.

          User space rather than the tidier fractional stencil, because a
          fractional clip on an `<image>` is applied against a box browsers
          disagree about, and a silent no-op looks exactly like the bug above.
        */}
        {anyBead && (
          <defs>
            {beads.filter(m => m.photo != null).map(m => (
              <clipPath key={m.i} id={`st-bead-${el.id}-${m.i}`} clipPathUnits="userSpaceOnUse">
                <circle cx={m.x} cy={m.y} r={beadR} />
              </clipPath>
            ))}
          </defs>
        )}

        {cutToLand && (
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              {shapes.map((sh, i) => (
                <path key={i} d={countryWorldPath(sh)} transform={`translate(${offX} ${offY}) scale(${scale})`} />
              ))}
            </clipPath>
          </defs>
        )}

        {/*
          Imagery, cut to the stencil.

          Inside the SVG rather than under it, because clipping to a path is
          something SVG does exactly and CSS does approximately — and this has
          to survive a print pipeline, where an approximation is a soft edge
          around a country.
        */}
        {cutToLand && tiled && (
          <g clipPath={`url(#${clipId})`}>
            {tiled.tiles.map(t => (
              <image
                key={`${t.z}-${t.x}-${t.y}`}
                href={t.url}
                x={round3(tiled.originX + t.x * tiled.size)}
                y={round3(tiled.originY + t.y * tiled.size)}
                width={round3(tiled.size + tileOverlapMm(tiled.size))}
                height={round3(tiled.size + tileOverlapMm(tiled.size))}
                preserveAspectRatio="none"
              />
            ))}
          </g>
        )}
        {cutToLand && el.source === 'static' && el.tileUrl && (
          <g clipPath={`url(#${clipId})`}>
            <image href={usableStaticUrl(el.tileUrl)} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
          </g>
        )}

        {(drawLand || cutToLand) && shapes.map((s, i) => (
          <path
            key={i}
            d={countryWorldPath(s)}
            // The path is in projected world units, so the transform does the
            // fitting and the stroke is divided back out — the border stays the
            // width it was asked for instead of scaling with the map.
            transform={`translate(${offX} ${offY}) scale(${scale})`}
            // On a cut map the picture is the fill, and this path is only the
            // edge around it — filling it as well would paint the land flat
            // over the very imagery it was cut to show.
            fill={cutToLand ? 'none' : palette.land}
            stroke={palette.border}
            strokeWidth={stroke / scale}
            strokeLinejoin="round"
          />
        ))}

        {el.showRoute && !drawn && lines.map((seg, i) => seg.length > 1 && (
          <polyline
            key={i}
            points={seg.map(p => `${round2(p.x)},${round2(p.y)}`).join(' ')}
            fill="none"
            stroke={ink}
            strokeWidth={routeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/*
          The drawn line: two strokes, casing first.

          Not a filter. A drop shadow does survive the print round trip, but a
          filtered subtree is rasterised into the PDF at whatever resolution the
          browser picks, which is the one thing the millimetres-in-the-DOM design
          exists to avoid. Two stacked paths give the same faint dark edge and
          stay vector all the way to the press.

          All the casings before any core, never leg by leg: interleaved, the
          casing of one leg overprints the core of the last one at the joint.
        */}
        {el.showRoute && drawn && strands.length > 0 && (
          <>
            {strands.map((strand, i) => (
              <path
                key={`c${i}`}
                d={strand.d}
                fill="none"
                stroke={casingInk}
                strokeOpacity={casingAlpha}
                strokeWidth={casingW}
                strokeLinecap={strand.dash ? 'butt' : 'round'}
                strokeLinejoin="round"
                strokeDasharray={strand.dash}
              />
            ))}
            {strands.map((strand, i) => (
              <path
                key={`s${i}`}
                d={strand.d}
                fill="none"
                stroke={coreInk}
                strokeWidth={coreW}
                strokeLinecap={strand.dash ? 'butt' : 'round'}
                strokeLinejoin="round"
                strokeDasharray={strand.dash}
              />
            ))}
          </>
        )}

        {el.showPins && !drawn && route.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === 0 || i === route.length - 1 ? pin * 1.35 : pin}
            // The intermediate stops are hollow, so a run of them reads as a
            // dotted line rather than as a caterpillar.
            fill={i === 0 || i === route.length - 1 ? ink : (palette.onDark ? '#2b3038' : '#ffffff')}
            stroke={ink}
            strokeWidth={routeWidth * 0.6}
          />
        ))}

        {/*
          The drawn markers: a small round photograph where there is one, a dot
          where there is not.

          The dot is the designed state rather than a failure — a printed route
          with a few plain marks between the pictures reads as a route, while
          one with empty rings reads as a bug. The white disc under the picture
          is also what a photograph that fails to load degrades to, so the paper
          shows a deliberate marker rather than a hole.
        */}
        {el.showPins && drawn && beads.map(m => (
          m.photo != null ? (
            <g key={m.i}>
              {/* The shadow, as two translucent discs rather than a filter. */}
              <circle cx={m.x} cy={m.y + coreW * 0.3} r={beadR + coreW * 0.55} fill="#000000" fillOpacity={0.1} />
              <circle cx={m.x} cy={m.y + coreW * 0.15} r={beadR + coreW * 0.25} fill="#000000" fillOpacity={0.16} />
              <circle cx={m.x} cy={m.y} r={beadR} fill="#ffffff" />
              {/*
                Always the thumbnail, never photoSrc(id, big): `big` is true in
                print, and a full-size original to fill a seven-millimetre
                circle is several megabytes per stop for detail no press can
                resolve.
              */}
              <image
                href={`/api/photos/${m.photo}/thumbnail`}
                x={round2(m.x - beadR)}
                y={round2(m.y - beadR)}
                width={round2(beadR * 2)}
                height={round2(beadR * 2)}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#st-bead-${el.id}-${m.i})`}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={beadR - beadRing / 2}
                fill="none"
                stroke="#ffffff"
                strokeWidth={beadRing}
              />
            </g>
          ) : numbered ? (
            /*
              A stop with no photograph of its own, numbered.

              The alternative was to hand it a picture from somewhere else in
              the journey, which is what this did first and which is a caption
              that lies: a marker at Akureyri showing a photograph taken in Vík
              is wrong in the one place a reader most trusts that a picture is
              OF what it sits on. A number says what the map actually knows —
              this is the fourth stop — and reads as deliberate rather than as
              something missing.
            */
            <g key={m.i}>
              <circle cx={m.x} cy={m.y + coreW * 0.2} r={numR + coreW * 0.35} fill="#000000" fillOpacity={0.14} />
              <circle
                cx={m.x}
                cy={m.y}
                r={numR}
                fill={coreInk}
                stroke={casingInk}
                strokeOpacity={casingAlpha}
                strokeWidth={coreW * 0.5}
              />
              <text
                x={m.x}
                y={m.y + numR * 0.36}
                textAnchor="middle"
                fill={numInk}
                style={{
                  fontFamily: fontStack(el.font),
                  fontSize: `${round2(numR * 1.15)}px`,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {m.i + 1}
              </text>
            </g>
          ) : (
            <circle
              key={m.i}
              cx={m.x}
              cy={m.y}
              r={dotR}
              fill={coreInk}
              stroke={casingInk}
              strokeOpacity={casingAlpha}
              strokeWidth={dotR * 0.22}
            />
          )
        ))}

        {el.showLabels && points.map((p, i) => {
          if (!p.label) return null
          const at2 = route[i]
          return (
            <text
              key={i}
              x={at2.x}
              y={at2.y - pin * 2.4}
              textAnchor="middle"
              fill={el.color}
              style={{
                fontFamily: fontStack(el.font),
                fontSize: label,
                fontWeight: light(el),
                letterSpacing: label * 0.06,
              }}
            >
              {p.label}
            </text>
          )
        })}
      </svg>

      {/*
        No credit line on the map itself.

        The tile licences do require attribution, and it used to be printed in
        the corner of every tiled map for exactly that reason. It is off the
        picture now by decision: a credit box over the artwork is the first
        thing anyone notices on a page they designed, and a book has a better
        place for it. `attribution` is still resolved and still stored on the
        element, so whoever prints the book can set it in the colophon, which
        is where a book has always credited its sources.
      */}
    </div>
  )
}

/* ── Stats ────────────────────────────────────────────────────────────── */

/**
 * The icon beside each figure.
 *
 * lucide, like every other icon in TREK — a hand-drawn set was the first pass
 * and it was the wrong call twice over: it put a second drawing vocabulary next
 * to the one the whole app already uses, and it meant seven paths nobody would
 * ever revisit when lucide gained a better glyph.
 *
 * They size in millimetres despite lucide taking a pixel `size`, because an
 * inline width and height override the attributes it writes while the viewBox
 * stays 24×24 — so the stroke scales with the drawing instead of thinning out
 * on a large panel.
 */
const METRIC_ICONS: Record<BookMetric, LucideIcon> = {
  distance: Route,
  days: CalendarDays,
  steps: Footprints,
  photos: Camera,
  countries: Globe,
  places: MapPin,
  furthest: Navigation,
}

function metricValue(
  metric: BookMetric,
  values: Record<string, number>,
  units: BookUnits,
  locale: string,
): { value: string; unit: string } {
  const raw = values[metric] ?? 0
  const n = (v: number, digits = 0) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v)

  if (metric === 'distance' || metric === 'furthest') {
    // Stored in metres and converted here, so switching units never rounds a
    // second time on top of a rounded number.
    const km = raw / 1000
    const shown = units === 'imperial' ? km * 0.621371 : km
    return { value: n(shown, shown < 100 ? 1 : 0), unit: units === 'imperial' ? 'mi' : 'km' }
  }
  return { value: n(raw), unit: '' }
}

/**
 * The trip summary — the page Polarsteps' books open on, and the one that makes
 * a book feel like a record of a journey rather than a folder of pictures.
 *
 * The figure is the loud part and the label is quiet underneath it. That order
 * is the whole design: you read "12,482" and then find out it is kilometres,
 * not the other way round.
 */
function StatsView({ el, frameStyle }: { el: BookStatsElement; frameStyle: CSSProperties }) {
  const { t, locale } = useTranslation()
  const items = el.metrics

  /*
   * How the figures divide up.
   *
   * `grid` aims for a shape rather than a fixed column count: three figures go
   * in a row, four make a square, six make two rows of three. Fixing it at two
   * or three columns left three figures as a row of two and a lonely third,
   * which is the arrangement you would never choose by hand.
   */
  const cols = el.layout === 'column' ? 1
    : el.layout === 'row' ? items.length
    : items.length <= 3 ? items.length
      : items.length === 4 ? 2
        : items.length <= 6 ? 3
          : 4
  const rows = Math.ceil(items.length / Math.max(1, cols))

  /*
   * Everything is sized from the **cell**, not from the element.
   *
   * A figure has to fit the space it is given, and that space is the element
   * divided by the arrangement. Sizing from the element's own height meant a
   * summary spread across a whole spread set its numbers from the height of the
   * strip rather than from the room each one actually had — six figures and two
   * figures came out identical, and both came out small.
   */
  const cell = Math.min(el.frame.w / Math.max(1, cols), el.frame.h / Math.max(1, rows))
  const figure = Math.max(2, cell * 0.34 * el.textScale)
  const caption = Math.max(1.2, cell * 0.088 * el.textScale)
  const icon = Math.max(1.5, cell * 0.17)
  const gap = cell * 0.13

  return (
    <div
      style={{
        ...frameStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(1, cols)}, 1fr)`,
        /*
         * Rows need more air than columns, and one `gap` cannot give it to
         * them. Side by side, two figures are separated by their own white
         * space; stacked, the caption of one row ends a millimetre above the
         * icon of the next, and the two read as a single crowded block. The
         * row gap is the floor, and `space-evenly` hands out whatever height is
         * left over — so a tall panel breathes and a short one still never
         * collides.
         */
        columnGap: `${round2(gap)}mm`,
        rowGap: `${round2(gap * 1.35)}mm`,
        alignContent: 'space-evenly',
        justifyItems: 'center',
        fontFamily: fontStack(el.font),
        color: el.color,
      }}
    >
      {items.map(metric => {
        const { value, unit } = metricValue(metric, el.values, el.units, locale)
        const label = t(`journey.studio.metric.${metric}`)
        return (
          <div
            key={metric}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            {el.showIcons && (() => {
              const Icon = METRIC_ICONS[metric]
              return (
                <Icon
                  color={rgba(el.color, 0.38)}
                  strokeWidth={1.6}
                  style={{
                    // Millimetres, overriding the pixel size lucide writes.
                    width: `${round2(icon)}mm`,
                    height: `${round2(icon)}mm`,
                    display: 'block',
                    marginBottom: `${round2(gap * 0.34)}mm`,
                  }}
                />
              )
            })()}
            <span
              style={{
                fontSize: `${round2(figure)}mm`,
                fontWeight: heavy(el),
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: el.accent,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
              {/* The unit rides with the number at a fraction of its size —
                  "1,189 km", not "1,189" over "DISTANCE · KM". A unit belongs to
                  the quantity, and pushing it into the label made the label the
                  place you had to look to know what you were reading. */}
              {unit && (
                <span style={{ fontSize: '0.44em', fontWeight: light(el), letterSpacing: '0.02em', marginLeft: '0.14em' }}>
                  {unit}
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: `${round2(caption)}mm`,
                fontWeight: light(el),
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                lineHeight: 1.4,
                marginTop: `${round2(gap * 0.3)}mm`,
                opacity: 0.55,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Countries ────────────────────────────────────────────────────────── */

/**
 * The country page.
 *
 * A name set in caps over its own silhouette. The outline is what makes it
 * work — a list of country names is a list; the same list with each country's
 * shape behind it reads as a map of where you went.
 *
 * The silhouette sits *behind* the name at low opacity rather than beside it.
 * Beside it, twenty countries become a column of postage stamps and the shapes
 * stop being legible at all; behind it, each name carries its own territory.
 */
function CountriesView({ el, frameStyle }: { el: BookCountriesElement; frameStyle: CSSProperties }) {
  const codes = el.codes
  const cols = el.layout === 'grid' ? Math.min(3, Math.max(1, Math.round(Math.sqrt(codes.length)))) : 1
  const rows = Math.ceil(codes.length / cols)
  const cell = el.frame.h / Math.max(1, rows)
  // Set from the row, capped by the width so a long name in a narrow element
  // still fits: a country list is a stack of lines, and what a line has to fit
  // into is its own row rather than the height of the whole stack.
  const name = Math.max(1.2, Math.min(cell * 0.44, el.frame.w * 0.16) * el.textScale)
  const justify = el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center'

  return (
    <div
      style={{
        ...frameStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        alignContent: 'center',
        fontFamily: fontStack(el.font),
        color: el.color,
      }}
    >
      {codes.map((code, i) => {
        const shape = COUNTRY_SHAPES[code.toUpperCase()]
        const label = el.names[i] || code.toUpperCase()
        // The outline is drawn as tall as the row allows and centred behind the
        // words, keeping its own proportions.
        const boxH = cell * 0.86
        const boxW = shape ? (boxH * shape.w) / shape.h : boxH
        return (
          <div
            key={`${code}-${i}`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: justify,
              height: `${cell}mm`,
              minWidth: 0,
            }}
          >
            {el.showOutline && shape && (
              <svg
                width={`${boxW}mm`}
                height={`${boxH}mm`}
                viewBox={`0 0 ${shape.w} ${shape.h}`}
                style={{
                  position: 'absolute',
                  left: el.align === 'left' ? 0 : el.align === 'right' ? 'auto' : '50%',
                  right: el.align === 'right' ? 0 : 'auto',
                  transform: el.align === 'center' ? 'translateX(-50%)' : undefined,
                  opacity: 0.2,
                }}
              >
                <path d={shape.d} fill={el.accent} />
              </svg>
            )}
            <span
              style={{
                position: 'relative',
                fontSize: `${name}mm`,
                fontWeight: heavy(el),
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                display: 'flex',
                alignItems: 'center',
                gap: `${name * 0.4}mm`,
                whiteSpace: 'nowrap',
              }}
            >
              {el.showFlag && <FlagMark code={code} size={name * 0.9} />}
              {el.showName && label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * A flag, drawn.
 *
 * The first version set a regional-indicator pair and let the platform draw it.
 * That is the standard trick and it is wrong for most of the people who will
 * use this: Chrome on Windows ships no flag glyphs, so it renders the two
 * letters, and "DE" printed in a photo book is not a flag.
 *
 * So flags are constructed from `flags.ts` — exact for the stripe, cross and
 * disc constructions listed there, and absent for anything with an emblem
 * rather than approximated. A country with no construction falls back to its
 * silhouette, which is correct for all 198 of them.
 */
function FlagMark({ code, size }: { code: string; size: number }) {
  const spec = flagSpec(code)
  const height = size
  const width = (height * FLAG_W) / FLAG_H

  if (spec) {
    const disc = flagDisc(spec)
    return (
      <svg
        width={`${round2(width)}mm`}
        height={`${round2(height)}mm`}
        viewBox={`0 0 ${FLAG_W} ${FLAG_H}`}
        style={{ display: 'block', flex: '0 0 auto', borderRadius: `${round2(height * 0.08)}mm` }}
        aria-label={code.toUpperCase()}
      >
        {flagBands(spec).map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} />
        ))}
        {disc && <circle cx={disc.cx} cy={disc.cy} r={disc.r} fill={disc.fill} />}
        {/* A hairline keeps a white-edged flag off a white page. */}
        <rect x="0" y="0" width={FLAG_W} height={FLAG_H} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="0.5" />
      </svg>
    )
  }

  const shape = COUNTRY_SHAPES[code.toUpperCase()]
  if (!shape) {
    // Neither a construction nor an outline: the code, set as a mark rather
    // than as two stray capitals.
    return (
      <span
        style={{
          fontSize: `${round2(size * 0.62)}mm`,
          fontWeight: 700,
          letterSpacing: '0.08em',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        {code.toUpperCase()}
      </span>
    )
  }
  return (
    <svg
      width={`${round2((height * shape.w) / shape.h)}mm`}
      height={`${round2(height)}mm`}
      viewBox={`0 0 ${shape.w} ${shape.h}`}
      style={{ display: 'block', flex: '0 0 auto' }}
      aria-label={code.toUpperCase()}
    >
      <path d={shape.d} fill="currentColor" />
    </svg>
  )
}

/* ── Badges ───────────────────────────────────────────────────────────── */

/**
 * The small marks — a date set as a numeral, a day counter, a line of
 * coordinates, a country with its outline.
 *
 * Individually trivial and collectively most of what separates a printed travel
 * page from a typed one. Each is one figure and one line under it, which is why
 * they share a component rather than having four.
 */
function BadgeView({ el, frameStyle }: { el: BookBadgeElement; frameStyle: CSSProperties }) {
  /*
   * A mark should fill the box it was given.
   *
   * These are the smallest things on the page and the first version set them
   * from a fraction of the frame that left most of it empty — a flag and a
   * country name occupying a third of their own selection rectangle. The type
   * is bigger now, and the padding below is measured from the frame rather than
   * from the type, so a chip hugs its words instead of floating in a capsule.
   */
  const big = typeSize(el, el.variant === 'date' ? 0.52 : 0.42)
  const small = typeSize(el, 0.2)
  const shape = el.code ? COUNTRY_SHAPES[el.code.toUpperCase()] : null
  const stacked = el.style === 'stacked' || el.variant === 'date'

  const chip = el.style === 'chip'
  const outline = el.style === 'outline'

  /*
   * What the mark shows, and what colour its picture is.
   *
   * Read as `!== false` rather than as a truth test: a badge dropped from a
   * panel is built by hand and cast, so it never passes through the contract's
   * defaults until the book has been saved and read back. An absent flag has to
   * mean what it meant before the flag existed.
   */
  const showIcon = el.showIcon !== false
  const showLabel = el.showLabel !== false
  const iconTint = (automatic: string) => (el.autoIconColor === false ? el.iconColor : automatic)
  /*
   * A mark with no words is a pictogram, and a pictogram should fill its box.
   * Beside a label the icon is a share of the height; on its own it takes four
   * fifths of whichever side is shorter, so a wide mark grows into the space
   * the words left and a narrow one stays inside its own edges rather than
   * bleeding over them.
   */
  const iconScale = showLabel ? 0.46 : Math.min(el.frame.w, el.frame.h) / el.frame.h * 0.8

  return (
    <div
      style={{
        ...frameStyle,
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${round2(stacked ? small * 0.5 : small * 0.75)}mm`,
        fontFamily: fontStack(el.font),
        color: badgeInk(el),
        background: chip ? el.accent : undefined,
        border: outline ? `${round2(Math.max(0.18, el.frame.h * 0.022))}mm solid ${rgba(el.color, 0.4)}` : undefined,
        borderRadius: chip || outline ? `${round2(Math.min(el.frame.w, el.frame.h) * 0.5)}mm` : undefined,
        boxSizing: 'border-box',
        // A share of the frame, and vertical as well as horizontal: an outline
        // that touched its own words read as a box drawn round them by accident.
        padding: chip || outline
          ? `${round2(el.frame.h * 0.16)}mm ${round2(el.frame.h * 0.34)}mm`
          : undefined,
        overflow: 'hidden',
      }}
    >
      {el.variant === 'flag' && el.code && showIcon && (
        <FlagMark code={el.code} size={el.frame.h * (showLabel ? 0.5 : iconScale)} />
      )}

      {/*
        Mood and weather come from the journal entry, and they are drawn with
        the *same* icon and the same palette the journey page uses — imported
        rather than re-listed, so a mood added to TREK appears here without
        anyone remembering to add it twice.
      */}
      {(el.variant === 'mood' || el.variant === 'weather') && el.code && showIcon && (() => {
        // Kept apart rather than narrowed out of one union: only a mood has a
        // colour of its own, and `'text' in config` types it as unknown.
        const mood = el.variant === 'mood' ? MOOD_CONFIG[el.code] : null
        const config = mood ?? WEATHER_CONFIG[el.code]
        if (!config) return null
        const Icon = config.icon
        const size = el.frame.h * iconScale
        /*
         * Automatic is the journal's own palette for a mood and the element's
         * accent for the weather. Note the colour has to be passed rather than
         * inherited: lucide writes it onto the SVG's stroke, so `currentColor`
         * from the wrapper never reaches it — which is why the Colour swatch
         * appeared to do nothing to a mood icon.
         */
        const tint = iconTint(mood ? mood.text : el.accent)
        return (
          <Icon
            color={tint}
            strokeWidth={1.7}
            style={{ width: `${round2(size)}mm`, height: `${round2(size)}mm`, display: 'block', flex: '0 0 auto' }}
          />
        )
      })()}

      {el.variant === 'country' && shape && showIcon && (() => {
        const h = el.frame.h * (showLabel ? 0.72 : iconScale)
        return (
          <svg
            width={`${round2((h * shape.w) / shape.h)}mm`}
            height={`${round2(h)}mm`}
            viewBox={`0 0 ${shape.w} ${shape.h}`}
            style={{ display: 'block', flex: '0 0 auto' }}
          >
            <path d={shape.d} fill={iconTint(el.accent)} />
          </svg>
        )
      })()}

      {el.text && showLabel && (
        <span
          style={{
            fontSize: `${round2(el.variant === 'coords' ? small * 1.3 : big)}mm`,
            fontWeight: heavy(el),
            lineHeight: 1,
            letterSpacing: el.variant === 'coords' ? '0.1em' : '-0.015em',
            fontVariantNumeric: 'tabular-nums',
            color: badgeInk(el),
            whiteSpace: 'nowrap',
          }}
        >
          {el.text}
        </span>
      )}

      {el.sub && showLabel && (
        <span
          style={{
            fontSize: `${small}mm`,
            fontWeight: light(el),
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
            opacity: chip ? 0.9 : 0.6,
            whiteSpace: 'nowrap',
          }}
        >
          {el.sub}
        </span>
      )}
    </div>
  )
}

/* ── List ─────────────────────────────────────────────────────────────── */

/**
 * Two marked columns: what was good, and what was not.
 *
 * TREK's journal entries already keep these as two lists, and two lists is the
 * thing a paragraph cannot hold. Run together the pairing is lost; run as one
 * column, which side each line belongs to is lost. Printed side by side with a
 * mark against each line, a reader takes it in without reading a word of it —
 * which is the whole reason travel diaries have set them this way for two
 * hundred years.
 */
function ListView({ el, frameStyle }: { el: BookListElement; frameStyle: CSSProperties }) {
  const columns = el.layout === 'columns'
  const pros = el.items.filter(i => i.tone === 'pro')
  const cons = el.items.filter(i => i.tone === 'con')
  const plain = el.items.filter(i => i.tone === 'plain')

  // Sized off the tallest column, so two columns of different lengths still set
  // their lines at one size rather than at two.
  const rows = columns ? Math.max(pros.length, cons.length, 1) : Math.max(el.items.length, 1)

  /*
   * The line height that makes the block fill the frame.
   *
   * Everything below is a multiple of `line` — the heading at 0.78, the leading
   * at 1.35, the gaps at 0.62 — so the block's total height is a fixed multiple
   * of it, and dividing the frame by that multiple is the size that fits. The
   * first version capped the line at a tenth of the frame instead, which on a
   * four-item list set 3mm type in a 32mm box and left two thirds of it empty.
   *
   * The cap that remains is an absolute one: past about 6mm a two-word entry
   * stops being a list and starts being a headline.
   */
  const wanted = el.frame.h / (0.86 + 1.7 * rows)
  const line = Math.max(1.6, Math.min(wanted, 6) * el.textScale)
  const gap = line * 0.62
  const heading = line * 0.78

  const column = (items: typeof el.items, label: string, tone: 'pro' | 'con') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${round2(gap * 0.55)}mm`, minWidth: 0, flex: 1 }}>
      {label && (
        <span
          style={{
            fontSize: `${round2(heading)}mm`,
            fontWeight: heavy(el),
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
            marginBottom: `${round2(gap * 0.3)}mm`,
            color: tone === 'pro' ? el.accent : rgba(el.color, 0.55),
          }}
        >
          {label}
        </span>
      )}
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: `${round2(gap * 0.5)}mm`, alignItems: 'baseline' }}>
          {el.showMarks && (
            <span
              style={{
                fontSize: `${round2(line)}mm`,
                fontWeight: heavy(el),
                lineHeight: 1.35,
                flex: '0 0 auto',
                color: tone === 'pro' ? el.accent : rgba(el.color, 0.4),
              }}
            >
              {/* A rule and a plus: the minus is an en dash rather than a hyphen,
                  which at this size is the difference between a mark and a speck. */}
              {tone === 'pro' ? '+' : '\u2013'}
            </span>
          )}
          <span style={{ fontSize: `${round2(line)}mm`, lineHeight: 1.35, minWidth: 0 }}>{item.text}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div
      style={{
        ...frameStyle,
        display: 'flex',
        flexDirection: columns ? 'row' : 'column',
        gap: `${round2(gap * 1.4)}mm`,
        // Columns start at the top together; a stacked list centres, since it
        // has no second column to line up with.
        alignItems: 'flex-start',
        justifyContent: columns ? 'flex-start' : 'center',
        fontFamily: fontStack(el.font),
        color: el.color,
        overflow: 'hidden',
      }}
    >
      {columns ? (
        <>
          {(pros.length > 0 || el.proLabel) && column(pros, el.proLabel, 'pro')}
          {(cons.length > 0 || el.conLabel) && column(cons, el.conLabel, 'con')}
        </>
      ) : (
        column([...pros, ...cons, ...plain], '', 'pro')
      )}
    </div>
  )
}
