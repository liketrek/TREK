import type {
  BookBadgeElement, BookCountriesElement, BookElement, BookListElement, BookMapElement,
  BookMetric, BookStatsElement, JourneyStats,
} from '@trek/shared'
import { BOOK_METRICS } from '@trek/shared'
import { isStale, refreshPatch } from './travelRefresh'
import { Swatches } from './StudioSwatches'

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
        <Swatches value={el.color} onPick={c => set({ color: c } as Partial<BookElement>)} />
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
      <Section label={t('journey.studio.mapLayers')}>
        <div className="st-row" style={{ flexWrap: 'wrap' }}>
          <Toggle on={el.showLand} label={t('journey.studio.showLand')} onClick={() => set({ showLand: !el.showLand } as Partial<BookElement>)} />
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
