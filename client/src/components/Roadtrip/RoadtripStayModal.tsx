import React, { useEffect, useMemo, useState } from 'react'
import { Hourglass, Minus, Plus, ArrowRight } from 'lucide-react'
import Modal from '../shared/Modal'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDurationShort, formatClock, parseClock } from './roadtripModel'
import { formatClockTime } from '../../utils/formatters'

/**
 * The lengths a stop usually takes, so the common answer is one tap.
 *
 * Kept short on purpose: a longer list reads as a form, and anything not on it is what
 * the slider is for.
 */
const PRESETS = [15, 30, 45, 60, 90, 120]

/** As far as the slider goes, in minutes. Beyond four hours it is a day, not a stop. */
const MAX = 240
/** The step the slider and the two buttons move in. */
const STEP = 5

/** The stop being given a length. */
export interface StayDraft {
  placeId: number
  name: string
  minutes: number | null
  /** When the drive gets here, so the dialog can show what the stay pushes back. */
  arrival?: string | null
}

interface RoadtripStayModalProps {
  stop: StayDraft | null
  onClose: () => void
  /** Zero clears it: the rail reads "no stay" and "nothing planned" as the same thing. */
  onSave: (placeId: number, minutes: number) => Promise<void> | void
}

/** The slider's own track and thumb, drawn from tokens so both themes get it right. */
const SLIDER = [
  'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-tertiary',
  '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-card',
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg-card)]',
  '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:border-0',
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent',
].join(' ')

/**
 * How long the traveller stays at one stop.
 *
 * A road-trip idea rather than a property of the place: it is what pushes every later
 * arrival back, so it belongs beside the drive times rather than in the place form, which
 * is why this opens from the rail and nowhere else.
 *
 * Built around the number instead of around a field. The chosen length is the largest
 * thing on screen and updates as the slider moves, and under it the dialog answers the
 * question the number is actually being chosen for: given when the drive arrives, when
 * does it leave again. Typing minutes into a box could never show that.
 *
 * The value is `places.duration_minutes`, which the schedule has read for years and
 * nothing has ever been able to write. Cleared as a zero rather than a null, because the
 * update statement folds a null into "leave it alone" — a null could give a stop a stay
 * but never take one away.
 */
export default function RoadtripStayModal({ stop, onClose, onSave }: RoadtripStayModalProps): React.ReactElement | null {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const [minutes, setMinutes] = useState(0)
  const [saving, setSaving] = useState(false)

  // Reopened on a different stop, so it starts from that stop's own value rather than
  // from whatever the last one was left on.
  useEffect(() => { setMinutes(stop?.minutes ?? 0) }, [stop])

  // What the stay does to the day, worked out live: the arrival is fixed by the drive,
  // the departure is the only thing this dialog moves.
  const times = useMemo(() => {
    const arrival = parseClock(stop?.arrival)
    if (arrival === null) return null
    return {
      arrive: formatClockTime(formatClock(arrival), is12h),
      leave: formatClockTime(formatClock(arrival + minutes), is12h),
    }
  }, [stop?.arrival, minutes, is12h])

  if (!stop) return null

  const commit = async (value: number) => {
    if (saving) return
    setSaving(true)
    try {
      await onSave(stop.placeId, value)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const nudge = (delta: number) => setMinutes(m => Math.min(MAX, Math.max(0, m + delta)))

  return (
    <Modal isOpen onClose={onClose} size="sm" title={
      <span className="flex items-center gap-2">
        <Hourglass size={15} className="text-content-faint" aria-hidden />
        {t('roadtrip.stop.stay')}
      </span>
    }>
      <div className="flex flex-col gap-5">
        <p className="break-words text-center text-caption text-content-muted">{stop.name}</p>

        {/* The number, the way a timer shows one. Minus and plus flank it so a value can
            be nudged without hunting for the slider's thumb. */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => nudge(-STEP)}
            disabled={minutes === 0}
            aria-label={`-${STEP}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-edge text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-30"
          >
            <Minus size={15} aria-hidden />
          </button>
          <span
            aria-live="polite"
            className="min-w-[8rem] text-center text-title font-semibold tabular-nums tracking-tight text-content"
          >
            {minutes > 0 ? formatDurationShort(minutes * 60) : t('roadtrip.stay.none')}
          </span>
          <button
            type="button"
            onClick={() => nudge(STEP)}
            disabled={minutes >= MAX}
            aria-label={`+${STEP}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-edge text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-30"
          >
            <Plus size={15} aria-hidden />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={MAX}
          step={STEP}
          value={minutes}
          onChange={e => setMinutes(Number(e.target.value))}
          aria-label={t('roadtrip.stay.custom')}
          className={SLIDER}
        />

        {/* What the stay costs the rest of the day. The arrival cannot move — the drive
            decides it — so the arrow shows the one end this dialog does move. */}
        {times ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-edge-faint bg-surface-secondary px-3 py-2.5">
            <span className="flex flex-col items-center gap-0.5">
              <span className="font-geist text-caption font-semibold uppercase tracking-[0.12em] text-content-faint">
                {t('roadtrip.stay.arrive')}
              </span>
              <span dir="ltr" className="text-body font-semibold tabular-nums text-content-secondary">{times.arrive}</span>
            </span>
            <ArrowRight size={14} className="mt-3 shrink-0 text-content-faint" aria-hidden />
            <span className="flex flex-col items-center gap-0.5">
              <span className="font-geist text-caption font-semibold uppercase tracking-[0.12em] text-content-faint">
                {t('roadtrip.stay.leave')}
              </span>
              <span dir="ltr" className="text-body font-semibold tabular-nums text-content">{times.leave}</span>
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-1.5">
          {PRESETS.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setMinutes(value)}
              className={`rounded-full border px-3 py-1 text-caption font-medium tabular-nums transition-colors ${
                minutes === value
                  ? 'border-accent bg-accent text-accent-text'
                  : 'border-edge bg-surface-card text-content-secondary hover:border-content-faint'
              }`}
            >
              {formatDurationShort(value * 60)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {/* Removing is the same write as setting one, so it sits with the other actions
            rather than behind a confirmation. */}
        <button
          type="button"
          disabled={saving || !stop.minutes}
          onClick={() => void commit(0)}
          className="rounded-lg px-3 py-2 text-caption font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content disabled:opacity-40"
        >
          {t('roadtrip.stay.none')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ms-auto rounded-lg border border-edge px-3 py-2 text-caption font-medium text-content-secondary transition-colors hover:bg-surface-hover"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void commit(minutes)}
          className="rounded-lg bg-accent px-4 py-2 text-caption font-semibold text-accent-text transition-opacity disabled:opacity-40"
        >
          {t('common.save')}
        </button>
      </div>
    </Modal>
  )
}
