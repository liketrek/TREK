import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Globe, Hash, Map as MapIcon, Stamp } from 'lucide-react'
import type { BookElement, BookPageSetup, JourneyStats } from '@trek/shared'
import { bookElementId as uid } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { PanelHead, Shelf } from './StudioPanelHead'
import { StudioTabPanel, StudioTabs } from './StudioTabs'
import { fetchRoads } from './roadRoute'
import { TravelCard } from './travel/TravelCard'
import { TravelStops } from './travel/TravelStops'
import {
  COUNTRY_LOOKS, FIGURE_SHELVES, MAP_CARDS, MARK_STYLES, MARK_VARIANTS, SUMMARY_LOOKS, travelBuilders,
} from './travel/travelBuilders'

/**
 * The journey's own figures, as things you can put on a page.
 *
 * This is the panel that makes Studio a *travel* book designer rather than a
 * layout tool that happens to be full of holiday photographs. The route, the
 * distance, the countries and the dates are already in TREK; the work is
 * offering them as objects rather than as numbers someone has to retype.
 *
 * Four tabs, the way the Elements panel sorts what it adds: the figures, the
 * maps with the stops they are drawn from, the countries, and the marks. Every
 * card is the element its click places, built by the book engine and drawn by
 * the page's own renderer with this journey's numbers in it, in the newer
 * looks and in the book's theme (travel/travelBuilders.ts). The looks books
 * had before these still draw on the pages that hold them; they are no longer
 * offered here.
 *
 * Every card resolves its values now and writes them into the element, so
 * what lands on the page is finished rather than a placeholder that needs the
 * server to mean anything: the print renderer must never depend on a fetch.
 */

type Tab = 'figures' | 'maps' | 'countries' | 'marks'

const TABS: { id: Tab; icon: typeof Hash; labelKey: string }[] = [
  { id: 'figures', icon: Hash, labelKey: 'journey.studio.travelFigures' },
  { id: 'maps', icon: MapIcon, labelKey: 'journey.studio.travelMaps' },
  { id: 'countries', icon: Globe, labelKey: 'journey.studio.countries' },
  { id: 'marks', icon: Stamp, labelKey: 'journey.studio.marks' },
]

/*
 * The two imagery maps, satellite first: the recommendation should not be the
 * second thing read. Relief stops at about six hundred metres to the pixel, a
 * smudge at country size; satellite is the one that prints for the page most
 * people make, and the ring says so.
 */
const IMAGERY = [
  { id: 'satellite', labelKey: 'journey.studio.mapSourceSatellite' },
  { id: 'relief', labelKey: 'journey.studio.mapSourceRelief' },
] as const

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
  const role = useStudioStore(s => s.doc?.spreads[active]?.role)
  const theme = useStudioStore(s => s.doc?.theme)
  const [tab, setTab] = useState<Tab>('figures')
  const tabsId = useId()

  /*
   * The road lookups still running when the panel goes away. fetchRoads walks
   * the legs at a deliberate pace, so a twenty-stop map keeps asking a public
   * router for minutes, and the answer would land in whatever document the
   * store holds by then.
   */
  const roadJobs = useRef(new Set<AbortController>())
  useEffect(() => () => {
    roadJobs.current.forEach(c => c.abort())
    roadJobs.current.clear()
  }, [])

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

  const build = travelBuilders({ page, stats, path, locale, t, theme, single: !!role && role !== 'inner' })

  /** Place a copy; the previewed element keeps its own id for React. */
  const place = (el: BookElement) => {
    const placed = { ...el, id: uid(el.kind[0] ?? 'e') } as BookElement
    addElement(active, placed)
    /*
     * A map arrives following the roads, asked for after it is on the page so
     * it appears at once and the line firms up a moment later. Legs long enough
     * to have been flights are never sent (roadRoute.ts), and a failure leaves
     * the leg as it was.
     */
    if (placed.kind === 'map' && placed.points.length > 1) {
      const job = new AbortController()
      roadJobs.current.add(job)
      void fetchRoads(placed.points.map(pt => ({ lat: pt.lat, lng: pt.lng })), { signal: job.signal })
        .then(roads => {
          if (job.signal.aborted) return
          if (roads.some(r => r && r.length > 1)) updateElement(active, placed.id, { roads } as Partial<BookElement>)
        })
        .catch(() => { /* No roads is a state the map already draws. */ })
        .finally(() => { roadJobs.current.delete(job) })
    }
  }

  return (
    <>
      <PanelHead label={t('journey.studio.travel')} />
      <StudioTabs<Tab>
        idBase={tabsId}
        label={t('journey.studio.travel')}
        value={tab}
        onChange={setTab}
        columns={2}
        tabs={TABS.map(x => ({ id: x.id, icon: x.icon, label: t(x.labelKey) }))}
      />
      <StudioTabPanel idBase={tabsId} value={tab} className="st-tab-body">
        <div className="st-panel-scroll">
          {tab === 'figures' && <FiguresTab build={build} t={t} place={place} />}
          {tab === 'maps' && (
            <MapsTab build={build} stats={stats} t={t} place={place}>
              <TravelStops
                stats={stats} t={t} locale={locale} canEdit={canEdit}
                onToggleStop={onToggleStop} countryName={build.countryName}
              />
            </MapsTab>
          )}
          {tab === 'countries' && <CountriesTab build={build} stats={stats} t={t} place={place} />}
          {tab === 'marks' && <MarksTab build={build} t={t} place={place} />}
        </div>
      </StudioTabPanel>
    </>
  )
}

type Build = ReturnType<typeof travelBuilders>

interface TabProps {
  build: Build
  t: (k: string) => string
  place: (el: BookElement) => void
}

/** The summary in its four looks, full width, and every figure on its own as a medal. */
function FiguresTab({ build, t, place }: TabProps) {
  return (
    <>
      <Shelf label={t('journey.studio.summary')}>
        <div className="st-travel-grid is-wide">
          {SUMMARY_LOOKS.map(look => (
            <TravelCard
              key={look}
              el={build.summaryEl(look)}
              label={t(`journey.studio.statsLook.${look}`)}
              onPlace={place}
              minHeight={look === 'band' ? 30 : 70}
              maxHeight={look === 'band' ? 40 : 120}
              inset={look === 'note' || look === 'sketch' ? 0.05 : 0}
            />
          ))}
        </div>
      </Shelf>
      {/* Each figure on its own, in the looks that suit a single figure: a medal, an odometer, a ring drawn by hand. */}
      {FIGURE_SHELVES.map(({ look, metrics }) => (
        <Shelf key={look} label={`${t('journey.studio.singleFigures')}: ${t(`journey.studio.statsLook.${look}`)}`}>
          <div className={`st-travel-grid ${look === 'odometer' ? 'is-wide' : ''}`}>
            {metrics.map(metric => (
              <TravelCard
                key={metric}
                el={build.figureEl(metric, look)}
                label={t(`journey.studio.metric.${metric}`)}
                onPlace={place}
                minHeight={look === 'odometer' ? 50 : 80}
                maxHeight={look === 'odometer' ? 64 : 104}
                inset={look === 'odometer' ? 0 : 0.06}
              />
            ))}
          </div>
        </Shelf>
      ))}
    </>
  )
}

/**
 * The route: drawn with its photographs, its stops numbered, its two ends
 * marked or on a dark ground, then over satellite and relief imagery; a map
 * per trip for a journey of several; and the stops it is drawn from.
 */
function MapsTab({ build, stats, t, place, children }: TabProps & { stats: JourneyStats; children: ReactNode }) {
  if (!stats.points.length) return <p className="st-hint">{t('journey.studio.noRoute')}</p>
  // Only the trips that put stops on the route: a linked trip nobody wrote about would place an empty frame.
  const trips = (stats.trips ?? []).filter(trip => trip.points > 0)
  return (
    <>
      <Shelf label={t('journey.studio.routeMap')}>
        <div className="st-travel-grid">
          {MAP_CARDS.map(card => (
            <TravelCard key={card.id} el={build.mapEl(card)} label={t(card.labelKey)} onPlace={place} minHeight={70} maxHeight={92} />
          ))}
          {IMAGERY.map(src => (
            <TravelCard
              key={src.id}
              el={build.mapEl({ style: 'minimal' }, 'journey', src.id)}
              label={t(src.labelKey)}
              onPlace={place}
              minHeight={70}
              maxHeight={92}
              recommended={src.id === 'satellite'}
              title={src.id === 'satellite' ? t('journey.studio.recommended') : undefined}
            />
          ))}
        </div>
        {/*
          A map per trip: two trips printed as one route draw a line from the
          last stop of one to the first of the next, a leg nobody travelled.
        */}
        {trips.length > 1 && (
          <div className="st-shelf-sub">
            <h4 className="st-section-label">{t('journey.studio.mapPerTrip')}</h4>
            <div className="st-travel-grid">
              {trips.map(trip => (
                <TravelCard
                  key={trip.id}
                  el={build.mapEl({ style: 'minimal', pins: 'numbered' }, { tripId: trip.id })}
                  label={trip.title || t('journey.studio.untitled')}
                  onPlace={place}
                  minHeight={70}
                  maxHeight={92}
                />
              ))}
            </div>
          </div>
        )}
      </Shelf>
      {/* Each country on its own, its stops alone, cut to its shape or in a box. */}
      {stats.countries.slice(0, 6).map(c => (
        <Shelf key={c.code} label={build.countryName(c.code)}>
          <div className="st-travel-grid">
            {COUNTRY_MAPS.map(m => (
              <TravelCard
                key={m.kind}
                el={build.countryMapEl(c.code, m.kind)}
                label={t(m.labelKey)}
                onPlace={place}
                minHeight={80}
                maxHeight={104}
                inset={m.kind === 'box' ? 0 : 0.04}
              />
            ))}
          </div>
        </Shelf>
      ))}
      {children}
    </>
  )
}

/** The maps of one country: cut to its shape on the paper, cut to it over the satellite picture, and in a box. */
const COUNTRY_MAPS = [
  { kind: 'shape', labelKey: 'journey.studio.mapClipCountry' },
  { kind: 'satellite', labelKey: 'journey.studio.mapSourceSatellite' },
  { kind: 'box', labelKey: 'journey.studio.mapClipRect' },
] as const

/** Each country in every look, one shelf per country: a stamp, a visa, a postcard, its flag, a pin, a label, a sketch. */
function CountriesTab({ build, stats, t, place }: TabProps & { stats: JourneyStats }) {
  if (!stats.countries.length) return <p className="st-hint">{t('journey.studio.noCountries')}</p>
  return (
    <>
      {stats.countries.slice(0, 12).map(c => (
        <Shelf key={c.code} label={build.countryName(c.code)}>
          <div className="st-travel-grid">
            {COUNTRY_LOOKS.map(look => (
              <TravelCard
                key={look}
                el={build.countryEl(c.code, look)}
                label={t(`journey.studio.countryLook.${look}`)}
                onPlace={place}
                minHeight={84}
                maxHeight={100}
                inset={look === 'postcard' ? 0.04 : 0.09}
              />
            ))}
          </div>
        </Shelf>
      ))}
    </>
  )
}

/** The marks the journey fills, as stamps, tags and pills. A mark it cannot fill is not offered. */
function MarksTab({ build, t, place }: TabProps) {
  const label = (variant: (typeof MARK_VARIANTS)[number]) => t(`journey.studio.${variant}Mark`)
  return (
    <>
      {MARK_STYLES.map(({ style, variants }) => {
        const cards = variants.flatMap(variant => {
          const el = build.markEl(variant, style)
          return el ? [{ el, variant }] : []
        })
        if (!cards.length) return null
        return (
          <Shelf key={style} label={t(`journey.studio.markStyle.${style}`)}>
            <div className="st-travel-grid">
              {cards.map(({ el, variant }) => (
                <TravelCard
                  key={variant}
                  el={el}
                  label={label(variant)}
                  onPlace={place}
                  minHeight={style === 'stamp' ? 56 : 38}
                  maxHeight={style === 'stamp' ? 76 : 54}
                  inset={style === 'stamp' || style === 'sticker' ? 0.12 : 0.08}
                />
              ))}
            </div>
          </Shelf>
        )
      })}
    </>
  )
}
