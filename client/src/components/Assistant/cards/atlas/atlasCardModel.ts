import {
  ATLAS_CARD_CONTINENTS,
  type AtlasCardContinent,
  type AtlasStatusAfter,
  type AtlasTally,
  CONTINENT_MAP,
  type TrekCard,
} from '@trek/shared';
import { Briefcase, CalendarClock, Check, CircleDashed, Lightbulb, type LucideIcon } from 'lucide-react';

import type { PillTone } from '../../../Planner/planParts';
import type { ChangeItem } from '../../assistantParts';

/**
 * The pure side of the atlas cards: how a status and a continent are named,
 * how many flags and wish tiles fit the chat, a wish's month, and the counters
 * a run of atlas changes moves (countries visited, regions of a country, the
 * bucket list) as the user ticks rows on and off, applies or discards them.
 */

/** How a country's or a region's standing reads. A table, so each word is named where it is read. */
export const STATUS_LOOK: Readonly<Record<AtlasStatusAfter, { Icon: LucideIcon; tone: PillTone; labelKey: string }>> = {
  visited: { Icon: Check, tone: 'success', labelKey: 'assistant.card.atlas.status.visited' },
  planned: { Icon: CalendarClock, tone: 'info', labelKey: 'assistant.card.atlas.status.planned' },
  idea: { Icon: Lightbulb, tone: 'neutral', labelKey: 'assistant.card.atlas.status.idea' },
  none: { Icon: CircleDashed, tone: 'neutral', labelKey: 'assistant.card.atlas.status.none' },
  unknown: { Icon: Briefcase, tone: 'info', labelKey: 'assistant.card.atlas.status.unknown' },
};

/** The continents in the Atlas page's own words. */
export const CONTINENT_LABEL: Readonly<Record<AtlasCardContinent, { labelKey: string }>> = {
  Europe: { labelKey: 'atlas.europe' },
  Asia: { labelKey: 'atlas.asia' },
  'North America': { labelKey: 'atlas.northAmerica' },
  'South America': { labelKey: 'atlas.southAmerica' },
  Africa: { labelKey: 'atlas.africa' },
  Oceania: { labelKey: 'atlas.oceania' },
  Antarctica: { labelKey: 'atlas.antarctica' },
  Other: { labelKey: 'atlas.other' },
};

/** The continent a country lies on, as the Atlas counts it. */
export function continentOf(code: string): AtlasCardContinent {
  const name = CONTINENT_MAP[code];
  return (ATLAS_CARD_CONTINENTS as readonly string[]).includes(name ?? '') ? (name as AtlasCardContinent) : 'Other';
}

/** How many flags and wish tiles a card shows: more where the chat has room. */
export function densityLimits(roomy: boolean): { flags: number; wishes: number } {
  return roomy ? { flags: 24, wishes: 9 } : { flags: 16, wishes: 6 };
}

/** "May 2027" for a month or a day, the year alone for a year; null for none. */
export function wishMonth(targetDate: string | null, locale: string): string | null {
  if (!targetDate) return null;
  const [year, month] = targetDate.split('-').map(Number);
  if (!year) return null;
  if (!month) return String(year);
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(year, month - 1, 1))
    );
  } catch {
    return targetDate;
  }
}

/** "3 Apr 2024" from `YYYY-MM-DD`; anything else as it came. */
export function shortDay(isoDay: string, locale: string): string {
  const [year, month, day] = isoDay.split('-').map(Number);
  if (!year || !month || !day) return isoDay;
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(year, month - 1, day))
    );
  } catch {
    return isoDay;
  }
}

/** Where a counter stands in a run of changes: waiting, being applied, applied. */
type TallyPhase = 'pending' | 'applying' | 'applied';

/** One counter a run of atlas changes moves. */
export interface TallyLine {
  key: string;
  what: 'countries' | 'regions' | 'wishes';
  /** The country of a regions counter. */
  country: string | null;
  before: number;
  after: number;
  phase: TallyPhase;
}

/** The counter one change moves, which one, and what it counts on it (a country, a region; null: the change itself). */
interface Counted {
  key: string;
  what: TallyLine['what'];
  country: string | null;
  subject: string | null;
  tally: AtlasTally;
}

/** The counters one card moves. */
function countedOf(card: TrekCard): Counted[] {
  if (card.kind === 'atlasCountry' && card.change) {
    const { countries, regions, region } = card.change;
    const counted: Counted[] = [];
    if (countries) {
      counted.push({ key: 'countries', what: 'countries', country: null, subject: card.code, tally: countries });
    }
    if (regions && region) {
      const key = `regions-${card.code}`;
      counted.push({ key, what: 'regions', country: card.code, subject: region.code, tally: regions });
    }
    return counted;
  }
  if (card.kind === 'atlasBucket' && card.change?.wishes) {
    return [{ key: 'wishes', what: 'wishes', country: null, subject: null, tally: card.change.wishes }];
  }
  return [];
}

/** A change that will not land: discarded, expired or failed. */
function settled(item: ChangeItem): boolean {
  return item.state === 'discarded' || item.state === 'expired' || item.state === 'failed';
}

/** One counter while a run is read: the exact count a write answered, what each subject still moves, what landed. */
interface Building {
  line: TallyLine;
  exact: number | null;
  moves: Map<string, number>;
  landed: Set<string>;
}

/** What the waiting moves add up to: each country or region once, by one at most either way, none that landed. */
function movedBy({ moves, landed }: Building): number {
  let moved = 0;
  for (const [subject, delta] of moves) {
    if (!landed.has(subject)) moved += Math.max(-1, Math.min(1, delta));
  }
  return moved;
}

/**
 * The counters a run of atlas changes moves. Waiting, a counter starts where
 * the first change found it and moves by what the changes still ticked on do
 * (a change whose outcome the trips decide moves it by nothing until it is
 * applied). Every change was predicted from the same reading, so a country or
 * a region counts once: marking Japan and Tokyo, or Japan twice, is one more
 * country. Applied, it shows the last exact count a write answered, and a
 * country or region that landed moves it no further. A counter whose changes
 * were all discarded or expired is left out.
 */
export function tallyLines(items: readonly ChangeItem[], excluded: ReadonlySet<string>): TallyLine[] {
  const built = new Map<string, Building>();
  for (const item of items) {
    if (!item.card || settled(item)) continue;
    for (const counted of countedOf(item.card)) {
      const entry = built.get(counted.key) ?? {
        line: {
          key: counted.key,
          what: counted.what,
          country: counted.country,
          before: counted.tally.before,
          after: counted.tally.before,
          phase: 'pending' as TallyPhase,
        },
        exact: null,
        moves: new Map<string, number>(),
        landed: new Set<string>(),
      };
      const subject = counted.subject ?? item.toolCallId;
      if (item.state === 'applied') {
        if (counted.tally.after !== null) entry.exact = counted.tally.after;
        entry.landed.add(subject);
        if (entry.line.phase !== 'applying') entry.line.phase = 'applied';
      } else {
        if (item.state === 'applying' || entry.line.phase === 'applied') entry.line.phase = 'applying';
        if (!excluded.has(item.toolCallId) && counted.tally.after !== null) {
          entry.moves.set(subject, (entry.moves.get(subject) ?? 0) + counted.tally.after - counted.tally.before);
        }
      }
      built.set(counted.key, entry);
    }
  }
  return [...built.values()].map((entry) => ({
    ...entry.line,
    after: Math.max(0, (entry.exact ?? entry.line.before) + movedBy(entry)),
  }));
}

/** "+2" or "-1" for what a counter moved by; empty when it did not move. */
export function signedDelta(delta: number, locale: string): string {
  if (delta === 0) return '';
  try {
    return new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' }).format(delta);
  } catch {
    return delta > 0 ? `+${delta}` : String(delta);
  }
}
