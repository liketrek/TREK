import type { WatchedSourceRow } from '../../db/repositories/TourSourceHints.repository';
import type { WandererTrailLook } from '../wanderer/wanderer.service';
import { recordChangedParts } from './tours.helpers';
import type { TourSourceHintChange, TourSourceHintReason, TourSourceHintState } from '@trek/shared';

/**
 * WAN-02: the pure half of the background watch over a user's own wanderer
 * snapshots: its budget and what a look at a trail's record says.
 *
 * The budget keeps a home instance unbothered. A run asks at most
 * {@link WATCH_CONNECTIONS_PER_RUN} connections, each for at most
 * {@link WATCH_SOURCES_PER_RUN} trail records one after another (plus the two
 * small reads that name the account's own authors), and a source is looked at
 * again no sooner than {@link WATCH_RECHECK_MS} later. A failing instance is
 * left alone for longer after each failure in a row, up to
 * {@link WATCH_BACKOFF_MAX_MS}; a rate limit or an outage is such a failure.
 * Every read keeps the client's timeout and size cap.
 */
export const WATCH_CONNECTIONS_PER_RUN = 25;
export const WATCH_SOURCES_PER_RUN = 10;
export const WATCH_RECHECK_MS = 24 * 60 * 60 * 1000;
export const WATCH_BACKOFF_BASE_MS = 60 * 60 * 1000;
export const WATCH_BACKOFF_MAX_MS = 48 * 60 * 60 * 1000;

/** What a look found; a null state says nothing, least of all that nothing changed. */
export interface WatchVerdict {
  state: TourSourceHintState | null;
  changes: TourSourceHintChange[];
  reason: TourSourceHintReason | null;
}

const NOTHING_TO_SAY: WatchVerdict = { state: null, changes: [], reason: null };

function unverifiable(reason: TourSourceHintReason): WatchVerdict {
  return { state: 'unverifiable', changes: [], reason };
}

/** Two change times name the same moment, however the instance spelled them. */
function sameInstant(a: string, b: string): boolean {
  if (a === b) return true;
  const left = Date.parse(a);
  return !Number.isNaN(left) && left === Date.parse(b);
}

/**
 * What one look at a trail's record says about a snapshot. It compares with
 * what the user last saw in a manual check, else with the import:
 *
 * - a name or description that differs is proven by the record: `changed`;
 * - a change time that moved is only a suspicion: `possible_change`;
 * - a trail that is gone or no longer the user's own, or a change time
 *   missing on either side, cannot be judged: `unverifiable`;
 * - anything else says nothing. It never says "unchanged": the line may still
 *   differ, and only the manual check reads it.
 */
export function verdictOf(source: WatchedSourceRow, look: WandererTrailLook | undefined): WatchVerdict {
  if (!look || look.kind === 'gone') return unverifiable('unavailable');
  const reviewed = source.seen_hash !== null;
  const changes = recordChangedParts(source.seen_hash ?? source.content_hash, look.name, look.description);
  if (changes.length > 0) return { state: 'changed', changes, reason: null };
  const baseline = reviewed ? source.seen_updated : source.external_updated;
  if (baseline === null || look.updated === null) return unverifiable('no_change_time');
  return sameInstant(baseline, look.updated) ? NOTHING_TO_SAY : { state: 'possible_change', changes: [], reason: null };
}

/** A hint the user has not been told about yet: something to say, and not what the last look said. */
export function isNewHint(source: WatchedSourceRow, verdict: WatchVerdict): boolean {
  return verdict.state !== null && verdict.state !== source.state;
}

/** How long to leave an instance alone after this many failed runs in a row. */
export function backoffMs(failures: number): number {
  return Math.min(WATCH_BACKOFF_BASE_MS * 2 ** Math.max(failures - 1, 0), WATCH_BACKOFF_MAX_MS);
}
