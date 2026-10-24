import React, { useState } from 'react'
import { ChevronDown, ChevronRight, ListChecks } from 'lucide-react'
import type { DawarichSuggestion, DawarichSuggestionTarget } from '@trek/shared'
import { useTranslation } from '../../i18n'
import DawarichIcon from '../shared/DawarichIcon'
import { fs } from '../shared/DialogShell'
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
  onTakeOverDay,
}: {
  /** The open stays of this day, in the order they were lived. */
  suggestions: DawarichSuggestion[]
  /** The stay a write is in flight for, or null. */
  busyId: number | null
  onAccept: (suggestion: DawarichSuggestion, target: DawarichSuggestionTarget) => void
  onDismiss: (suggestion: DawarichSuggestion) => void
  /** Review the whole day with its stays and route instead of one stay at a time (JRN-02). */
  onTakeOverDay?: () => void
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
      <div className="flex items-center">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-start transition-colors hover:bg-surface-hover"
      >
        {/* The brand mark in its own colours, which is what tells this row from an entry
            at a glance. No second label saying "Dawarich": the mark is the label. */}
        <DawarichIcon size={18} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-content">
            {t('dawarich.journey.dayStays', { count: suggestions.length })}
          </span>
          {span && <span className="block text-[11px] text-content-faint tabular-nums">{span}</span>}
        </span>
        {open
          ? <ChevronDown size={16} className="shrink-0 text-content-faint" aria-hidden />
          : <ChevronRight size={16} className="shrink-0 text-content-faint" aria-hidden />}
      </button>
      {/* The whole day at once, beside the row: choosing, joining and naming
          its stays together beats accepting them one by one. */}
      {onTakeOverDay && (
        <button
          type="button"
          onClick={onTakeOverDay}
          className="me-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 font-semibold text-accent-text transition-opacity hover:opacity-90"
          style={fs(12, 'body')}
        >
          <ListChecks size={14} aria-hidden />
          {t('journey.dayImport.open')}
        </button>
      )}
      </div>

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
