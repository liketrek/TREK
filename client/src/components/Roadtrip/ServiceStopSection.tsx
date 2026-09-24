import React, { useMemo } from 'react'
import CustomSelect from '../shared/CustomSelect'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { StopKindChips, StopStayChips } from './StopChips'
import { serviceStopChoice, OFF_ROUTE_NOTE_KM, type ServiceStopMode } from './manualStop'
import type { RoadtripStopType } from '@trek/shared'

/**
 * Adding a stop the corridor search never found, inside the place form itself.
 *
 * The search reads OpenStreetMap, and a good share of the chargers actually standing at
 * a motorway junction are not in it, most Tesla Superchargers among them. The way round
 * it was to leave road trip mode, add the place under Days, drag it onto the right day,
 * come back and mark it a charging stop.
 *
 * So the form the rest of TREK adds places with does the job, with three changes: the
 * category becomes the kind of stop (a pump is not a taste, it is a fact about the
 * place), the costs go (a petrol stop is not an activity with a budget line), and this
 * row asks where on the drive it belongs. Everything else about the form is the reason
 * to use it, its typed-ahead search above all: that search is the one the whole app
 * uses, and it is legible and scrollable.
 *
 * Which leg the stop lands on is worked out from where the place IS, and only once it
 * has been chosen: unlike a corridor hit, nothing here has coordinates until then.
 */

/** Matches the form's own field labels, so the section reads as part of it. */
const LABEL = 'block text-sm font-medium text-content-secondary mb-1'
/** The label above already spaces the row, so the pills bring no margin of their own. */
const ROW = 'flex flex-wrap gap-1.5'
/**
 * What holds the pieces of one option apart.
 *
 * A separator rather than a sentence, and deliberately not a word: the caption above
 * already says these are the stretches to add between, so a row only has to name the two
 * stops and how far off them the place lies. It also reads the same way in a language
 * written right to left, which an arrow would not.
 */
const SEP = ' · '

interface ServiceStopSectionProps {
  mode: ServiceStopMode
  /** The kind chosen, from the form's own state: it is saved as `places.stop_type`. */
  stopType: RoadtripStopType | null
  /** Called only for a kind that is not already on, so a dwell set by hand survives. */
  onStopType: (kind: RoadtripStopType) => void
  minutes: number
  onMinutes: (value: number) => void
  /** The leg the traveller picked, or empty while the projection's answer stands. */
  leg: string
  onLeg: (value: string) => void
  /** Where the place is, as the form has it. Null until one has been chosen. */
  lat: number | null
  lng: number | null
}

export default function ServiceStopSection({
  mode, stopType, onStopType, minutes, onMinutes, leg, onLeg, lat, lng,
}: ServiceStopSectionProps): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const choice = useMemo(() => serviceStopChoice(mode, lat, lng, leg), [mode, lat, lng, leg])

  /**
   * The stretches on offer, each naming what it is and how far the place lies from it.
   *
   * The distance is the whole reason the preselected one is preselected, and until it
   * was written down nothing on screen said so: the list looked like a guess to be
   * second-guessed rather than a measurement to be overruled.
   */
  const options = useMemo(() => [
    ...choice.legs.map(item => ({
      value: item.value,
      label: item.offRouteKm === null
        ? `${item.from}${SEP}${item.to}`
        : `${item.from}${SEP}${item.to}${SEP}${t('roadtrip.poi.offRoute', {
            distance: formatDistance(item.offRouteKm, distanceUnit),
          })}`,
      badge: t('roadtrip.day', { number: item.dayNumber }),
    })),
    ...(choice.end
      ? [{
          // The end of the day the panel is on, which stays reachable however the rest of
          // the trip has routed. It names its own day, so it carries no badge repeating it.
          value: choice.end.value,
          label: t('roadtrip.stop.landsOn', { day: choice.end.dayNumber, position: choice.end.position + 1 }),
        }]
      : []),
  ], [choice, t, distanceUnit])

  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>{t('roadtrip.stop.kind')}</label>
        <StopKindChips
          value={stopType}
          onPick={(kind, wasChosen) => { if (!wasChosen) onStopType(kind) }}
          className={ROW}
        />
      </div>

      <div>
        <label className={LABEL}>{t('roadtrip.stop.stay')}</label>
        <StopStayChips value={minutes} onPick={onMinutes} className={ROW} />
      </div>

      {/* Where it goes. Preselected from the projection, and changeable.

          Nothing to preselect from without a place: a name cannot be measured onto a
          road, so the stop is added to the trip's places and the line below says so. */}
      {!choice.located ? (
        <p className="text-caption text-content-muted" data-testid="service-stop-needs-point">
          {t('roadtrip.poi.manualNoCoords')}
        </p>
      ) : choice.legs.length > 0 ? (
        <div>
          <label className={LABEL}>{t('roadtrip.poi.addBetween')}</label>
          <CustomSelect
            value={choice.legValue}
            onChange={value => onLeg(String(value))}
            options={options}
            size="sm"
            menuFit="content"
          />
          {/* Said quietly rather than refused. It is the reason the leg above may be the
              wrong one, and the only way the reader can know to change it. Measured
              against the stretch actually chosen, so overruling the projection moves the
              note with it, and a stretch that could not be measured says nothing at all
              rather than borrowing a figure from the one the projection landed on. */}
          {choice.placement && choice.placement.offRouteKm !== null && choice.placement.offRouteKm > OFF_ROUTE_NOTE_KM ? (
            <p className="mt-1 text-caption text-warning">
              {t('roadtrip.poi.manualOffRoute', {
                distance: formatDistance(choice.placement.offRouteKm, distanceUnit),
              })}
            </p>
          ) : null}
        </div>
      ) : choice.end ? (
        <div>
          <label className={LABEL}>{t('roadtrip.poi.addBetween')}</label>
          <p className="text-caption text-content-muted">
            {t('roadtrip.poi.manualAppend', { number: choice.end.dayNumber })}
          </p>
        </div>
      ) : null}
    </div>
  )
}
