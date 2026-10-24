import type { JourneyStats } from '@trek/shared';
import { Check, RouteOff } from 'lucide-react';
import { useState } from 'react';
import { Section } from '../StudioControls';

/**
 * The stops of the route, each switchable in or out of the figures.
 *
 * Beside the maps it changes, and not only in the entry editor: the moment
 * somebody notices the home airport on the printed route is the moment they
 * are looking at this panel. The rows carry no preview because they are not
 * things to place; they are the input every card reads.
 */

/**
 * One row: a point of the route or a stop switched off. `entryId` is null for
 * a stop the server took straight from a trip's places, which has no entry to
 * put a switch on.
 */
interface StopRow {
  entryId: number | null;
  label: string;
  date: string | null;
  country: string | null;
  excluded: boolean;
}

/**
 * Every point and every left-out stop in one sequence, by date: the question
 * the list answers is "which of these count?", and that needs them together.
 * Undated stops go last, then by name.
 */
function stopRows(stats: JourneyStats): StopRow[] {
  return [
    ...stats.points.map((p) => ({
      entryId: p.entryId,
      label: p.label,
      date: p.date,
      country: p.country,
      excluded: false,
    })),
    ...(stats.excluded ?? []).map((x) => ({
      entryId: x.entryId,
      label: x.label,
      date: x.date,
      country: null,
      excluded: true,
    })),
  ].sort((a, b) => {
    if (a.date !== b.date) {
      if (a.date == null) return 1;
      if (b.date == null) return -1;
      return a.date < b.date ? -1 : 1;
    }
    return a.label.localeCompare(b.label);
  });
}

export function TravelStops({
  stats,
  t,
  locale,
  canEdit,
  onToggleStop,
  countryName,
}: {
  stats: JourneyStats;
  t: (k: string) => string;
  locale: string;
  canEdit: boolean;
  onToggleStop: (entryId: number, excluded: boolean) => Promise<boolean>;
  countryName: (code: string) => string;
}) {
  /*
   * The stops whose switch is on its way to the server. No optimistic flip:
   * which stop is furthest and which countries remain is the server's sum, so
   * a row reads its state from the stats fetched once the change has landed,
   * and the chip is only held until then.
   */
  const [pending, setPending] = useState<Set<number>>(() => new Set());
  const stops = stopRows(stats);
  if (!stops.length) return null;
  const excludedCount = stops.filter((s) => s.excluded).length;
  // The country only where there is more than one to tell apart.
  const manyCountries = stats.countries.length > 1;
  // The day without the weekday: a row has a place name to fit as well.
  const stopDay = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });

  const toggle = async (entryId: number, excluded: boolean) => {
    setPending((prev) => new Set(prev).add(entryId));
    // A refusal is the hook's to report; here it only frees the chip again.
    await onToggleStop(entryId, excluded);
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
  };

  return (
    <Section
      label={t('journey.studio.stops')}
      hint={t('journey.studio.stopsHint')}
      // Folded, saying how many count: a fortnight is fourteen rows, and most books never touch it.
      defaultOpen={false}
      badge={`${stops.length - excludedCount}/${stops.length}`}
    >
      <ul className="st-route-stops">
        {stops.map((stop, i) => {
          const entryId = stop.entryId;
          const on = !stop.excluded;
          const state = t(on ? 'journey.studio.stopOn' : 'journey.studio.stopOff');
          const chip = `st-chip is-pick is-icon ${on ? 'is-on' : ''}`;
          // A mark rather than the word, so the column does not jitter; the word is in the title.
          const mark = on ? <Check size={13} strokeWidth={2.4} /> : <RouteOff size={13} strokeWidth={2.2} />;
          return (
            <li key={entryId ?? `place-${i}`} className={`st-route-stop ${on ? '' : 'is-off'}`}>
              {stop.date && <span className="st-badge">{stopDay(stop.date)}</span>}
              <span className="st-route-stop-label">{stop.label || t('journey.studio.untitled')}</span>
              {manyCountries && stop.country && <span className="st-badge is-quiet">{countryName(stop.country)}</span>}
              {canEdit && entryId != null ? (
                <button
                  type="button"
                  className={chip}
                  title={`${state}: ${t('journey.studio.stopToggle')}`}
                  aria-label={t('journey.studio.stopToggle')}
                  aria-pressed={on}
                  disabled={pending.has(entryId)}
                  onClick={() => void toggle(entryId, !stop.excluded)}
                >
                  {mark}
                </button>
              ) : (
                <span className={chip} title={state} aria-label={state}>
                  {mark}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
