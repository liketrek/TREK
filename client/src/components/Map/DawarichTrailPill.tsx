import { useTranslation } from '../../i18n'
import { Tooltip } from '../shared/Tooltip'
import DawarichIcon from '../shared/DawarichIcon'
import { MAP_CONTROL_SHADOW } from './mapControlShadow'
import type { DawarichTrailStatus } from './useDawarichTrail'

/**
 * Toggle for the recorded-route overlay (#2279), in the same frosted shell as
 * the compass, the layer switcher and the trip-route overview so the map's
 * controls stay one family.
 *
 * The status rides on the button rather than in a banner: the states that
 * matter — loading, nothing recorded for these dates, instance unreachable,
 * device offline — are all answers to "why is there no line", and the place
 * someone looks for that answer is the control they just pressed.
 */
export function DawarichTrailPill({
  active,
  status,
  onToggle,
}: {
  active: boolean
  status: DawarichTrailStatus
  onToggle: () => void
}) {
  const { t } = useTranslation()

  const label = !active
    ? t('dawarich.trail.show')
    : status === 'loading'
      ? t('dawarich.trail.loading')
      : status === 'empty'
        ? t('dawarich.trail.empty')
        : status === 'offline'
          ? t('dawarich.trail.offline')
          : status === 'unavailable'
            ? t('dawarich.trail.unavailable')
            : t('dawarich.trail.hide')

  // A problem worth seeing without reading the tooltip: the layer is on and
  // there is nothing to show.
  const muted = active && (status === 'empty' || status === 'offline' || status === 'unavailable')
  // Loading has to be visible too. A first fetch from somebody's own server can
  // take a while, and with nothing on the button it looked exactly like "done,
  // but no line", so testers reloaded the page to find out.
  const loading = active && status === 'loading'

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        padding: 4,
        borderRadius: 999,
        pointerEvents: 'auto',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: MAP_CONTROL_SHADOW,
      }}
    >
      {/* TREK's own tooltip: the native one is unreadable in dark mode and never
          appears on a touch device, and this control's whole job is to explain
          why there is no line. */}
      <Tooltip label={label} placement="left">
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={active}
        aria-busy={loading}
        data-testid="dawarich-trail-pill"
        style={{
          display: 'block',
          width: 34,
          height: 34,
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          padding: 0,
          // The mark fills the circle and is clipped by it, so the control reads
          // as the Dawarich button rather than as a frame with a logo in it.
          overflow: 'hidden',
          // Its own colours stay; on/off is carried by opacity, because a
          // recoloured logo is a different logo.
          opacity: muted ? 0.35 : active ? 1 : 0.6,
          transition: 'opacity 0.14s, transform 0.14s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
      >
        <DawarichIcon fill />
      </button>
      </Tooltip>
      {loading && (
        <span
          aria-hidden="true"
          data-testid="dawarich-trail-loading"
          className="motion-safe:animate-spin"
          style={{
            position: 'absolute',
            inset: 2,
            borderRadius: 999,
            border: '2px solid transparent',
            borderTopColor: 'var(--accent)',
            borderRightColor: 'var(--accent)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
