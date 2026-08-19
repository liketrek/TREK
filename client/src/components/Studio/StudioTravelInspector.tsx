import type {
  BookBadgeElement, BookCountriesElement, BookElement, BookListElement, BookMapElement,
  BookMetric, BookStatsElement, JourneyStats,
} from '@trek/shared'
import { BOOK_METRICS } from '@trek/shared'
import { isStale, refreshPatch } from './travelRefresh'
import { Swatches } from './StudioSwatches'
import { BOOK_FONTS, BOOK_FONT_ORDER, hasWeight, nearestWeight } from './bookFonts'
import { useMapSources } from './mapSources'

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
  Section: (p: { label: string; children: React.ReactNode }) => React.JSX.Element
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`st-chip ${on ? 'is-on' : ''}`} onClick={onClick}>
      {label}
    </button>
  )
}

export function TravelInspector({ el, stats, set, t, Section }: TravelInspectorProps) {
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
          <button
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

      {el.kind === 'map' && <MapProps el={el} set={set} t={t} Section={Section} />}
      {el.kind === 'stats' && <StatsProps el={el} set={set} t={t} Section={Section} />}
      {el.kind === 'countries' && <CountriesProps el={el} set={set} t={t} Section={Section} />}
      {el.kind === 'badge' && <BadgeProps el={el} set={set} t={t} Section={Section} />}
      {el.kind === 'list' && <ListProps el={el} set={set} t={t} Section={Section} />}

      {/*
       * Type, for all five alike.
       *
       * These elements set their own words — a figure over its caption, a
       * country's name over its outline — and until now the only thing you
       * could change about that was the size. A book set in a serif with its
       * stats block in the default sans is a book with one element in the
       * wrong typeface and no way to fix it.
       */}
      <Section label={t('journey.studio.typography')}>
        <div className="st-fonts">
          {BOOK_FONT_ORDER.map(id => {
            const font = BOOK_FONTS[id]
            return (
              <button
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
        <div className="st-row" style={{ marginTop: 8 }}>
          {([400, 500, 600, 700] as const).map(w => (
            <button
              key={w}
              className={`st-chip ${el.weight === w ? 'is-on' : ''}`}
              disabled={!hasWeight(el.font, w)}
              title={hasWeight(el.font, w) ? undefined : t('journey.studio.weightMissing')}
              onClick={() => set({ weight: w } as Partial<BookElement>)}
            >
              {w}
            </button>
          ))}
        </div>
      </Section>

      {/*
       * Colour, for all five alike.
       *
       * They ship with one warm accent so a book made without touching anything
       * still reads as designed — but that is a starting point, not a house
       * style. A book printed to match a cover, or one that simply should not be
       * orange, needs both of these, and they are the same two properties on
       * every travel element.
       */}
      <Section label={t('journey.studio.accent')}>
        <Swatches value={el.accent} onPick={c => set({ accent: c } as Partial<BookElement>)} />
      </Section>
      <Section label={t('journey.studio.colour')}>
        {/*
          Picking a colour is what turns automatic off.

          A chip works out its own text colour from the fill it carries, which
          is right until somebody wants something else — and then a separate
          switch to find first is one step too many. So the swatch does both,
          and the Automatic chip beside it is the way back rather than the way
          in. Only marks have this; the other elements have no fill of their
          own to answer to.
        */}
        <Swatches
          value={el.color}
          onPick={c => set(
            (el.kind === 'badge' ? { color: c, autoColor: false } : { color: c }) as Partial<BookElement>,
          )}
        />
        {el.kind === 'badge' && (
          <div className="st-row" style={{ marginTop: 8 }}>
            <Toggle
              on={el.autoColor}
              label={t('journey.studio.autoColour')}
              onClick={() => set({ autoColor: !el.autoColor } as Partial<BookElement>)}
            />
          </div>
        )}
      </Section>
      <Section label={t('journey.studio.textScale')}>
        <div className="st-row">
          {([0.7, 0.85, 1, 1.2, 1.5] as const).map(scale => (
            <button
              key={scale}
              className={`st-chip ${Math.abs(el.textScale - scale) < 0.01 ? 'is-on' : ''}`}
              onClick={() => set({ textScale: scale } as Partial<BookElement>)}
            >
              {scale === 1 ? '1×' : `${scale}×`}
            </button>
          ))}
        </div>
      </Section>
    </>
  )
}

function ListProps({ el, set, t, Section }: {
  el: BookListElement
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
  Section: TravelInspectorProps['Section']
}) {
  return (
    <Section label={t('journey.studio.addProsCons')}>
      <div className="st-row">
        {(['columns', 'stacked'] as const).map(layout => (
          <button
            key={layout}
            className={`st-chip ${el.layout === layout ? 'is-on' : ''}`}
            onClick={() => set({ layout } as Partial<BookElement>)}
          >
            {t(layout === 'columns' ? 'journey.studio.layoutGrid' : 'journey.studio.layoutColumn')}
          </button>
        ))}
        <Toggle
          on={el.showMarks}
          label={t('journey.studio.showMarks')}
          onClick={() => set({ showMarks: !el.showMarks } as Partial<BookElement>)}
        />
      </div>
      <div className="st-grid2" style={{ marginTop: 8 }}>
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
    </Section>
  )
}

function MapProps({ el, set, t, Section }: {
  el: BookMapElement
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
  Section: TravelInspectorProps['Section']
}) {
  const sources = useMapSources(el.frame, el.points)
  return (
    <>
      <Section label={t('journey.studio.routeMap')}>
        <div className="st-row" style={{ flexWrap: 'wrap' }}>
          {(['minimal', 'outline', 'paper', 'dark'] as const).map(style => (
            <button
              key={style}
              className={`st-chip ${el.style === style ? 'is-on' : ''}`}
              onClick={() => set({ style } as Partial<BookElement>)}
            >
              {t(`journey.studio.mapStyle.${style}`)}
            </button>
          ))}
        </div>
      </Section>
      <Section label={t('journey.studio.mapSource')}>
        <div className="st-row" style={{ flexWrap: 'wrap' }}>
          {sources.map(src => (
            <button
              key={src.id}
              className={`st-chip ${el.source === src.id ? 'is-on' : ''}`}
              onClick={() => set({
                source: src.id,
                tileUrl: src.url,
                // The credit travels with the source. Switching to imagery and
                // leaving the previous attribution would print the wrong one.
                attribution: src.attribution,
              } as Partial<BookElement>)}
            >
              {t(src.labelKey)}
            </button>
          ))}
        </div>
        {el.source !== 'vector' && (
          <p className="st-hint" style={{ paddingTop: 6 }}>{t('journey.studio.mapSourceHint')}</p>
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
        <div className="st-row" style={{ flexWrap: 'wrap' }}>
          <button
            className={`st-chip ${!el.fitToCountries ? 'is-on' : ''}`}
            onClick={() => set({ fitToCountries: false } as Partial<BookElement>)}
          >
            {t('journey.studio.mapFitStops')}
          </button>
          <button
            className={`st-chip ${el.fitToCountries ? 'is-on' : ''}`}
            onClick={() => set({ fitToCountries: true } as Partial<BookElement>)}
          >
            {t('journey.studio.mapFitCountry')}
          </button>
        </div>

        {/*
          Room around what is drawn, as a share of it: the same setting has to
          look right around a walk across a city and a drive across a
          continent, and millimetres cannot do that.
        */}
        <div className="st-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {([
            ['journey.studio.mapPadTight', 0.04],
            ['journey.studio.mapPadNormal', 0.18],
            ['journey.studio.mapPadWide', 0.5],
            ['journey.studio.mapPadFar', 1.2],
          ] as const).map(([key, value]) => (
            <button
              key={key}
              className={`st-chip ${Math.abs(el.fitPadding - value) < 0.001 ? 'is-on' : ''}`}
              onClick={() => set({ fitPadding: value } as Partial<BookElement>)}
            >
              {t(key)}
            </button>
          ))}
        </div>

        {/*
          And the shape. A rectangle is a map in a box, which is what a full
          page wants; cut to the coastline it stops being a figure and becomes
          an illustration that can sit next to anything.
        */}
        <div className="st-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className={`st-chip ${el.clip === 'rect' ? 'is-on' : ''}`}
            onClick={() => set({ clip: 'rect' } as Partial<BookElement>)}
          >
            {t('journey.studio.mapClipRect')}
          </button>
          <button
            className={`st-chip ${el.clip === 'country' ? 'is-on' : ''}`}
            disabled={el.countries.length === 0}
            title={el.countries.length === 0 ? t('journey.studio.mapClipNeedsCountry') : undefined}
            onClick={() => set({ clip: 'country' } as Partial<BookElement>)}
          >
            {t('journey.studio.mapClipCountry')}
          </button>
        </div>
      </Section>

      {el.source === 'tiles' && (
        <Section label={t('journey.studio.mapZoom')}>
          <div className="st-row" style={{ flexWrap: 'wrap' }}>
            <button
              className={`st-chip ${el.zoom === null ? 'is-on' : ''}`}
              onClick={() => set({ zoom: null } as Partial<BookElement>)}
            >
              {t('journey.studio.mapZoomAuto')}
            </button>
            {[3, 5, 7, 9, 11, 13, 15, 17].map(z => (
              <button
                key={z}
                className={`st-chip ${el.zoom === z ? 'is-on' : ''}`}
                onClick={() => set({ zoom: z } as Partial<BookElement>)}
              >
                {z}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section label={t('journey.studio.mapLayers')}>
        <div className="st-row" style={{ flexWrap: 'wrap' }}>
          {el.source !== 'tiles' && el.source !== 'static' && (
            <Toggle on={el.showLand} label={t('journey.studio.showLand')} onClick={() => set({ showLand: !el.showLand } as Partial<BookElement>)} />
          )}
          <Toggle on={el.showRoute} label={t('journey.studio.showRoute')} onClick={() => set({ showRoute: !el.showRoute } as Partial<BookElement>)} />
          <Toggle on={el.showPins} label={t('journey.studio.showPins')} onClick={() => set({ showPins: !el.showPins } as Partial<BookElement>)} />
          <Toggle on={el.showLabels} label={t('journey.studio.showLabels')} onClick={() => set({ showLabels: !el.showLabels } as Partial<BookElement>)} />
        </div>
      </Section>
    </>
  )
}

function StatsProps({ el, set, t, Section }: {
  el: BookStatsElement
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
  Section: TravelInspectorProps['Section']
}) {
  const toggleMetric = (m: BookMetric) => {
    const next = el.metrics.includes(m) ? el.metrics.filter(x => x !== m) : [...el.metrics, m]
    // An empty panel would be a blank rectangle nobody could get back out of,
    // so the last figure cannot be switched off.
    if (!next.length) return
    set({ metrics: next } as Partial<BookElement>)
  }

  return (
    <>
      <Section label={t('journey.studio.metrics')}>
        <div className="st-row" style={{ flexWrap: 'wrap' }}>
          {BOOK_METRICS.map(m => (
            <Toggle
              key={m}
              on={el.metrics.includes(m)}
              label={t(`journey.studio.metric.${m}`)}
              onClick={() => toggleMetric(m)}
            />
          ))}
        </div>
      </Section>
      <Section label={t('journey.studio.layout')}>
        <div className="st-row">
          {(['grid', 'row', 'column'] as const).map(layout => (
            <button
              key={layout}
              className={`st-chip ${el.layout === layout ? 'is-on' : ''}`}
              onClick={() => set({ layout } as Partial<BookElement>)}
            >
              {t(`journey.studio.layout${layout[0].toUpperCase()}${layout.slice(1)}`)}
            </button>
          ))}
        </div>
        <div className="st-row" style={{ marginTop: 8 }}>
          {(['metric', 'imperial'] as const).map(units => (
            <button
              key={units}
              className={`st-chip ${el.units === units ? 'is-on' : ''}`}
              onClick={() => set({ units } as Partial<BookElement>)}
            >
              {units === 'metric' ? 'km' : 'mi'}
            </button>
          ))}
          <Toggle
            on={el.showIcons}
            label={t('journey.studio.elements')}
            onClick={() => set({ showIcons: !el.showIcons } as Partial<BookElement>)}
          />
        </div>
      </Section>
    </>
  )
}

function CountriesProps({ el, set, t, Section }: {
  el: BookCountriesElement
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
  Section: TravelInspectorProps['Section']
}) {
  return (
    <Section label={t('journey.studio.countries')}>
      <div className="st-row">
        {(['list', 'grid', 'column'] as const).map(layout => (
          <button
            key={layout}
            className={`st-chip ${el.layout === layout ? 'is-on' : ''}`}
            onClick={() => set({ layout } as Partial<BookElement>)}
          >
            {t(`journey.studio.layout${layout[0].toUpperCase()}${layout.slice(1)}`)}
          </button>
        ))}
      </div>
      <div className="st-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        <Toggle on={el.showOutline} label={t('journey.studio.showOutline')} onClick={() => set({ showOutline: !el.showOutline } as Partial<BookElement>)} />
        <Toggle on={el.showFlag} label={t('journey.studio.showFlag')} onClick={() => set({ showFlag: !el.showFlag } as Partial<BookElement>)} />
        <Toggle on={el.showName} label={t('journey.studio.showName')} onClick={() => set({ showName: !el.showName } as Partial<BookElement>)} />
      </div>
      <div className="st-row" style={{ marginTop: 8 }}>
        {(['left', 'center', 'right'] as const).map(align => (
          <button
            key={align}
            className={`st-chip ${el.align === align ? 'is-on' : ''}`}
            onClick={() => set({ align } as Partial<BookElement>)}
          >
            {align}
          </button>
        ))}
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

function BadgeProps({ el, set, t, Section }: {
  el: BookBadgeElement
  set: (patch: Partial<BookElement>) => void
  t: (k: string) => string
  Section: TravelInspectorProps['Section']
}) {
  return (
    <Section label={t('journey.studio.marks')}>
      <label className="st-field">
        <span>{t('journey.studio.text')}</span>
        <input
          className="st-input"
          value={el.text}
          onChange={e => set({ text: e.target.value } as Partial<BookElement>)}
        />
      </label>
      <label className="st-field" style={{ marginTop: 8 }}>
        <span>{t('journey.studio.styleCaption')}</span>
        <input
          className="st-input"
          value={el.sub}
          onChange={e => set({ sub: e.target.value } as Partial<BookElement>)}
        />
      </label>
      <div className="st-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        {(['plain', 'chip', 'outline', 'stacked'] as const).map(style => (
          <button
            key={style}
            className={`st-chip ${el.style === style ? 'is-on' : ''}`}
            onClick={() => set({ style } as Partial<BookElement>)}
          >
            {style}
          </button>
        ))}
      </div>
    </Section>
  )
}
