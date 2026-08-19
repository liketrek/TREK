import type { BookElement, BookMetric, BookPageSetup, JourneyStats } from '@trek/shared'
import { BOOK_METRICS } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { PanelHead } from './StudioPanelHead'
import { TravelPreview } from './TravelPreview'

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

/**
 * Degrees and minutes with a hemisphere letter, the way a chart labels a
 * position. The decimal form is what a machine reads; this is for a page
 * someone is holding.
 */
function formatCoords(lat: number, lng: number): string {
  const part = (v: number, pos: string, neg: string) => {
    const deg = Math.floor(Math.abs(v))
    const min = Math.round((Math.abs(v) - deg) * 60)
    return `${deg}°${String(min).padStart(2, '0')}'${v >= 0 ? pos : neg}`
  }
  return `${part(lat, 'N', 'S')} ${part(lng, 'E', 'W')}`
}

function Card({ label, onClick, children }: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button className="st-travel-card" onClick={onClick} title={label}>
      {children}
      <span className="st-travel-card-label">{label}</span>
    </button>
  )
}

export function StudioTravelPanel({
  page, stats, t, locale,
}: {
  page: BookPageSetup
  stats: JourneyStats | null
  t: (k: string) => string
  locale: string
}) {
  const addElement = useStudioStore(s => s.addElement)
  const active = useStudioStore(s => s.activeSpread)
  const doc = useStudioStore(s => s.doc)
  const spread = doc?.spreads[active]
  const single = !!spread && spread.role !== 'inner'

  const centre = (w: number, h: number) => {
    const W = single ? page.pageWidth : page.pageWidth * 2
    return { x: (W - w) / 2, y: (page.pageHeight - h) / 2, w, h }
  }

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
    font: 'sans' as const, color: '#1a1a1a', accent: '#c2410c', textScale: 1, stale: false,
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
  const statsEl = (metrics: BookMetric[], layout: 'grid' | 'row' | 'column'): BookElement => ({
    ...base, id: uid('st'), kind: 'stats',
    frame: centre(page.pageWidth * (layout === 'column' ? 0.45 : 1.05),
      page.pageHeight * (layout === 'row' ? 0.2 : 0.34)),
    metrics, layout, showIcons: true, units: 'metric', values,
  } as BookElement)

  const mapEl = (style: 'minimal' | 'outline' | 'dark' | 'paper'): BookElement => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.72
    return {
      ...base, id: uid('mp'), kind: 'map',
      frame: centre(side, side * 0.78),
      style, showLand: true, showRoute: true, showPins: true, showLabels: false,
      countries: stats.countries.map(c => c.code),
      points: stats.points.map(p => ({ lat: p.lat, lng: p.lng, label: p.label })),
    } as BookElement
  }

  const countriesEl = (layout: 'list' | 'grid' | 'column'): BookElement => {
    const codes = stats.countries.map(c => c.code)
    const rows = layout === 'grid' ? Math.ceil(Math.max(1, codes.length) / 3) : Math.max(1, codes.length)
    return {
      ...base, id: uid('co'), kind: 'countries',
      frame: centre(page.pageWidth * 0.62, Math.min(page.pageHeight * 0.8, 22 * rows)),
      codes, names: codes.map(countryName),
      layout, showOutline: true, showFlag: false, showName: true, align: 'center',
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
      ...base, id: uid('bd'), kind: 'badge',
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
  const place = (el: BookElement) => addElement(active, { ...el, id: uid(el.kind[0]) } as BookElement)

  const first = stats.points[0] ?? null
  const firstCountry = stats.countries[0] ?? null
  const startDay = stats.start ? new Date(`${stats.start}T00:00:00`) : null

  const summaries: { el: BookElement; label: string }[] = [
    { el: statsEl(['distance', 'days', 'steps', 'photos'], 'grid'), label: t('journey.studio.tripSummary') },
    { el: statsEl(['distance', 'days', 'countries'], 'row'), label: t('journey.studio.statsRow') },
    { el: statsEl(['distance', 'days', 'steps', 'photos', 'countries', 'furthest'], 'grid'), label: t('journey.studio.statsFull') },
    { el: statsEl(['distance', 'days', 'steps'], 'column'), label: t('journey.studio.layoutColumn') },
  ]

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
      el: badgeEl('coords', formatCoords(first.lat, first.lng), first.label, null),
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
          <div className="st-section-label">{t('journey.studio.summary')}</div>
          <div className="st-travel-grid is-wide">
            {summaries.map(({ el, label }) => (
              <Card key={el.id} label={label} onClick={() => place(el)}>
                <TravelPreview el={el} minHeight={38} maxHeight={82} />
              </Card>
            ))}
          </div>
        </div>

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

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.routeMap')}</div>
          {stats.points.length ? (
            <div className="st-travel-grid">
              {(['minimal', 'outline', 'paper', 'dark'] as const).map(style => {
                const el = mapEl(style)
                return (
                  <Card key={style} label={t(`journey.studio.mapStyle.${style}`)} onClick={() => place(el)}>
                    <TravelPreview el={el} minHeight={62} maxHeight={80} />
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="st-hint">{t('journey.studio.noRoute')}</p>
          )}
        </div>

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.countries')}</div>
          {stats.countries.length ? (
            <>
              <div className="st-travel-grid">
                {([
                  ['list', 'countryList'],
                  ['grid', 'countryGrid'],
                ] as const).map(([layout, key]) => {
                  const el = countriesEl(layout)
                  return (
                    <Card key={layout} label={t(`journey.studio.${key}`)} onClick={() => place(el)}>
                      <TravelPreview el={el} minHeight={54} maxHeight={88} />
                    </Card>
                  )
                })}
              </div>
              {/* One country on its own, for a chapter opener that belongs to it. */}
              <div className="st-travel-grid" style={{ marginTop: 6 }}>
                {stats.countries.slice(0, 8).map(c => {
                  const el = badgeEl('country', countryName(c.code), '', c.code)
                  return (
                    <Card key={c.code} label={countryName(c.code)} onClick={() => place(el)}>
                      <TravelPreview el={el} minHeight={34} maxHeight={48} />
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
