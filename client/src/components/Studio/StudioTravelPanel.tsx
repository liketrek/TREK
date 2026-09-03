import { useEffect, useRef, useState } from 'react'
import { Check, RouteOff } from 'lucide-react'
import type { BookElement, BookMetric, BookPageSetup, JourneyStats } from '@trek/shared'
import { BOOK_METRICS } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { PanelHead } from './StudioPanelHead'
import { Section } from './StudioControls'
import { TravelPreview } from './TravelPreview'
import { formatBookCoords } from './entryText'
import { routeFor } from './travelRefresh'
import { useMapSources } from './mapSources'
import { fetchRoads } from './roadRoute'

/**
 * The journey's own figures, as things you can put on a page.
 *
 * This is the panel that makes Studio a *travel* book designer rather than a
 * layout tool that happens to be full of holiday photographs. The route, the
 * distance, the countries and the dates are already in TREK; the work is
 * offering them as objects rather than as numbers someone has to retype.
 *
 * ── Why every tile is a real preview ──────────────────────────────────────
 *
 * These elements differ from one another by what they *say*, not by their
 * shape. Four map styles are four maps; three summary layouts are the same six
 * numbers arranged three ways. A named row with the value beside it — which is
 * what this panel was first — tells you none of that: you cannot tell the dark
 * map from the paper one, or a row of figures from a grid of them, until you
 * have placed one and undone it.
 *
 * So each tile builds the element it would place and renders it through the
 * page's own renderer, with this journey's real numbers in it. You are picking
 * from the things themselves.
 *
 * Every button resolves its values *now* and writes them into the element, so
 * what lands on the page is finished rather than a placeholder that needs the
 * server to mean anything. The reasoning is in TravelElements.tsx, and the
 * short version is that the print renderer must never depend on a fetch.
 */

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

/**
 * One row of the stops list: a point of the route or a stop switched off.
 *
 * `entryId` is null for a stop the server took straight from a trip's places,
 * which is what a journey has before anyone wrote an entry. Such a stop has no
 * switch, because there is no entry to put it on.
 */
type StopRow = {
  entryId: number | null
  label: string
  date: string | null
  country: string | null
  excluded: boolean
}

/*
 * How many cards share a row.
 *
 * A stats panel is the width of a spread; shown two-up its figures scale down
 * past reading, so it gets the row to itself. Maps, country lists and marks are
 * compact enough that two-up still tells them apart, and two-up is what makes
 * the section scannable. The tile measures its own width — see TravelPreview.
 */

/** Kilometres, grouped for the reader's locale. */
function formatDistance(metres: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(metres / 1000)} km`
}

function Card({ label, onClick, children, recommended = false, title }: {
  label: string
  onClick: () => void
  /**
   * Marked as the one to reach for, with a ring rather than with words.
   *
   * The label sits in a grid cell about eighty pixels wide, where "Satellite ·
   * recommended" is two lines of ellipsis. A ring says the same thing in no
   * space at all, and the tooltip carries the word for anyone who wonders why
   * this card looks different.
   */
  recommended?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button type="button"
      className={`st-travel-card ${recommended ? 'is-recommended' : ''}`}
      onClick={onClick}
      title={title ? `${label} — ${title}` : label}
    >
      {children}
      <span className="st-travel-card-label">{label}</span>
    </button>
  )
}

export function StudioTravelPanel({
  page, stats, path, t, locale, canEdit, onToggleStop,
}: {
  page: BookPageSetup
  stats: JourneyStats | null
  /** The travelled way, already thinned. Empty when the trip has no geometry. */
  path: [number, number][][]
  t: (k: string) => string
  locale: string
  /** False for a viewer: the stops are still listed, none of them can be switched. */
  canEdit: boolean
  /** Switch one stop on or off in the figures. Resolves false when it did not land. */
  onToggleStop: (entryId: number, excluded: boolean) => Promise<boolean>
}) {
  const addElement = useStudioStore(s => s.addElement)
  const updateElement = useStudioStore(s => s.updateElement)
  const active = useStudioStore(s => s.activeSpread)
  const doc = useStudioStore(s => s.doc)
  const spread = doc?.spreads[active]
  const single = !!spread && spread.role !== 'inner'

  /*
   * The road lookups still running when the panel goes away.
   *
   * fetchRoads walks the legs at a deliberate pace, so a twenty-stop map keeps
   * asking a public router for minutes after Studio is closed, and the answer
   * lands in whatever document the store holds by then.
   */
  const roadJobs = useRef(new Set<AbortController>())
  useEffect(() => () => {
    roadJobs.current.forEach(c => c.abort())
    roadJobs.current.clear()
  }, [])

  /*
   * The stops whose switch is on its way to the server.
   *
   * No optimistic flip: which stop is furthest and which countries remain is
   * the server's sum, so the row reads its state from the stats the hook
   * fetches once the change has landed. Until then the chip is only held,
   * so a second click cannot send the opposite of what the first one is
   * still delivering.
   */
  const [pending, setPending] = useState<Set<number>>(() => new Set())

  const centre = (w: number, h: number) => {
    const W = single ? page.pageWidth : page.pageWidth * 2
    return { x: (W - w) / 2, y: (page.pageHeight - h) / 2, w, h }
  }

  const mapSide = Math.min(page.pageWidth, page.pageHeight) * 0.72

  /*
   * The imagery this instance can reach, so the relief card below places a map
   * that already has its template and its credit rather than an empty one the
   * user then has to point at a source.
   *
   * Asked for above the empty-state return, and not beside the card that reads
   * it: a journey whose figures are still loading renders this panel once with
   * no stats at all, and a hook that only runs on the second render is a hook
   * count that changes between them.
   */
  const sources = useMapSources(
    { x: 0, y: 0, w: mapSide, h: mapSide * 0.78 },
    (stats?.points ?? []).map(p => ({ lat: p.lat, lng: p.lng })),
  )

  if (!stats) {
    return (
      <>
        <PanelHead label={t('journey.studio.travel')} />
        <div className="st-panel-scroll">
          <p className="st-hint">{t('journey.studio.travelEmpty')}</p>
        </div>
      </>
    )
  }

  const base = {
    rotation: 0, opacity: 1, locked: false,
    font: 'sans' as const, color: '#1a1a1a', accent: '#111111', textScale: 1, weight: 700 as const,
    stale: false,
  }

  /**
   * Country names in the reader's language, not the server's.
   *
   * The API answers in English, because it has no idea who will read the book.
   * `Intl.DisplayNames` is the same CLDR data Atlas already uses for regions, so
   * a German book says "Island" and an English one says "Iceland" — from one set
   * of codes, with no translation table to keep in step.
   */
  const countryName = (code: string): string => {
    try {
      const display = new Intl.DisplayNames([locale], { type: 'region' })
      return display.of(code.toUpperCase()) || code.toUpperCase()
    } catch {
      return stats.countries.find(c => c.code === code)?.name || code.toUpperCase()
    }
  }

  const values: Record<string, number> = {
    distance: stats.distance,
    days: stats.days,
    steps: stats.steps,
    photos: stats.photos,
    countries: stats.countries.length,
    places: stats.places,
    furthest: stats.furthest,
  }

  /*
   * Each builder returns the finished element. The tile renders it and the
   * click places it, so the preview and the result are the same object — there
   * is no second description of what a card means.
   */
  /** The linked trips that actually put stops on the route. */
  const tripsWithRoute = (stats.trips ?? []).filter(t => t.points > 0)

  /*
   * The route as rows, counting and left-out stops together.
   *
   * Every point is listed, so the list reads as the route. The left-out
   * stops sit among the counting ones in date order rather than in a list of
   * their own, because the question the section answers is "which of these
   * count?", and that is only answerable with all of them in one sequence.
   * Undated stops go last, then by name.
   */
  const stops: StopRow[] = [
    ...stats.points.map(p => ({
      entryId: p.entryId, label: p.label, date: p.date, country: p.country, excluded: false,
    })),
    ...(stats.excluded ?? []).map(x => ({
      entryId: x.entryId, label: x.label, date: x.date, country: null, excluded: true,
    })),
  ].sort((a, b) => {
    if (a.date !== b.date) {
      if (a.date == null) return 1
      if (b.date == null) return -1
      return a.date < b.date ? -1 : 1
    }
    return a.label.localeCompare(b.label)
  })
  const excludedCount = stops.filter(s => s.excluded).length
  /** Whether the country is worth a badge, or the same word on every row. */
  const manyCountries = stats.countries.length > 1

  /**
   * The day of a stop, without the weekday.
   *
   * `formatDate` is the journal's format and carries "Tue," because a journal
   * entry is about a day somebody lived. A row here is about a leg of a route,
   * and it has 236px to hold a place name in as well: the weekday costs a
   * third of the badge and answers nothing anybody asks of this list.
   */
  const stopDay = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })

  const toggleStop = async (entryId: number, excluded: boolean) => {
    setPending(prev => new Set(prev).add(entryId))
    // A refusal is the hook's to report; here it only frees the chip again.
    await onToggleStop(entryId, excluded)
    setPending(prev => {
      const next = new Set(prev)
      next.delete(entryId)
      return next
    })
  }

  /* Satellite first: the recommendation should not be the second thing read. */
  const imagery = sources
    .filter(s => s.id === 'relief' || s.id === 'satellite')
    .sort((a, b) => (a.id === 'satellite' ? -1 : b.id === 'satellite' ? 1 : 0))

  /**
   * One country, as the entry a list would have made of it.
   *
   * The list and the grid are gone: they were compositions somebody else made,
   * deciding the order, the spacing and the type size, and the only way to
   * change any of that was to not use them. What is left is the same entry —
   * name over silhouette, set the same way — as an element you place one at a
   * time. Three of them down a page is the list, with the spacing yours; one of
   * them at 80mm is a chapter opener, which the list could never be.
   *
   * The name is editable afterwards, so numbering them "1. Germany",
   * "2. Netherlands" is typing rather than a feature.
   */
  const countryEl = (code: string): BookElement => ({
    ...base, id: uid('co'), kind: 'countries',
    frame: centre(page.pageWidth * 0.34, 34),
    codes: [code], names: [countryName(code)],
    layout: 'list', showOutline: true, showFlag: false, showName: true, align: 'center',
  } as BookElement)

  const mapEl = (
    style: 'minimal' | 'outline' | 'dark' | 'paper',
    source: 'vector' | 'tiles' | 'static' = 'vector',
    url = '',
    attribution = '',
    clip: 'rect' | 'country' = 'rect',
    /** Null is the whole journey; a trip id is a map of that trip alone. */
    tripId: number | null = null,
  ): BookElement => {
    const route = routeFor(stats, tripId)
    return {
    ...base, id: uid('mp'), kind: 'map',
    frame: centre(mapSide, mapSide * 0.78),
    style, source, tileUrl: url, attribution, zoom: null, clip, tripId,
    /*
     * White over a photograph, ink on paper. The accent IS the line, so this is
     * how a satellite map arrives drawn the way the reference draws it, while
     * the colour stays something the user can change afterwards.
     */
    accent: source === 'tiles' || source === 'static' ? '#ffffff' : base.accent,
    showLand: true, showRoute: true, showPins: true, showLabels: false,
    /*
     * A map placed today gets the drawn treatment; the contract defaults to the
     * plain line so that every book made before this existed opens unchanged.
     * Set explicitly rather than inherited because this object is cast, not
     * parsed.
     */
    routeStyle: 'drawn', routeArc: 'bow', routeDash: 'arcs', pinStyle: 'photo',
    countries: tripId == null
      ? stats.countries.map(c => c.code)
      : [...new Set(route.map(p => p.country).filter((c): c is string => !!c))],
    points: route.map(p => ({ lat: p.lat, lng: p.lng, label: p.label, photoId: p.photoId ?? null })),
    /*
     * Frozen into the element, like every other travel figure: a page that
     * fetches its own route at print time is a page that changes when someone
     * edits the trip, and prints empty when the export runs signed out.
     */
    path,
    // Empty until somebody asks for the roads; see roadRoute.ts.
    roads: [],
    fitPadding: 0.5,
    fitToCountries: true,
    } as BookElement
  }

  /*
   * A mark is placed at the size that suits what it holds.
   *
   * One size for all six put a flag and a country name into a box built for a
   * line of coordinates, which is how a small mark ends up floating inside a
   * large selection rectangle. Fractions of the page, so the proportions hold
   * on any format.
   */
  const MARK_SIZE: Record<string, [number, number]> = {
    flag: [0.25, 0.062],
    date: [0.16, 0.14],
    day: [0.17, 0.062],
    coords: [0.36, 0.05],
    country: [0.22, 0.078],
    distance: [0.26, 0.066],
  }

  const badgeEl = (
    variant: 'flag' | 'date' | 'day' | 'coords' | 'country' | 'distance',
    text: string,
    sub: string,
    code: string | null,
    style: 'plain' | 'chip' | 'outline' | 'stacked' = 'plain',
  ): BookElement => {
    const [fw, fh] = MARK_SIZE[variant] ?? [0.24, 0.08]
    return {
      ...base, id: uid('bd'), kind: 'badge', autoColor: true,
      showIcon: true, showLabel: true, autoIconColor: true, iconColor: '#111111',
      frame: centre(page.pageWidth * fw, page.pageHeight * fh),
      variant, text, sub, code, style,
    } as BookElement
  }

  /**
   * One figure on its own.
   *
   * A summary panel is a composition; a single figure is a mark you drop next
   * to a photograph. Both are the same element with a different metric list,
   * and offering only the composition meant anyone wanting "14 DAYS" beside a
   * picture had to place all four and delete three.
   */
  const singleEl = (metric: BookMetric): BookElement => ({
    ...base, id: uid('st'), kind: 'stats',
    frame: centre(page.pageWidth * 0.22, page.pageHeight * 0.13),
    metrics: [metric], layout: 'grid', showIcons: true, units: 'metric', values,
  } as BookElement)

  /** Place a copy — the previewed element keeps its own id for React. */
  const place = (el: BookElement) => {
    const placed = { ...el, id: uid(el.kind[0]) } as BookElement
    addElement(active, placed)

    /*
     * A map arrives following the roads.
     *
     * Asked for after the element is on the page rather than before, so the map
     * appears at once and the line firms up a moment later: a panel that sat
     * there for fifteen seconds after a click would read as broken, and the
     * straight line it starts with is the one it would have had anyway.
     *
     * Legs long enough to have been flights are never sent (see roadRoute.ts),
     * the router's own cache answers a second placement of the same journey for
     * free, and a failure leaves the leg exactly as it was.
     */
    if (placed.kind === 'map' && placed.points.length > 1) {
      const job = new AbortController()
      roadJobs.current.add(job)
      void fetchRoads(placed.points.map(pt => ({ lat: pt.lat, lng: pt.lng })), { signal: job.signal })
        .then(roads => {
          if (job.signal.aborted) return
          if (roads.some(r => r && r.length > 1)) {
            updateElement(active, placed.id, { roads } as Partial<BookElement>)
          }
        })
        .catch(() => { /* No roads is a state the map already draws. */ })
        .finally(() => { roadJobs.current.delete(job) })
    }
  }

  const first = stats.points[0] ?? null
  const firstCountry = stats.countries[0] ?? null
  const startDay = stats.start ? new Date(`${stats.start}T00:00:00`) : null

  const marks: { el: BookElement; label: string }[] = []
  if (startDay) {
    marks.push({
      el: badgeEl('date', String(startDay.getDate()),
        startDay.toLocaleDateString(locale, { month: 'long' }).toUpperCase(), null, 'stacked'),
      label: t('journey.studio.dateMark'),
    })
  }
  marks.push({
    el: badgeEl('day', `${t('journey.studio.dayWord')} 1`, '', null, 'chip'),
    label: t('journey.studio.dayMark'),
  })
  if (first) {
    marks.push({
      el: badgeEl('coords', formatBookCoords(first.lat, first.lng), first.label, null),
      label: t('journey.studio.coordsMark'),
    })
  }
  if (firstCountry) {
    marks.push({
      el: badgeEl('flag', '', countryName(firstCountry.code), firstCountry.code),
      label: t('journey.studio.flagMark'),
    })
  }
  marks.push({
    el: badgeEl('distance', formatDistance(stats.distance, locale), t('journey.studio.metric.distance'), null, 'outline'),
    label: t('journey.studio.distanceMark'),
  })

  return (
    <>
      <PanelHead label={t('journey.studio.travel')} />
      <div className="st-panel-scroll">
        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.singleFigures')}</div>
          <div className="st-travel-grid">
            {BOOK_METRICS.map(metric => {
              const el = singleEl(metric)
              return (
                <Card key={metric} label={t(`journey.studio.metric.${metric}`)} onClick={() => place(el)}>
                  <TravelPreview el={el} minHeight={44} maxHeight={62} />
                </Card>
              )
            })}
          </div>
        </div>

        {/*
          The switch is here, beside the maps and the figures it changes, and
          not only in the entry editor: the moment somebody notices the home
          airport on the printed route is the moment they are looking at this
          panel. The rows carry no preview because they are not things to
          place; they are the input every tile below reads.
        */}
        {stops.length > 0 && (
          <Section
            label={t('journey.studio.stops')}
            hint={t('journey.studio.stopsHint')}
            /*
             * Folded to begin with, and saying how many count while it is.
             *
             * A fortnight is fourteen rows, which is longer than everything
             * else in this panel put together, and most books never need to
             * touch it. The figure in the head is what anyone opening it came
             * to check anyway, so the closed section still answers the
             * question and the maps below stay in reach.
             */
            defaultOpen={false}
            badge={`${stops.length - excludedCount}/${stops.length}`}
          >
            <ul className="st-stops">
              {stops.map((stop, i) => {
                const entryId = stop.entryId
                const on = !stop.excluded
                const state = t(on ? 'journey.studio.stopOn' : 'journey.studio.stopOff')
                const chip = `st-chip is-pick is-icon ${on ? 'is-on' : ''}`
                /*
                 * A mark rather than the word.
                 *
                 * "Counts" and "Left out" are different lengths, so a column of
                 * them jitters, and together they cost a third of a row that
                 * has a place name to fit. The tick and the crossed-out route
                 * say the same thing at a glance, and the word is still there
                 * for anyone who hovers or reads with a screen reader.
                 */
                const mark = on ? <Check size={13} strokeWidth={2.4} /> : <RouteOff size={13} strokeWidth={2.2} />
                return (
                  <li key={entryId ?? `place-${i}`} className={`st-stop ${on ? '' : 'is-off'}`}>
                    {/*
                      One line: the day, then the name, then the switch. The
                      name and the day were stacked, which doubled the height
                      of a list whose whole job is being read down.
                    */}
                    {stop.date && <span className="st-badge">{stopDay(stop.date)}</span>}
                    <span className="st-stop-label">{stop.label || t('journey.studio.untitled')}</span>
                    {/*
                      The country only where there is more than one to tell
                      apart. On a journey inside one country it is the same
                      word fourteen times, in the row that has least room.
                    */}
                    {manyCountries && stop.country && (
                      <span className="st-badge is-quiet">{countryName(stop.country)}</span>
                    )}
                    {canEdit && entryId != null ? (
                      <button type="button"
                        className={chip}
                        title={`${state}: ${t('journey.studio.stopToggle')}`}
                        aria-label={t('journey.studio.stopToggle')}
                        aria-pressed={on}
                        disabled={pending.has(entryId)}
                        onClick={() => void toggleStop(entryId, !stop.excluded)}
                      >
                        {mark}
                      </button>
                    ) : (
                      <span className={chip} title={state} aria-label={state}>{mark}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Section>
        )}

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.routeMap')}</div>
          {stats.points.length ? (
            <>
              <div className="st-travel-grid">
                {(['minimal', 'outline', 'paper', 'dark'] as const).map(style => {
                  const el = mapEl(style)
                  return (
                    <Card key={style} label={t(`journey.studio.mapStyle.${style}`)} onClick={() => place(el)}>
                      <TravelPreview el={el} minHeight={62} maxHeight={80} />
                    </Card>
                  )
                })}
                {/*
                  The two imagery maps, as cards rather than as settings.

                  They were reachable only by placing an outline map and then
                  changing its source in the inspector, which is a thing nobody
                  finds. They are different pictures, not variants of one: relief
                  is land shaded in its own colours against a dark sea, drawn at
                  a scale that suits a continent, and satellite is the ground
                  itself, which is what a page about one country wants.
                */}
                {imagery.map(src => (
                  <Card
                    key={src.id}
                    /*
                     * Satellite is marked rather than merely listed. The three
                     * imagery options are not equals: relief stops at about six
                     * hundred metres to the pixel, which is a continent's worth
                     * of detail and a smudge at country size, and the outlines
                     * are a diagram. For the page most people are making —
                     * a route across one or two countries — this is the one
                     * that prints, and saying so beats letting them find out
                     * after the book is bound.
                     */
                    label={t(src.labelKey)}
                    recommended={src.id === 'satellite'}
                    title={src.id === 'satellite' ? t('journey.studio.recommended') : undefined}
                    onClick={() => place(mapEl('minimal', 'tiles', src.url, src.attribution))}
                  >
                    <TravelPreview
                      el={mapEl('minimal', 'tiles', src.url, src.attribution)}
                      minHeight={62}
                      maxHeight={80}
                    />
                  </Card>
                ))}
              </div>

              {/*
                A map per trip, for a journey made of more than one.

                Two trips printed as a single route draw a line from the last
                stop of the first to the first stop of the second, which is
                usually the longest leg on the page and one nobody travelled.
                Offered rather than imposed: some journeys really are one route
                across several trips, and those still get the map above.

                Only trips that have stops on the route are listed — a linked
                trip nobody wrote about would place an empty frame.
              */}
              {tripsWithRoute.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <div className="st-section-label">{t('journey.studio.mapPerTrip')}</div>
                  <div className="st-travel-grid">
                    {tripsWithRoute.map(trip => {
                      const el = mapEl('minimal', 'vector', '', '', 'rect', trip.id)
                      return (
                        <Card
                          key={trip.id}
                          label={trip.title || t('journey.studio.untitled')}
                          onClick={() => place(el)}
                        >
                          <TravelPreview el={el} minHeight={62} maxHeight={80} />
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="st-hint">{t('journey.studio.noRoute')}</p>
          )}
        </div>

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.countries')}</div>
          {stats.countries.length ? (
            <>
              {/*
                One country per element, rather than a block listing them all.

                A list of countries is a composition somebody else made: it
                decides the order, the spacing and the type size, and the only
                way to change any of it is to not use it. Placed one at a time
                they are ordinary elements — numbered, moved, set at different
                sizes, put on different pages — which is what a book of a trip
                through several countries actually wants.
              */}
              <div className="st-travel-grid">
                {stats.countries.slice(0, 12).map(c => {
                  const el = countryEl(c.code)
                  return (
                    <Card key={c.code} label={countryName(c.code)} onClick={() => place(el)}>
                      <TravelPreview el={el} minHeight={44} maxHeight={64} />
                    </Card>
                  )
                })}
              </div>

              {/*
                And the same country as a mark: the outline beside the name
                rather than under it, at the size of a line of type. It belongs
                next to a date or a coordinate, not on a page of its own.
              */}
              <div className="st-travel-grid" style={{ marginTop: 6 }}>
                {stats.countries.slice(0, 12).map(c => {
                  const el = badgeEl('country', countryName(c.code), '', c.code)
                  return (
                    <Card key={`mark-${c.code}`} label={countryName(c.code)} onClick={() => place(el)}>
                      <TravelPreview el={el} minHeight={30} maxHeight={44} />
                    </Card>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="st-hint">{t('journey.studio.noCountries')}</p>
          )}
        </div>

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.marks')}</div>
          <div className="st-travel-grid">
            {marks.map(({ el, label }) => (
              <Card key={el.id} label={label} onClick={() => place(el)}>
                <TravelPreview el={el} minHeight={34} maxHeight={52} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
