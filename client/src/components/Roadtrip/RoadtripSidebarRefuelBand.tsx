import React from 'react'
import { Fuel, Milestone, Plus, RotateCcw, X, Zap } from 'lucide-react'
import MDancingTrek from '../../mobile/components/MDancingTrek'
import type { RefuelSearch } from './useRefuelSearch'
import { REFUEL_EMPTY_KEY, REFUEL_WORDS, refuelBandState, type RefuelCandidate } from './refuelSuggestion'
import type { DryPoint } from './roadtripModel'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { STOP_KIND_BY_KEY } from './stopKinds'
import { useVehicleRange } from './useVehicleRange'
import FigureBadge from './FigureBadge'
import { FS } from './typeScale'
import { DISC } from './RoadtripSidebar.constants'

/**
 * Where the tank runs out on this leg, and somewhere to do something about it.
 *
 * Sits under the drive band rather than on the stop that carries the range warning,
 * because those are two different places: the warning is filed where somebody finds out,
 * this is where the fuel actually ends. A filling station offered at the warning is one
 * the car cannot reach.
 *
 * Nothing is searched until it is asked for. Every press is a real request against a
 * shared service, which is the same reason the corridor search next door is manual.
 */
export function RefuelBand({ dry, refuel, dayId, onAsk, onAccept }: {
  dry: DryPoint & { lat: number; lng: number }
  refuel: RefuelSearch
  dayId: number
  onAsk: () => void
  onAccept?: (poi: RefuelCandidate) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  // What the traveller drives, so the band says the right word and offers the right
  // thing. An electric car does not run out of TANK, and a lamp shaped like a pump on a
  // band about a battery is the kind of detail that makes the rest look careless.
  const { vehicleKind } = useVehicleRange()
  const electric = vehicleKind === 'electric'
  const DryIcon = electric ? Zap : Fuel
  const words = REFUEL_WORDS[electric ? 'electric' : 'fuel']
  // Which control, which sentence and which offers: decided in refuelSuggestion so the
  // phone band reads the same answer instead of keeping its own copy of the conditions.
  const band = refuelBandState(refuel, dayId, dry.legIndex)

  return (
    <div className="min-w-0">
      {/* Across the whole rail, marker column included, the way the day change used to
          be drawn. It belongs to no stop: the tank runs out between two of them, and
          hanging it off the one after would put it where somebody finds out rather than
          where it happens. Full width is also what makes it the ONLY thing saying this:
          the per-stop "so far on this tank" badge stands down wherever a search can be
          run, because after the band has said where the fuel ends, every later stop
          repeating it with a bigger number is the same message again. */}
      <div
        className="my-1.5 flex flex-col gap-1 overflow-hidden rounded-xl border px-2 py-1.5"
        style={{
          borderColor: 'color-mix(in srgb, var(--danger) 22%, transparent)',
          // Danger, not warning. The rail's amber says "this is more than you asked
          // for": a day over its driving budget, a leg longer than allowed, all of
          // which are still plans that work. An empty tank is the point the drive stops
          // being possible, which is the one thing in the rail that is not a matter of
          // degree.
          //
          // The make-up is the night block's, a step quieter. That one is a break in the
          // day and can afford to lift off the card; this sits between two stops in a
          // running chain, and lit as hard it pulled the eye off everything around it.
          // Shallow tint, no drop shadow, the top edge only just catching the light.
          backgroundImage: 'linear-gradient(180deg, color-mix(in srgb, var(--danger) 11%, var(--bg-card)) 0%, color-mix(in srgb, var(--danger) 4%, var(--bg-card)) 70%, var(--bg-card) 100%)',
          boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--danger) 20%, transparent)',
          // The mascot draws itself in `--m-ink` and cuts its eyes out in `--m-bg`, so
          // both have to be named here: the ink is the band's warning colour, and the
          // ground has to be OPAQUE or the eyes show the body through them.
          '--m-ink': 'var(--danger)',
          '--m-bg': 'color-mix(in srgb, var(--danger) 11%, var(--bg-card))',
        } as React.CSSProperties}
      >
          <div className="flex items-center gap-2">
            {/* Out of fuel is a thing that happens to the DRIVE, so the mascot is the one
                with the vehicle, and it is not enjoying it. */}
            <MDancingTrek scene="transport" mood="sad" size={26} />
            <div className="min-w-0 flex-1">
              <div
                className="truncate font-geist font-semibold uppercase tracking-[0.16em] text-danger"
                style={{ fontSize: FS.label }}
              >
                {t(words.dry)}
              </div>
              {/* How far INTO this leg, where a drive band keeps its figures. Not the
                  range that was crossed: that is the traveller's own setting, says
                  nothing about where, and made every band on a day read the same
                  number. */}
              <div className="truncate tabular-nums text-content-muted" style={{ fontSize: FS.meta }}>
                {t('roadtrip.refuel.after', { distance: formatDistance(Math.round(dry.intoLegKm), distanceUnit) })}
              </div>
            </div>
            {/* The low-fuel lamp IS the button.
                It was a lamp beside a magnifier, which is the same thing said twice: the
                lamp says the tank is empty and the magnifier offers to do something
                about it, and nobody reads a dashboard warning as decoration. So the lamp
                glows, and pressing it goes looking. Larger than the 18px marks a drive
                band carries, because unlike those it is the one thing in the band worth
                pressing. What it does is in the tooltip and in the screen reader label.

                Once a search is open the lamp steps aside for the state that matters:
                the way to close the answer, or the way to ask again. An answer that
                found nothing leaves a button rather than a dead end: the place search
                is a shared public service that does time out, and "it did not answer"
                with no way to retry reads as broken rather than as busy. */}
            {band.control === 'close' ? (
              <Tooltip label={t('common.close')}>
                <button
                  type="button"
                  onClick={refuel.close}
                  aria-label={t('common.close')}
                  className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg text-content-muted transition-colors hover:bg-surface-card hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X size={13} aria-hidden />
                </button>
              </Tooltip>
            ) : (
              <Tooltip label={t(band.control === 'again' ? 'roadtrip.refuel.again' : words.find)}>
                <button
                  type="button"
                  onClick={onAsk}
                  aria-label={t(band.control === 'again' ? 'roadtrip.refuel.again' : words.find)}
                  className="group/fuel grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {band.control === 'again'
                    ? <RotateCcw size={13} strokeWidth={2} aria-hidden />
                    : (
                      /* The glow stops under the pointer: a lamp that keeps blinking
                         while it is being aimed at reads as unresponsive. */
                      <DryIcon
                        size={14}
                        strokeWidth={2}
                        className="trek-lowfuel group-hover/fuel:[animation-play-state:paused]"
                        aria-hidden
                      />
                    )}
                </button>
              </Tooltip>
            )}
          </div>

          {band.loading ? (
            <span className="text-content-muted" style={{ fontSize: FS.meta }}>{t('roadtrip.refuel.looking')}</span>
          ) : null}

          {band.offers.length ? (
              <ul className="flex flex-col gap-1">
                {/* Three at most. This is an offer beside a plan, not a list to browse;
                    the corridor panel is where somebody goes to see all of them.

                    Each one on its own surface rather than as bare text in the band: the
                    band is the problem and these are the answers, and a row somebody is
                    meant to press has to look like it can be. Two lines, because one was
                    not enough to tell them apart: measured on a real day the top three
                    came back as "Vattenfall InCharge" three times over, identical but for
                    a number nobody could see the meaning of. */}
                {band.offers.map(poi => {
                  const kind = STOP_KIND_BY_KEY[poi.category]
                  const KindIcon = kind?.Icon ?? Fuel
                  return (
                    <li key={poi.osm_id}>
                      {/* Logical padding, not left/right: the rail runs the other way in Arabic and
                          the disc has to keep its distance from the reading edge either way. */}
                      <div className="flex items-center gap-2 rounded-lg bg-surface-card py-1 pe-1.5 ps-2.5">
                        <span
                          className={`${DISC} h-[22px] w-[22px] shrink-0`}
                          style={{ background: `color-mix(in srgb, ${kind?.color ?? 'var(--danger)'} 16%, transparent)`, color: kind?.color }}
                          aria-hidden
                        >
                          <KindIcon size={12} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-content" style={{ fontSize: FS.name }}>
                            {poi.name}
                          </span>
                          {/* The two figures that decide it, in the order they decide it,
                              and as two badges rather than one line with a middot in it.
                              No value in this rail is ever joined to another that way:
                              they are separate facts, and a separator invites them to be
                              read as one number about one thing.

                              The detour is what the list is SORTED by (everything here
                              is reachable already, so what separates them is what the
                              stop costs), and it is also the only thing telling three
                              branches of one chain apart. What is left in the tank when
                              the car draws level comes second, with the detour already
                              counted into it. The badge carries the figure and the
                              tooltip says which one it is, which is how two numbers stay
                              legible in a column this narrow. */}
                          <span className="mt-0.5 flex items-center gap-1">
                            <FigureBadge
                              lead={<Milestone size={9} aria-hidden />}
                              value={formatDistance(poi.offRouteKm, distanceUnit)}
                              tooltip={t('roadtrip.poi.offRoute', { distance: formatDistance(poi.offRouteKm, distanceUnit) })}
                            />
                            <FigureBadge
                              lead={<DryIcon size={9} aria-hidden />}
                              value={formatDistance(Math.round(poi.spareKm), distanceUnit)}
                              tooltip={t('roadtrip.refuel.spare', { distance: formatDistance(Math.round(poi.spareKm), distanceUnit) })}
                            />
                          </span>
                        </span>
                        {onAccept ? (
                          <Tooltip label={t(words.add, { name: poi.name })}>
                            <button
                              type="button"
                              onClick={() => onAccept(poi)}
                              aria-label={t(words.add, { name: poi.name })}
                              className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg bg-surface-secondary text-content-secondary transition-colors hover:bg-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <Plus size={13} strokeWidth={2.2} aria-hidden />
                            </button>
                          </Tooltip>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
          ) : null}

          {/* Three different sentences for three different facts. "Nothing on this
              stretch" after a request that failed or was cut short states something
              that was never checked, which is worse than saying nothing. */}
          {band.empty ? (
            <span className="text-content-muted" style={{ fontSize: FS.meta }}>
              {t(REFUEL_EMPTY_KEY[band.empty])}
            </span>
          ) : null}
      </div>
    </div>
  )
}
