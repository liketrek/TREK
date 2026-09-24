import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { DawarichSuggestion, DawarichSuggestionTarget } from '@trek/shared'
import { useTranslation } from '../../i18n'
import DawarichIcon from '../shared/DawarichIcon'
import { SuggestionRow } from '../Dawarich/DawarichSuggestionsPanel'
import { timeRange } from '../Dawarich/dawarichSuggestionModel'
import { useSettingsStore } from '../../store/settingsStore'

/**
 * The stays Dawarich recorded on ONE day of the journal, folded into that day.
 *
 * They used to be a panel above the timeline: every open stay of every day, stacked over
 * the entries, so a fortnight of driving put forty rows between the reader and their own
 * first entry. The list belongs where the day is (discussion with Roel, 16.09.), and a
 * day of driving still produces four to eleven stays, so the day shows one line with a
 * count and opens on a tap.
 *
 * Shut, it reads as one more card in the day: the mark says where it came from without a
 * word of explanation, and the times say which part of the day it covers. Open, it is the
 * same rows the panel drew, which is why `SuggestionRow` is imported rather than copied.
 *
 * It never appears on a day with nothing pending: an integration that is connected and
 * quiet should be invisible, not a permanent empty row on every day of the journey.
 */
export default function JourneyDayDawarich({
  suggestions,
  busyId,
  onAccept,
  onDismiss,
}: {
  /** The open stays of this day, in the order they were lived. */
  suggestions: DawarichSuggestion[]
  /** The stay a write is in flight for, or null. */
  busyId: number | null
  onAccept: (suggestion: DawarichSuggestion, target: DawarichSuggestionTarget) => void
  onDismiss: (suggestion: DawarichSuggestion) => void
}): React.ReactElement | null {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const [open, setOpen] = useState(false)

  if (suggestions.length === 0) return null

  // From the first arrival to the last departure: what part of the day this covers, in
  // one line, so the row says something even while it is shut. Through the same formatter
  // the rows use, so the summary and the stays under it cannot disagree about the clock.
  const span = timeRange(suggestions[0]!.startedAt, suggestions[suggestions.length - 1]!.endedAt, is12h)

  return (
    <div className="rounded-2xl border border-edge bg-surface-secondary overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
      >
        {/* The brand mark in its own colours, which is what tells this row from an entry
            at a glance. No second label saying "Dawarich": the mark is the label. */}
        <DawarichIcon size={18} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-content">
            {/* Two keys picked by the count, the shape this codebase uses for a number
                that changes its noun: there is no plural engine in the i18n layer, and one
                key with {count} in it reads as "1 stays". */}
            {t(
              suggestions.length === 1 ? 'dawarich.journey.dayStays.one' : 'dawarich.journey.dayStays.other',
              { count: suggestions.length },
            )}
          </span>
          {span && <span className="block text-[11px] text-content-faint tabular-nums">{span}</span>}
        </span>
        {open
          ? <ChevronDown size={16} className="shrink-0 text-content-faint" aria-hidden />
          : <ChevronRight size={16} className="shrink-0 text-content-faint" aria-hidden />}
      </button>

      {open && (
        <div className="flex flex-col gap-1 pb-2">
          {suggestions.map(suggestion => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              busy={busyId === suggestion.id}
              // The journal is the one place a stay goes from here, and every row in this
              // list is already on the day it belongs to, so neither the date nor a trip
              // name adds anything.
              allowJournal
              onAccept={target => onAccept(suggestion, target)}
              onDismiss={() => onDismiss(suggestion)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
