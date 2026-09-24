import { useState } from 'react'
import type {
  BookBadgeElement, BookCountriesElement, BookElement, BookListElement, BookMapElement,
  BookMetric, BookStatsElement, JourneyStats,
} from '@trek/shared'
import { BOOK_METRICS } from '@trek/shared'
import { isStale, refreshPatch } from './travelRefresh'
import { Swatches } from './StudioSwatches'
import { BOOK_FONTS, BOOK_FONT_ORDER, hasWeight, nearestWeight } from './bookFonts'
import { sourceIdOf, useMapSources } from './mapSources'
import { printDpi, tileView } from './mapTiles'
import { useCartoApiKey } from '../../hooks/useTileUrl'
import { routeFor } from './travelRefresh'
import { Choice, Line, Picks, Section, Switch } from './StudioControls'
import { fetchRoads } from './roadRoute'

/**
 * Properties of the travel elements.
 *
 * Its own file because these four are a different kind of thing from a photo or
 * a paragraph: what you adjust is *what the element says*, not how a box looks.
 * Keeping them here leaves StudioInspector.tsx about the elements that have
 * been there since the beginning.
 */

export interface TravelInspectorProps {
  el: BookElement
  /** Live figures, for the refresh button. Null while loading or on failure. */
  stats: JourneyStats | null
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
  locale: string
}

interface Props<T> {
  el: T
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
}

export function TravelInspector({ el, stats, set, t }: TravelInspectorProps) {
  if (
    el.kind !== 'map' && el.kind !== 'stats' && el.kind !== 'countries'
    && el.kind !== 'badge' && el.kind !== 'list'
  ) {
    return null
  }

  const stale = isStale(el, stats)

  return (
    <>
      {stale && (
        <div className="st-section">
          <p className="st-stale">{t('journey.studio.staleHint')}</p>
          <button type="button"
            className="st-chip"
            onClick={() => {
              if (!stats) return
              const patch = refreshPatch(el, stats)
              if (patch) set(patch)
            }}
          >
            {t('journey.studio.refresh')}
          </button>
        </div>
      )}

      {el.kind === 'map' && <MapProps el={el} set={set} t={t} stats={stats} />}
      {el.kind === 'stats' && <StatsProps el={el} set={set} t={t} />}
      {el.kind === 'countries' && <CountriesProps el={el} set={set} t={t} />}
      {el.kind === 'badge' && <BadgeProps el={el} set={set} t={t} />}
      {el.kind === 'list' && <ListProps el={el} set={set} t={t} />}

      {/*
       * Type, for all five alike.
       *
       * These elements set their own words — a figure over its caption, a
       * country's name over its outline — and until now the only thing you
       * could change about that was the size. A book set in a serif with its
       * stats block in the default sans is a book with one element in the
       * wrong typeface and no way to fix it.
       */}
      <Section label={t('journey.studio.typography')} defaultOpen={false}>
        <div className="st-fonts">
          {BOOK_FONT_ORDER.map(id => {
            const font = BOOK_FONTS[id]
            return (
              <button type="button"
                key={id}
                className={`st-font ${el.font === id ? 'is-on' : ''}`}
                style={{ fontFamily: font.stack }}
                onClick={() => set({
                  font: id,
                  // A family that does not ship this weight renders a
                  // synthesised bold — a smeared regular in print — so the
                  // weight moves to the nearest one it really has.
                  weight: nearestWeight(id, el.weight) as typeof el.weight,
                } as Partial<BookElement>)}
                title={font.name}
              >
                {font.name}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 10 }}>
          <Line label={t('journey.studio.weight')}>
            <Choice
              value={el.weight}
              options={([400, 500, 600, 700] as const).map(w => ({
                value: w,
                label: String(w),
                disabled: !hasWeight(el.font, w),
                title: hasWeight(el.font, w) ? undefined : t('journey.studio.weightMissing'),
              }))}
              onPick={weight => set({ weight } as Partial<BookElement>)}
            />
          </Line>
          <Line label={t('journey.studio.textScale')}>
            <Choice
              value={el.textScale}
              options={([0.7, 0.85, 1, 1.2, 1.5] as const).map(scale => ({
                value: scale, label: `${scale}×`,
              }))}
              onPick={textScale => set({ textScale } as Partial<BookElement>)}
            />
          </Line>
        </div>
      </Section>

      {/*
       * Colour, for all five alike, and in one group.
       *
       * These were two sections called Accent and Colour, one under the other,
       * each ten unlabelled swatches wrapping onto two rows: twenty squares and
       * no way to tell which of them painted what. The role now sits beside the
       * row and says it — the accent is the mark's own colour, the ink is what
       * is written on it.
       *
       * They ship with one warm accent so a book made without touching anything
       * still reads as designed. That is a starting point, not a house style: a
       * book printed to match a cover, or one that simply should not be orange,
       * needs both of these.
       */}
      <Section label={t('journey.studio.colour')}>
        <Line label={t('journey.studio.accent')} wide>
          <Swatches value={el.accent} onPick={c => set({ accent: c } as Partial<BookElement>)} />
        </Line>
        <Line label={t('journey.studio.text')} wide>
          {/*
            Picking a colour is what turns automatic off, so the swatch does
            both and the switch below is the way back rather than the way in.
            Only marks have it; nothing else here has a fill of its own for the
            words to answer to.
          */}
          <Swatches
            value={el.color}
            onPick={c => set(
              (el.kind === 'badge' ? { color: c, autoColor: false } : { color: c }) as Partial<BookElement>,
            )}
          />
        </Line>
        {el.kind === 'badge' && (
          <div style={{ marginTop: 10 }}>
            <Switch
              label={t('journey.studio.autoColour')}
              on={el.autoColor}
              onToggle={() => set({ autoColor: !el.autoColor } as Partial<BookElement>)}
            />
          </div>
        )}
      </Section>
    </>
  )
}

function ListProps({ el, set, t }: Props<BookListElement>) {
  return (
    <Section label={t('journey.studio.addProsCons')}>
      <Line label={t('journey.studio.layout')}>
        <Choice
          value={el.layout}
          options={[
            { value: 'columns' as const, label: t('journey.studio.layoutGrid') },
            { value: 'stacked' as const, label: t('journey.studio.layoutColumn') },
          ]}
          onPick={layout => set({ layout } as Partial<BookElement>)}
        />
      </Line>
      <div className="st-grid2" style={{ marginTop: 10 }}>
        <label className="st-field">
          <span>{t('journey.editor.pros')}</span>
          <input
            className="st-input"
            value={el.proLabel}
            onChange={e => set({ proLabel: e.target.value } as Partial<BookElement>)}
          />
        </label>
        <label className="st-field">
          <span>{t('journey.editor.cons')}</span>
          <input
            className="st-input"
            value={el.conLabel}
            onChange={e => set({ conLabel: e.target.value } as Partial<BookElement>)}
          />
        </label>
      </div>
      <div style={{ marginTop: 10 }}>
        <Switch
          label={t('journey.studio.showMarks')}
          on={el.showMarks}
          onToggle={() => set({ showMarks: !el.showMarks } as Partial<BookElement>)}
        />
      </div>
    </Section>
  )
}

function MapProps({ el, set, t, stats }: Props<BookMapElement> & { stats: JourneyStats | null }) {
  const cartoKey = useCartoApiKey()
  const [roadState, setRoadState] = useState<'idle' | 'busy'>('idle')
  const [roadDone, setRoadDone] = useState(0)
  const hasRoads = (el.roads ?? []).some(r => r && r.length > 1)

  /*
   * One leg at a time, paced, and written into the document when it is done
   * rather than leg by leg: a hundred commits would be a hundred undo steps and
   * a hundred autosaves for one action.
   */
  const loadRoads = async () => {
    setRoadState('busy')
    setRoadDone(0)
    try {
      const roads = await fetchRoads(
        el.points.map(p => ({ lat: p.lat, lng: p.lng })),
        { onProgress: done => setRoadDone(done) },
      )
      set({ roads } as Partial<BookElement>)
    } finally {
      setRoadState('idle')
    }
  }

  const sources = useMapSources(el.frame, el.points, { source: el.source, tileUrl: el.tileUrl })
  /** Only trips that put stops on the route: a map of the others is a blank. */
  const tripsWithRoute = (stats?.trips ?? []).filter(t => t.points > 0)
  /*
   * The grid this element will really fetch, asked for here so the panel can
   * say what it will print at. Same call the renderer makes, same answer.
   */
  const view = el.source === 'tiles' && el.tileUrl
    ? tileView(el.points, { w: el.frame.w, h: el.frame.h }, el.tileUrl, el.zoom, undefined, 'print', cartoKey)
    : null
  const dpi = view ? printDpi(view, el.tileUrl) : null

  return (
    <>
      {/*
        Which trip, when the journey is made of more than one.

        A journey of two trips drawn as one route puts a line from the last
        stop of the first to the first stop of the second: usually the longest
        leg on the page, and one nobody travelled. Switching here re-cuts the
        route on the spot rather than at the next refresh, because a control
        that changes nothing visible reads as broken.
      */}
      {tripsWithRoute.length > 1 && (
        <Section label={t('journey.studio.mapScope')}>
          <Choice
            value={el.tripId ?? 0}
            options={[
              { value: 0, label: t('journey.studio.mapWholeJourney') },
              ...tripsWithRoute.map(trip => ({
                value: trip.id,
                label: trip.title || t('journey.studio.untitled'),
              })),
            ]}
            onPick={id => {
              if (!stats) return
              const tripId = id === 0 ? null : id
              const route = routeFor(stats, tripId)
              set({
                tripId,
                countries: tripId == null
                  ? stats.countries.map(c => c.code)
                  : [...new Set(route.map(p => p.country).filter((c): c is string => !!c))],
                points: route.map(p => ({ lat: p.lat, lng: p.lng, label: p.label, photoId: p.photoId ?? null })),
              } as Partial<BookElement>)
            }}
          />
        </Section>
      )}

      {/* Where the picture comes from and what it looks like: one question
          with two halves, which is one group rather than two. */}
      <Section label={t('journey.studio.routeMap')}>
        <Line label={t('journey.studio.mapSource')} wide>
          <Choice
            value={sourceIdOf(el, sources)}
            options={sources.map(src => ({ value: src.id, label: t(src.labelKey) }))}
            onPick={id => {
              const src = sources.find(x => x.id === id)
              if (!src) return
              set({
                source: src.source,
                tileUrl: src.url,
                // The credit travels with the source. Switching to imagery and
                // leaving the previous attribution would print the wrong one.
                attribution: src.attribution,
              } as Partial<BookElement>)
            }}
          />
        </Line>
        <div style={{ marginTop: 10 }}>
          <Line label={t('journey.studio.style')} wide>
            <Choice
              value={el.style}
              options={(['minimal', 'outline', 'paper', 'dark'] as const).map(style => ({
                value: style, label: t(`journey.studio.mapStyle.${style}`),
              }))}
              onPick={style => set({ style } as Partial<BookElement>)}
            />
          </Line>
        </div>
        {el.source !== 'vector' && (
          <>
            <p className="st-hint" style={{ paddingTop: 8 }}>
              {t(SOURCE_HINT[sourceIdOf(el, sources)] ?? 'journey.studio.mapSourceHint')}
            </p>
            {/*
              What this map will actually print at, at the size it is now.
              A number rather than a warning icon: 300 means nothing to argue
              with, and somebody who wants a soft map on purpose can have one.
            */}
            {dpi != null && (
              <p className={`st-hint ${dpi < 150 ? 'st-stale' : ''}`} style={{ paddingTop: 6 }}>
                {t('journey.studio.mapPrintDpi')} {dpi} dpi
                {dpi < 150 && ` — ${t('journey.studio.mapPrintDpiLow')}`}
              </p>
            )}
          </>
        )}
      </Section>

      {/*
        ── What the map shows ─────────────────────────────────────────────

        Three questions, and they are not the same question: how close the view
        is, how much air is left around it, and what shape the picture is cut
        to. The first two used to be decided for you, and the decision was
        wrong often enough to be the loudest complaint about this element: a
        trip that stayed inside one city was drawn as the whole country with
        two dots in the middle of it.
      */}
      <Section label={t('journey.studio.mapFraming')}>
        <Line label={t('journey.studio.mapFit')}>
          <Choice
            value={el.fitToCountries ? 'country' : 'stops'}
            options={[
              { value: 'stops' as const, label: t('journey.studio.mapFitStops') },
              { value: 'country' as const, label: t('journey.studio.mapFitCountry') },
            ]}
            onPick={v => set({ fitToCountries: v === 'country' } as Partial<BookElement>)}
          />
        </Line>

        {/*
          Room around what is drawn, as a share of it: the same setting has to
          look right around a walk across a city and a drive across a
          continent, and millimetres cannot do that.
        */}
        <Line label={t('journey.studio.mapPadding')}>
          <Choice
            value={([0.04, 0.18, 0.5, 1.2] as const).find(v => Math.abs(el.fitPadding - v) < 0.001) ?? 0.18}
            options={[
              { value: 0.04, label: t('journey.studio.mapPadTight') },
              { value: 0.18, label: t('journey.studio.mapPadNormal') },
              { value: 0.5, label: t('journey.studio.mapPadWide') },
              { value: 1.2, label: t('journey.studio.mapPadFar') },
            ]}
            onPick={fitPadding => set({ fitPadding } as Partial<BookElement>)}
          />
        </Line>

        {/*
          And the shape. A rectangle is a map in a box, which is what a full
          page wants; cut to the coastline it stops being a figure and becomes
          an illustration that can sit next to anything.
        */}
        <Line label={t('journey.studio.mapShape')}>
          <Choice
            value={el.clip}
            options={[
              { value: 'rect' as const, label: t('journey.studio.mapClipRect') },
              {
                value: 'country' as const,
                label: t('journey.studio.mapClipCountry'),
                disabled: el.countries.length === 0,
                title: el.countries.length === 0 ? t('journey.studio.mapClipNeedsCountry') : undefined,
              },
            ]}
            onPick={clip => set({ clip } as Partial<BookElement>)}
          />
        </Line>
      </Section>

      {el.source === 'tiles' && (
        <Section label={t('journey.studio.mapZoom')} defaultOpen={false}>
          <Choice
            value={el.zoom ?? -1}
            options={[
              { value: -1, label: t('journey.studio.mapZoomAuto') },
              ...[3, 5, 7, 9, 11, 13, 15, 17].map(z => ({ value: z, label: String(z) })),
            ]}
            onPick={z => set({ zoom: z === -1 ? null : z } as Partial<BookElement>)}
          />
        </Section>
      )}

      {/*
        How the line itself is drawn, and whether it follows real roads.

        Open by default, unlike the groups below it. It was folded, on the
        reasoning that a look is chosen once per book — but a control nobody can
        see is a control nobody has, and the first thing anyone wants from a map
        of a journey is the line across it.
      */}
      <Section label={t('journey.studio.routeLook')}>
        <Line label={t('journey.studio.routeStyle')} wide>
          <Choice
            value={el.routeStyle}
            options={[
              { value: 'plain' as const, label: t('journey.studio.routePlain') },
              { value: 'drawn' as const, label: t('journey.studio.routeDrawn') },
            ]}
            onPick={routeStyle => set({ routeStyle } as Partial<BookElement>)}
          />
        </Line>
        {/*
          The roads, fetched once and kept.

          Not a switch, because it is not free: it asks a public routing service
          one question per leg, from this browser, and the answer is then frozen
          into the document so the book prints the same line offline and next
          year. A switch would imply it could simply be turned back on later,
          on a page that is being exported, which is exactly when it cannot.
        */}
        <div style={{ marginTop: 10 }}>
          {/*
            Which way the line goes between two stops.

            A choice rather than a button, because that is what it is from where
            the user sits: the roads, or the way a map has always drawn a leg it
            does not know. That the roads have to be fetched once and are then
            kept in the book is an implementation detail, and the only place it
            shows is the counter while it works.
          */}
          <Line label={t('journey.studio.roads')} wide>
            {roadState === 'busy' ? (
              <div className="st-row">
                <span className="st-chip is-on">
                  {t('journey.studio.roadsBusy')} {roadDone}/{Math.max(1, el.points.length - 1)}
                </span>
              </div>
            ) : (
              <Choice
                value={hasRoads ? 'roads' : 'direct'}
                options={[
                  { value: 'roads' as const, label: t('journey.studio.roadsFollow') },
                  { value: 'direct' as const, label: t('journey.studio.roadsDirect') },
                ]}
                onPick={v => {
                  if (v === 'direct') {
                    set({ roads: [] } as Partial<BookElement>)
                  } else {
                    void loadRoads()
                  }
                }}
              />
            )}
          </Line>
          {hasRoads && roadState !== 'busy' && (
            <div className="st-row" style={{ marginTop: 8 }}>
              <button type="button" className="st-chip" onClick={() => void loadRoads()}>
                {t('journey.studio.roadsAgain')}
              </button>
            </div>
          )}
          <p className="st-hint" style={{ paddingTop: 6 }}>
            {t(hasRoads ? 'journey.studio.roadsHave' : 'journey.studio.roadsHint')}
          </p>
        </div>

        {el.routeStyle === 'drawn' && (
          <>
            <Line label={t('journey.studio.routeArc')} wide>
              <Choice
                value={el.routeArc}
                options={[
                  { value: 'straight' as const, label: t('journey.studio.routeStraight') },
                  { value: 'bow' as const, label: t('journey.studio.routeBow') },
                ]}
                onPick={routeArc => set({ routeArc } as Partial<BookElement>)}
              />
            </Line>
            {el.routeArc === 'bow' && (
              <div style={{ marginTop: 10 }}>
                <Switch
                  label={t('journey.studio.routeDashArcs')}
                  on={el.routeDash === 'arcs'}
                  onToggle={() => set({
                    routeDash: el.routeDash === 'arcs' ? 'solid' : 'arcs',
                  } as Partial<BookElement>)}
                />
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <Line label={t('journey.studio.mapStops')} wide>
                <Choice
                  value={el.pinStyle}
                  options={[
                    { value: 'dot' as const, label: t('journey.studio.pinDot') },
                    { value: 'photo' as const, label: t('journey.studio.pinPhoto') },
                  ]}
                  onPick={pinStyle => set({ pinStyle } as Partial<BookElement>)}
                />
              </Line>
            </div>
            {el.pinStyle === 'photo' && !el.points.some(p => p.photoId != null) && (
              <p className="st-hint" style={{ paddingTop: 8 }}>{t('journey.studio.pinPhotoNone')}</p>
            )}
          </>
        )}
      </Section>

      {/* Four things that are either drawn or not. They used to be the same
          pill as the style choice above, so a layer looked like an option. */}
      <Section label={t('journey.studio.mapLayers')}>
        {el.source !== 'tiles' && el.source !== 'static' && (
          <Switch label={t('journey.studio.showLand')} on={el.showLand} onToggle={() => set({ showLand: !el.showLand } as Partial<BookElement>)} />
        )}
        <Switch label={t('journey.studio.showRoute')} on={el.showRoute} onToggle={() => set({ showRoute: !el.showRoute } as Partial<BookElement>)} />
        <Switch label={t('journey.studio.showPins')} on={el.showPins} onToggle={() => set({ showPins: !el.showPins } as Partial<BookElement>)} />
        <Switch label={t('journey.studio.showLabels')} on={el.showLabels} onToggle={() => set({ showLabels: !el.showLabels } as Partial<BookElement>)} />
      </Section>
    </>
  )
}

function StatsProps({ el, set, t }: Props<BookStatsElement>) {
  const toggleMetric = (m: BookMetric) => {
    const next = el.metrics.includes(m) ? el.metrics.filter(x => x !== m) : [...el.metrics, m]
    // An empty panel would be a blank rectangle nobody could get back out of,
    // so the last figure cannot be switched off.
    if (!next.length) return
    set({ metrics: next } as Partial<BookElement>)
  }

  return (
    <>
      {/*
        Which figures, out of seven. A set rather than a row of choices, and it
        looks like one now: the picked ones carry a tick instead of being the
        same filled pill the layout below uses for "this one".
      */}
      <Section label={t('journey.studio.metrics')}>
        <Picks
          value={el.metrics}
          options={BOOK_METRICS.map(m => ({ value: m, label: t(`journey.studio.metric.${m}`) }))}
          onToggle={toggleMetric}
        />
      </Section>
      <Section label={t('journey.studio.layout')}>
        <Line label={t('journey.studio.layout')}>
          <Choice
            value={el.layout}
            options={(['grid', 'row', 'column'] as const).map(layout => ({
              value: layout,
              label: t(`journey.studio.layout${layout[0].toUpperCase()}${layout.slice(1)}`),
            }))}
            onPick={layout => set({ layout } as Partial<BookElement>)}
          />
        </Line>
        <Line label={t('journey.studio.units')}>
          <Choice
            value={el.units}
            options={[
              { value: 'metric' as const, label: 'km' },
              { value: 'imperial' as const, label: 'mi' },
            ]}
            onPick={units => set({ units } as Partial<BookElement>)}
          />
        </Line>
        <div style={{ marginTop: 10 }}>
          {/* Its label used to be "Elements", which is the name of a panel on
              the other side of the screen and not what this draws. */}
          <Switch
            label={t('journey.studio.showIcons')}
            on={el.showIcons}
            onToggle={() => set({ showIcons: !el.showIcons } as Partial<BookElement>)}
          />
        </div>
      </Section>
    </>
  )
}

function CountriesProps({ el, set, t }: Props<BookCountriesElement>) {
  return (
    <Section label={t('journey.studio.countries')}>
      <Line label={t('journey.studio.layout')}>
        <Choice
          value={el.layout}
          options={(['list', 'grid', 'column'] as const).map(layout => ({
            value: layout,
            label: t(`journey.studio.layout${layout[0].toUpperCase()}${layout.slice(1)}`),
          }))}
          onPick={layout => set({ layout } as Partial<BookElement>)}
        />
      </Line>
      {/* These three read as raw English out of the code before: `left`,
          `center`, `right`, straight from the value. */}
      <Line label={t('journey.studio.align')}>
        <Choice
          value={el.align}
          options={(['left', 'center', 'right'] as const).map(align => ({
            value: align, label: t(`journey.studio.align.${align}`),
          }))}
          onPick={align => set({ align } as Partial<BookElement>)}
        />
      </Line>
      <div style={{ marginTop: 10 }}>
        <Switch label={t('journey.studio.showOutline')} on={el.showOutline} onToggle={() => set({ showOutline: !el.showOutline } as Partial<BookElement>)} />
        <Switch label={t('journey.studio.showFlag')} on={el.showFlag} onToggle={() => set({ showFlag: !el.showFlag } as Partial<BookElement>)} />
        <Switch label={t('journey.studio.showName')} on={el.showName} onToggle={() => set({ showName: !el.showName } as Partial<BookElement>)} />
      </div>

      {/*
        The names themselves, one per line.

        They arrive resolved from the journey and are usually right, but "usually"
        is not a thing you can print: a country whose English name nobody uses,
        a territory the geocoder names differently from the way the trip talked
        about it, a line that wants to read "Scotland" rather than "United
        Kingdom". A textarea rather than a field per country because the list is
        two names on one page and twenty on another, and lines are how anyone
        already edits a list.

        Editing only the names is deliberate: the codes stay as they were, so the
        outlines and flags keep matching the places actually visited.
      */}
      {el.showName && (
        <label className="st-field" style={{ marginTop: 10 }}>
          <span>{t('journey.studio.countryNames')}</span>
          <textarea
            className="st-input st-textarea"
            rows={Math.min(8, Math.max(2, el.codes.length))}
            value={el.names.join('\n')}
            onChange={e => {
              const lines = e.target.value.split('\n')
              // One name per country, in the order they were visited: a removed
              // line must not shift every name after it onto the wrong outline.
              set({
                names: el.codes.map((code, i) => (lines[i] ?? el.names[i] ?? code).slice(0, 80)),
              } as Partial<BookElement>)
            }}
          />
        </label>
      )}
    </Section>
  )
}

/** What each imagery source is for, said once where it is chosen. */
const SOURCE_HINT: Record<string, string> = {
  relief: 'journey.studio.mapSourceReliefHint',
  satellite: 'journey.studio.mapSourceSatelliteHint',
}

/** The variants that draw something as well as saying something. */
const ICON_VARIANTS = ['flag', 'country', 'mood', 'weather']

function BadgeProps({ el, set, t }: Props<BookBadgeElement>) {
  const showIcon = el.showIcon !== false
  const showLabel = el.showLabel !== false
  const parts = (icon: boolean, label: boolean) =>
    set({ showIcon: icon, showLabel: label } as Partial<BookElement>)

  return (
    <>
    <Section label={t('journey.studio.marks')}>
      <Line label={t('journey.studio.text')}>
        <input
          className="st-input"
          value={el.text}
          onChange={e => set({ text: e.target.value } as Partial<BookElement>)}
        />
      </Line>
      <Line label={t('journey.studio.styleCaption')}>
        <input
          className="st-input"
          value={el.sub}
          onChange={e => set({ sub: e.target.value } as Partial<BookElement>)}
        />
      </Line>
      {/* These four printed the raw value — `plain`, `chip` — in every one of
          the twenty-three languages. */}
      <Line label={t('journey.studio.style')} wide>
        <Choice
          value={el.style}
          options={(['plain', 'chip', 'outline', 'stacked'] as const).map(style => ({
            value: style, label: t(`journey.studio.markStyle.${style}`),
          }))}
          onPick={style => set({ style } as Partial<BookElement>)}
        />
      </Line>
    </Section>

    {/*
      The icon, for the marks that have one.
      
      Three combinations rather than two switches: a mark with neither its
      picture nor its words is an empty box, and offering it as a state people
      can reach means offering them a way to lose an element on the page.
    */}
    {ICON_VARIANTS.includes(el.variant) && (
      <Section label={t('journey.studio.icon')}>
        <Line label={t('journey.studio.shows')} wide>
          <Choice
            value={showIcon && showLabel ? 'both' : showIcon ? 'icon' : 'label'}
            options={[
              { value: 'both' as const, label: t('journey.studio.iconAndLabel') },
              { value: 'icon' as const, label: t('journey.studio.iconOnly') },
              { value: 'label' as const, label: t('journey.studio.labelOnly') },
            ]}
            onPick={v => parts(v !== 'label', v !== 'icon')}
          />
        </Line>
        {showIcon && (
          <>
            {/*
              A mood's icon carries the journal's own colour and the others
              carry the element's accent — which is right until it is not, and
              until now there was no way past it: the swatch below is the only
              thing that reaches the icon, because lucide takes its colour as a
              prop rather than inheriting it.
            */}
            <Line label={t('journey.studio.colour')} wide>
              <Swatches
                value={el.iconColor}
                onPick={c => set({ iconColor: c, autoIconColor: false } as Partial<BookElement>)}
              />
            </Line>
            <div style={{ marginTop: 10 }}>
              <Switch
                label={t('journey.studio.autoColour')}
                on={el.autoIconColor !== false}
                onToggle={() => set({ autoIconColor: el.autoIconColor === false } as Partial<BookElement>)}
              />
            </div>
          </>
        )}
      </Section>
    )}
    </>
  )
}
