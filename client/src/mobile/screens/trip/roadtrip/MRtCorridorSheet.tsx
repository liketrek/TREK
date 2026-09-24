import type { ReactNode } from 'react'
import { AlertTriangle, Loader2, MapPin, Plus, Search, WifiOff, X } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MChip from '../../../components/MChip'
import MIconBtn from '../../../components/MIconBtn'
import { Eyebrow } from '../sheets/MTripSheetUi'
import { useMRtCorridor, type MRtCorridorController } from './useMRtCorridor'
import { corridorHitLabel } from '../../../../components/Roadtrip/corridorSearchModel'
import { CORRIDOR_CATEGORIES, CORRIDOR_CATEGORY_BY_KEY } from '../../../../components/Roadtrip/stopKinds'
import { serviceColor } from '../../../../components/Roadtrip/roadtripModel'
import { formatDistance } from '../../../../utils/units'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { CorridorPoi } from '../../../../components/Roadtrip/useCorridorPois'
import type { MTripSheetsProps } from '../MTripShell'
import type { DistanceUnit, TranslationFn } from '../../../../types'

/**
 * Asking "what is on the way" from the passenger seat.
 *
 * The desktop asks this in a 420px column with six controls: the day, the categories,
 * the corridor width, a section of the drive, a plug type and a minimum power. Two of
 * those are the question and four are ways of narrowing an answer already on screen,
 * which is a desk activity. Here the question is two chips and a button, and the
 * narrowing is gone: a phone shows ten rows, not a hundred, and the way to see fewer of
 * them is to ask about less road.
 *
 * That is the second chip. A search covers one day either way, but a day can be three
 * hundred kilometres and fifteen requests over a mobile connection, while the fifty
 * ahead of the driver are three. "Ahead" is where the money is; "the whole stage" is
 * there because somebody planning tomorrow evening's dinner is not driving right now.
 */
/**
 * Rows a sheet prints before it starts being a scroll rather than an answer.
 *
 * A whole-stage search with four categories comes back with a couple of hundred, which
 * is a list nobody reads on a 375px screen and a couple of hundred inline icons to draw.
 * The rest are not lost: every one of them is a pin on the map behind this sheet, and
 * asking about less road is the way to see fewer.
 */
const MAX_ROWS = 60

export default function MRtCorridorSheet({ planner, shell }: MTripSheetsProps) {
  const { t } = planner
  const corridor = useMRtCorridor(planner, shell)
  const unit = useSettingsStore(s => s.settings.distance_unit)
  const open = shell.sheet?.id === 'rtsearch'

  const reachLabel = t('mobileTrip.rtReachAhead', { distance: formatDistance(corridor.reachKm, unit) })

  /**
   * Taking a hit onto the trip.
   *
   * Through the planner's own POI handler, which is the same door the map's pins use:
   * it works out where in the day's chain the place belongs from how far along the drive
   * it sits, and hands the stop kind and the stay to the draft sheet. The sheet closes
   * first so the draft is not opened underneath it.
   */
  const add = (poi: CorridorPoi) => {
    shell.closeSheet()
    planner.handlePoiClick(poi)
  }

  /** Brings a hit into view, which on a phone means the map half of this tab. */
  const show = (poi: CorridorPoi) => {
    shell.closeSheet()
    planner.focusRoadtripPoint(poi.lat, poi.lng)
    if (shell.rtView === 'list') shell.toggleRtView()
  }

  const canAdd = planner.can('place_edit', planner.trip)

  return (
    <MSheet
      open={open}
      onClose={shell.closeSheet}
      variant="bottom"
      material="opaque"
      ariaLabel={t('roadtrip.poi.title')}
    >
      <div className="flex-none px-[18px] pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[13px] bg-[color:var(--m-ic)]">
            <Search size={17} strokeWidth={2} className="text-m-ink" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[1.0625rem] font-bold leading-tight text-m-ink">{t('roadtrip.poi.title')}</div>
            <div className="font-geist text-[0.71875rem] leading-snug text-m-muted">
              {corridor.reach === 'stage'
                ? t('roadtrip.poi.wholeDay')
                : corridor.anchored
                  ? t('mobileTrip.rtFromNext')
                  : t('mobileTrip.rtFromStart')}
            </div>
          </div>
          <MIconBtn variant="neutral" size={34} onClick={shell.closeSheet} ariaLabel={t('common.close')}>
            <X size={15} strokeWidth={2.2} />
          </MIconBtn>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-2 pt-1">
        <Eyebrow className="mb-[7px] mt-3">{t('roadtrip.poi.looking')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          {CORRIDOR_CATEGORIES.map(({ key, labelKey, Icon }) => (
            <MChip
              key={key}
              size="tap"
              active={corridor.categories.includes(key)}
              onClick={() => corridor.toggleCategory(key)}
            >
              <Icon size={14} strokeWidth={2} />
              {t(labelKey)}
            </MChip>
          ))}
        </div>

        <Eyebrow className="mb-[7px] mt-3.5">{t('mobileTrip.rtReach')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          <MChip size="tap" active={corridor.reach === 'ahead'} onClick={() => corridor.setReach('ahead')}>
            {reachLabel}
          </MChip>
          <MChip size="tap" active={corridor.reach === 'stage'} onClick={() => corridor.setReach('stage')}>
            {t('roadtrip.poi.wholeDay')}
          </MChip>
        </div>

        <StatusBand corridor={corridor} t={t} />

        {corridor.hits.length > 0 && (
          <>
            <ul className="mt-3 overflow-hidden rounded-[18px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)]">
              {corridor.hits.slice(0, MAX_ROWS).map((poi, i) => (
                <HitRow
                  key={poi.osm_id}
                  poi={poi}
                  unit={unit}
                  t={t}
                  first={i === 0}
                  onShow={() => show(poi)}
                  onAdd={canAdd ? () => add(poi) : undefined}
                />
              ))}
            </ul>
            {corridor.hits.length > MAX_ROWS && (
              // Said out loud rather than silently cut: a list that stops at sixty
              // without saying so reads as the whole answer. All of them are on the
              // map underneath, which is the other half of this screen.
              <p className="mt-2 text-center font-geist text-[0.6875rem] tabular-nums text-m-faint">
                {t('roadtrip.poi.foundFiltered', { count: MAX_ROWS, total: corridor.hits.length })}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex-none border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        <button
          type="button"
          onClick={corridor.run}
          disabled={!corridor.canSearch || corridor.loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-m-act text-[0.875rem] font-semibold text-m-actfg disabled:opacity-40"
        >
          {corridor.loading
            ? <Loader2 size={16} strokeWidth={2.2} className="animate-spin" aria-hidden="true" />
            : <Search size={16} strokeWidth={2.2} aria-hidden="true" />}
          {corridor.loading
            ? t('roadtrip.poi.searching', { done: corridor.progress.done, total: corridor.progress.total })
            : t('roadtrip.poi.search')}
        </button>
      </div>
    </MSheet>
  )
}

/**
 * What the search has to say about itself.
 *
 * Every one of these lines exists because the alternative is a list that looks complete
 * and is not: a stretch nobody asked about, a box that did not answer, an answer the
 * server cut short. On a desk those are footnotes under a hundred rows; on a phone they
 * are the difference between "there is no petrol station" and "we did not look".
 */
function StatusBand({ corridor, t }: { corridor: MRtCorridorController; t: TranslationFn }) {
  const notes: string[] = []
  if (corridor.capped) notes.push(t('roadtrip.poi.capped'))
  if (corridor.failedAreas > 0) notes.push(t('roadtrip.poi.partial', { count: corridor.failedAreas }))
  // The phone's own wording, because the desk's ends in "narrow the corridor" and the
  // corridor width is a control this screen deliberately does not have. What it does
  // have is the category chips, and fewer of them really is what makes a box fit.
  // Two keys picked by the count: the i18n layer has no plural engine, so a single key
  // with {count} in a sentence that names the noun once reads as "1 stretches".
  if (corridor.truncatedAreas > 0) {
    notes.push(
      t(corridor.truncatedAreas === 1 ? 'mobileTrip.rtTruncated.one' : 'mobileTrip.rtTruncated.other', {
        count: corridor.truncatedAreas,
      }),
    )
  }

  if (corridor.offline) return <Note tone="warn" icon={<WifiOff size={13} strokeWidth={2} />}>{t('mobileTrip.rtSearchOffline')}</Note>
  if (corridor.error) return <Note tone="warn" icon={<AlertTriangle size={13} strokeWidth={2} />}>{t('roadtrip.poi.failed')}</Note>
  if (corridor.categories.length === 0) return <Note tone="calm">{t('roadtrip.poi.empty')}</Note>

  const empty = corridor.answered && corridor.hits.length === 0
  return (
    <>
      {empty && (
        <Note tone="calm">
          {corridor.reach === 'ahead' ? t('mobileTrip.rtNoneAhead') : t('mobileTrip.rtNoneOnStage')}
        </Note>
      )}
      {notes.map(note => (
        <Note key={note} tone="warn" icon={<AlertTriangle size={13} strokeWidth={2} />}>{note}</Note>
      ))}
    </>
  )
}

function Note({ tone, icon, children }: { tone: 'warn' | 'calm'; icon?: ReactNode; children: ReactNode }) {
  return (
    <div
      className="mt-3 flex items-start gap-[7px] rounded-[15px] px-3 py-[9px] font-geist text-[0.71875rem] leading-[1.45]"
      style={tone === 'warn'
        ? { background: 'color-mix(in srgb, var(--m-st-pending) 12%, transparent)', color: 'var(--m-st-pending)' }
        : { background: 'var(--m-inner)', color: 'var(--m-muted)' }}
    >
      {icon && <span className="mt-px flex-none">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

/**
 * One hit: what it is, where on the drive it sits, and the one action worth a button.
 *
 * Two targets and not three. The row shows it on the map, the plus takes it onto the
 * trip, and everything the desktop puts beside those (the plug list, the price, the
 * opening hours) belongs to the stop once it exists, where the stop sheet already
 * prints it. Adding it twice would be the same duplication the corridor line avoids.
 */
function HitRow({ poi, unit, t, first, onShow, onAdd }: {
  poi: CorridorPoi
  unit: DistanceUnit
  t: TranslationFn
  first: boolean
  onShow: () => void
  onAdd?: () => void
}) {
  const Icon = CORRIDOR_CATEGORY_BY_KEY[poi.category]?.Icon ?? MapPin
  const color = serviceColor(poi.category)
  return (
    <li className={`flex items-center gap-2.5 px-3 py-2 ${first ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}>
      <button type="button" onClick={onShow} className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left">
        <span
          className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[10px]"
          // theme-lint-disable: the road-signage palette from `roadtripModel`, the same
          // colour this kind of stop carries on the map and in the chain.
          style={{ background: `${color}1f`, color }}
        >
          <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{poi.name}</span>
          <span className="mt-px block truncate font-geist text-[0.6875rem] tabular-nums text-m-muted">
            {corridorHitLabel(poi, unit, t)}
          </span>
        </span>
      </button>
      {onAdd && (
        <MIconBtn variant="neutral" size={34} onClick={onAdd} ariaLabel={t('roadtrip.poi.add')}>
          <Plus size={15} strokeWidth={2.2} />
        </MIconBtn>
      )}
    </li>
  )
}
