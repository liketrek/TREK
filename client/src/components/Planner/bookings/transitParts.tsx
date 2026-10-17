import { ArrowRight, Clock, Footprints, MoveRight } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { TransitMetaBadges, type TransitLegDisplay } from '../transitDisplay'
import { BOX, fs } from './bookingParts'

export interface TransitSummary {
  legs: TransitLegDisplay[]
  /** Seconds door to door, or null when the search did not say. */
  duration: number | null
  transfers: number
  /** Seconds on foot across the whole journey. */
  walk: number
}

/**
 * A transit journey as its metadata stores it, or null for anything else. Older
 * entries lack the transfer and walking totals, so both fall back to the legs.
 */
export function transitSummary(meta: Record<string, unknown>): TransitSummary | null {
  const transit = meta.transit as { legs?: unknown; duration?: unknown; transfers?: unknown; walk_seconds?: unknown } | undefined
  if (!transit || !Array.isArray(transit.legs)) return null
  const legs = transit.legs as TransitLegDisplay[]
  const rides = legs.filter(l => l.mode !== 'WALK').length
  const walked = legs.filter(l => l.mode === 'WALK').reduce((sum, l) => sum + (l.duration ?? 0), 0)
  return {
    legs,
    duration: typeof transit.duration === 'number' && transit.duration > 0 ? transit.duration : null,
    transfers: typeof transit.transfers === 'number' ? transit.transfers : Math.max(0, rides - 1),
    walk: typeof transit.walk_seconds === 'number' ? transit.walk_seconds : walked,
  }
}

/** A transit journey leg by leg: the line and its stops, then its facts as badges. */
export function TransitLegs({ legs, compact = false }: { legs: TransitLegDisplay[]; compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className={`${BOX} flex flex-col ${compact ? 'gap-2 px-[10px] py-2' : 'gap-3 px-3.5 py-3'}`}>
      {legs.map((leg, i) => {
        const walk = leg.mode === 'WALK'
        const mins = leg.duration ? Math.round(leg.duration / 60) : null
        return (
          <div key={i} className="flex items-start gap-2.5">
            {walk ? <Footprints size={compact ? 13 : 14} strokeWidth={2} className="mt-0.5 w-[26px] flex-none text-content-faint" /> : (
              <span className="min-w-[26px] flex-none rounded-[5px] px-1.5 py-px text-center font-bold" style={{
                ...fs(compact ? 10.5 : 11),
                background: leg.line_color || 'var(--bg-tertiary)',
                color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)', // theme-lint-disable: a transit line's own colours
              }}>{leg.line || leg.mode}</span>
            )}
            <div className={`flex min-w-0 flex-1 flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
              <div className="flex min-w-0 items-center gap-1 font-medium text-content" style={fs(compact ? 12 : 13, 'body')}>
                {walk ? <span className="truncate text-content-muted">{t('transit.walkTo', { name: leg.to?.name || '' })}</span> : (
                  <><span className="truncate">{leg.from?.name}</span><ArrowRight size={compact ? 11 : 12} strokeWidth={2} className="flex-none text-content-faint" /><span className="truncate">{leg.to?.name}</span></>
                )}
              </div>
              <TransitMetaBadges size={compact ? 'sm' : 'md'} items={[
                { icon: Clock, text: !walk && leg.from?.time ? `${leg.from.time}${leg.to?.time ? ` → ${leg.to.time}` : ''}` : '' },
                { text: mins ? t('transit.min', { count: mins }) : '', caps: true },
                { text: !walk && leg.stops ? t('transit.stops', { count: leg.stops }) : '', caps: true },
                { text: !walk && leg.from?.track ? t('transit.platform', { track: leg.from.track }) : '' },
                { icon: MoveRight, text: !walk && leg.headsign ? leg.headsign : '', dim: true },
                { text: !walk && leg.agency ? leg.agency : '', dim: true },
              ]} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
