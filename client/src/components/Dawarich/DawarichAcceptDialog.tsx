import React, { useMemo, useState } from 'react'
import { Gauge, Hourglass, CircleDashed, Star } from 'lucide-react'
import type { DawarichAccept, DawarichSuggestion, DawarichSuggestionTarget } from '@trek/shared'
import { DAWARICH_BUCKET_MATCH_MIN_MINUTES, DAWARICH_BUCKET_MATCH_RADIUS_M } from '@trek/shared'
import { useTranslation } from '../../i18n'
import Modal from '../shared/Modal'
import MSheet from '../../mobile/components/MSheet'
import { FormSheetFooter, FormSheetHeader } from '../../mobile/screens/trip/sheets/PlSheetChrome'
import { useIsPhone } from '../../mobile/useIsPhone'
import DawarichIcon from '../shared/DawarichIcon'
import DawarichBadge from './DawarichBadge'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import CustomTimePicker from '../shared/CustomTimePicker'
import CustomSelect from '../shared/CustomSelect'

export interface AcceptTargetOption {
  id: number
  label: string
  /** Secondary half of the label — a day's date beside its number. */
  badge?: string
}

export interface DawarichAcceptDialogProps {
  suggestion: DawarichSuggestion | null
  target: DawarichSuggestionTarget
  /** Trips the user may write to, for the `place` target. */
  trips?: AcceptTargetOption[]
  /** Days of the chosen trip, resolved by the caller. */
  daysForTrip?: (tripId: number) => AcceptTargetOption[]
  /** Journeys the user may edit, for the `journal` target. */
  journals?: AcceptTargetOption[]
  busy?: boolean
  onCancel: () => void
  onConfirm: (body: DawarichAccept) => void
}

/**
 * The review step: see what was recorded, correct it, then decide where it goes.
 *
 * The whole reason the integration is not a one-click import. A visit detector
 * is right most of the time and confidently wrong the rest, and the difference
 * between the two is a judgement only the traveller can make — so the values
 * are prefilled from the recording and every one of them is editable before
 * anything is written.
 *
 * What it does NOT do is offer to edit the recording. Dawarich owns that, and
 * a correction made here would be lost the next time the detector ran.
 *
 * Three targets, because `DawarichSuggestionTarget` has three. The trip and
 * journal rails open the first two; `bucket_list` is reached through MCP, where
 * an assistant can accept a stay against a wish. The branch is kept for that and
 * for the day an Atlas-side entry point wants it — the server has always been
 * able to do it, and a dialog that could only handle two of three targets would
 * be the thing that had to be fixed then.
 */
export default function DawarichAcceptDialog({
  suggestion,
  target,
  trips = [],
  daysForTrip,
  journals = [],
  busy = false,
  onCancel,
  onConfirm,
}: DawarichAcceptDialogProps): React.ReactElement | null {
  const { t, locale } = useTranslation()
  const phone = useIsPhone()

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [tripId, setTripId] = useState<number | ''>('')
  const [dayId, setDayId] = useState<number | ''>('')
  const [journalId, setJournalId] = useState<number | ''>('')
  // Re-seeded whenever a different suggestion opens the dialog, so the fields
  // always describe the row the user just pressed rather than the previous one.
  const [seededFor, setSeededFor] = useState<number | null>(null)

  if (suggestion && seededFor !== suggestion.id) {
    setSeededFor(suggestion.id)
    setName(suggestion.name)
    setNotes('')
    setDate(suggestion.localDate)
    setTime(clockOf(suggestion.startedAt))
    setEndTime(clockOf(suggestion.endedAt))
    setTripId(suggestion.tripId ?? (trips[0]?.id ?? ''))
    setDayId('')
    setJournalId(journals[0]?.id ?? '')
  }

  const days = useMemo(
    () => (typeof tripId === 'number' && daysForTrip ? daysForTrip(tripId) : []),
    [tripId, daysForTrip],
  )

  if (!suggestion) return null

  const missingTarget =
    (target === 'place' && typeof tripId !== 'number') ||
    (target === 'journal' && typeof journalId !== 'number') ||
    (target === 'bucket_list' && suggestion.matchedBucketListItemId === null)

  const confirm = () => {
    const body: DawarichAccept = { target }
    if (target === 'place') {
      if (typeof tripId === 'number') body.tripId = tripId
      if (typeof dayId === 'number') body.dayId = dayId
    }
    if (target === 'journal' && typeof journalId === 'number') body.journalId = journalId
    if (target === 'bucket_list' && suggestion.matchedBucketListItemId !== null) {
      body.bucketListItemId = suggestion.matchedBucketListItemId
    }
    if (name.trim() && name.trim() !== suggestion.name) body.name = name.trim()
    if (notes.trim()) body.notes = notes.trim()
    // Only an entry carries a date. A place lands on the day chosen below and
    // the server reads nothing else for it, so a date corrected on the journal
    // rail must not ride along when the same stay is then added as a place.
    if (target === 'journal' && date && date !== suggestion.localDate) body.date = date
    if (time) body.time = time
    if (endTime) body.endTime = endTime
    onConfirm(body)
  }

  // The same fields in both shells — only the frame around them differs.
  const fields = (
      <div className="space-y-4">
        {/* What was recorded, before anything the user changed. Kept visible so a
            corrected field can be compared against the source rather than
            replacing it invisibly. */}
        {/* What Dawarich recorded, as facts rather than as a sentence with
            separators in it: a line for when, and a row of the same badges the
            review list uses so the dialog and the list read as one thing. */}
        <div className="rounded-xl border p-3 border-edge bg-surface-secondary">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 overflow-hidden rounded-[6px]">
              <DawarichIcon size={20} />
            </span>
            <p className="min-w-0 flex-1 text-caption text-content">
              {t('dawarich.accept.recorded', {
                from: new Date(suggestion.startedAt).toLocaleString(locale),
                to: new Date(suggestion.endedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
              })}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <DawarichBadge icon={Hourglass} size="sm">
              {t('dawarich.accept.duration', { minutes: suggestion.durationMinutes })}
            </DawarichBadge>
            {/* The source's own verdict, shown here rather than on every row of
                the list: since Dawarich 1.12.0 "unconfirmed" is the normal state
                of a visit, so it says nothing in a list and something here, where
                somebody is deciding whether to trust this one. */}
            {suggestion.sourceStatus === 'suggested' && (
              <DawarichBadge icon={CircleDashed} size="sm">{t('dawarich.sourceStatus.suggested')}</DawarichBadge>
            )}
            {KNOWN_BANDS.includes(suggestion.confidenceBand ?? '') && (
              <DawarichBadge
                icon={Gauge}
                size="sm"
                tone={suggestion.confidenceBand === 'low' ? 'warning' : 'neutral'}
              >
                {t('dawarich.confidence.' + suggestion.confidenceBand)}
              </DawarichBadge>
            )}
          </div>
        </div>

        {/* Why this stay is being offered against a wish at all. The row that
            led here shows the wish's name and nothing else, which leaves the
            reader to guess what a star beside a café has to do with a museum —
            it is the rule, and the rule is short enough to state. */}
        {target === 'bucket_list' && suggestion.matchedBucketListName && (
          <p className="flex items-start gap-1.5 text-caption text-content-muted">
            <Star className="w-3 h-3 flex-shrink-0 mt-0.5 text-accent-on" />
            <span>
              {t('dawarich.suggestions.matchesWish', { name: suggestion.matchedBucketListName })}
              {' — '}
              {t('dawarich.bucket.rule', {
                meters: DAWARICH_BUCKET_MATCH_RADIUS_M,
                minutes: DAWARICH_BUCKET_MATCH_MIN_MINUTES,
              })}
            </span>
          </p>
        )}

        <div>
          <label htmlFor="dawarich-accept-name" className="block text-caption font-medium mb-1.5 text-content-secondary">
            {t('dawarich.accept.name')}
          </label>
          <input
            id="dawarich-accept-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-body focus:outline-none focus:ring-2 ring-accent border-edge bg-surface-input text-content"
          />
        </div>

        {/* TREK's own pickers, not the browser's. A native `type="date"` paints
            itself from the OS locale and a native `type="time"` ignores the 12h/24h
            setting outright (#2067) — and neither follows the colour scheme. The
            date column is the wide one because a localized date is long and a
            clock never is.

            The date is the journal rail's alone. A place has no date of its own:
            the day picker below is where it lands, and a date field beside that
            picker was a second answer to the same question, one the server never
            read. The two clocks then share the row the way they do on the place
            form. */}
        {target !== 'bucket_list' && (
          <div
            className={`grid grid-cols-1 gap-2 ${
              target === 'journal' ? 'sm:grid-cols-[minmax(0,1fr)_124px_124px]' : 'sm:grid-cols-2'
            }`}
          >
            {target === 'journal' && (
              <div>
                <span className="block text-caption font-medium mb-1.5 text-content-secondary">
                  {t('dawarich.accept.date')}
                </span>
                <CustomDatePicker value={date} onChange={setDate} />
              </div>
            )}
            <div>
              <span className="block text-caption font-medium mb-1.5 text-content-secondary">
                {t('dawarich.accept.from')}
              </span>
              <CustomTimePicker value={time} onChange={setTime} aria-label={t('dawarich.accept.from')} />
            </div>
            <div>
              <span className="block text-caption font-medium mb-1.5 text-content-secondary">
                {t('dawarich.accept.to')}
              </span>
              <CustomTimePicker value={endTime} onChange={setEndTime} aria-label={t('dawarich.accept.to')} />
            </div>
          </div>
        )}

        {/* Stacked and full width, in the order the choice is actually made: the
            day is what somebody is deciding, the trip is usually already right.
            Side by side, both pickers were half as wide as their longest option
            and the menus opened narrower than the text in them. */}
        {target === 'place' && (
          <div className="space-y-3">
            <div>
              <span className="block text-caption font-medium mb-1.5 text-content-secondary">
                {t('dawarich.accept.day')}
              </span>
              {/* Unplanned is a real answer, not a missing one: half the places on
                  a trip sit on no day, and forcing a choice here would invent one. */}
              <CustomSelect
                value={dayId === '' ? NO_DAY : dayId}
                onChange={next => setDayId(next === NO_DAY || typeof next !== 'number' ? '' : next)}
                options={[
                  { value: NO_DAY, label: t('dawarich.accept.noDay') },
                  // The date rides as the option's badge rather than inside its
                  // label: the day number is what people scan for, and the date
                  // is the confirmation they read second.
                  ...days.map(day => ({ value: day.id, label: day.label, badge: day.badge })),
                ]}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <span className="block text-caption font-medium mb-1.5 text-content-secondary">
                {t('dawarich.accept.trip')}
              </span>
              <CustomSelect
                value={tripId}
                onChange={next => { setTripId(typeof next === 'number' ? next : ''); setDayId('') }}
                options={trips.map(trip => ({ value: trip.id, label: trip.label }))}
                placeholder={t('dawarich.accept.pickTrip')}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {target === 'journal' && (
          <div>
            <span className="block text-caption font-medium mb-1.5 text-content-secondary">
              {t('dawarich.accept.journal')}
            </span>
            <CustomSelect
              value={journalId}
              onChange={next => setJournalId(typeof next === 'number' ? next : '')}
              options={journals.map(journal => ({ value: journal.id, label: journal.label }))}
              placeholder={t('dawarich.accept.pickJournal')}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {target !== 'bucket_list' && (
          <div>
            <label htmlFor="dawarich-accept-notes" className="block text-caption font-medium mb-1.5 text-content-secondary">
              {target === 'journal' ? t('dawarich.accept.story') : t('dawarich.accept.notes')}
            </label>
            <textarea
              id="dawarich-accept-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={target === 'journal' ? 5 : 3}
              placeholder={t('dawarich.accept.storyPlaceholder')}
              className="w-full px-3 py-2.5 border rounded-lg text-body resize-none focus:outline-none focus:ring-2 ring-accent border-edge bg-surface-input text-content"
            />
            {target === 'journal' && (
              <p className="mt-1 text-caption text-content-muted">{t('dawarich.accept.photosHint')}</p>
            )}
          </div>
        )}
      </div>
  )

  const title = t(`dawarich.accept.title.${target}`)

  // The phone shell has its own sheet, its own rounding and its own footer pill,
  // and every other form on it uses them. A desktop modal scaled down would be
  // the one dialog in the app that came from somewhere else.
  if (phone) {
    return (
      <MSheet open onClose={onCancel} variant="bottom" material="glass" ariaLabel={title}>
        <div className="flex max-h-[88dvh] min-h-0 flex-col">
          <FormSheetHeader
            // The mark fills the tile edge to edge, rounded like every other
            // avatar-sized badge in the shell — a small logo floating in a grey
            // square reads as a placeholder.
            leading={
              <span className="flex h-10 w-10 flex-none overflow-hidden rounded-[13px]">
                <DawarichIcon size={40} />
              </span>
            }
            title={title}
            onClose={onCancel}
            closeLabel={t('common.cancel')}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3">{fields}</div>
          <FormSheetFooter
            onCancel={onCancel}
            cancelLabel={t('common.cancel')}
            onSubmit={confirm}
            submitLabel={t(`dawarich.accept.confirm.${target}`)}
            submitDisabled={busy || missingTarget}
          />
        </div>
      </MSheet>
    )
  }

  return (
    <Modal
      isOpen
      onClose={onCancel}
      size="lg"
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-body border border-edge text-content-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || missingTarget}
            className="px-4 py-2 rounded-lg text-body font-medium bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50"
          >
            {t(`dawarich.accept.confirm.${target}`)}
          </button>
        </div>
      }
    >
      {fields}
    </Modal>
  )
}

/**
 * The bands Dawarich actually emits (>=70 high, >=40 medium, else low).
 * A band a later version adds is shown as nothing rather than as a raw English
 * word or a missing translation key.
 */
const KNOWN_BANDS = ['high', 'medium', 'low']

/**
 * "No day" as a real option value.
 *
 * CustomSelect uses strict equality on its values and treats the empty string as
 * "nothing chosen", which would make the placeholder and the deliberate answer
 * indistinguishable — and unplanned is a deliberate answer here.
 */
const NO_DAY = '__none__'

/** `HH:MM` out of an ISO timestamp, in the offset the timestamp carries. */
function clockOf(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.slice(11, 16) : ''
}
