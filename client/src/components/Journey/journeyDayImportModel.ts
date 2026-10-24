import type { JourneyDayImportRequest, JourneyDayStay } from '@trek/shared';

/**
 * What the traveller decided in the day take-over (JRN-02), before anything is
 * written: which stays, under which names, which of them belong together, and
 * whether the day becomes one report. Pure, so the dialog and the phone sheet
 * share it and the tests need no rendering.
 */
export interface DayImportChoice {
  selected: ReadonlySet<number>;
  /** Names as corrected, by suggestion id; a stay not in here keeps its recorded name. */
  names: Readonly<Record<number, string>>;
  /** Stays joined to the stay listed right before them. */
  joined: ReadonlySet<number>;
  mode: 'entries' | 'report';
  /** Titles as typed, by the key of the group they head. */
  titles: Readonly<Record<number, string>>;
  /** The stay a group is pinned to, by group key; null keeps a report off the map. */
  anchors: Readonly<Record<number, number | null>>;
}

export interface DayImportGroup {
  /** The first stay's id, or REPORT_KEY for the day report. */
  key: number;
  kind: 'single' | 'merged' | 'report';
  stays: JourneyDayStay[];
}

export const REPORT_KEY = 0;

/** Two stays this close under the same name are one place visited twice. */
const SAME_PLACE_METERS = 200;

export function isTakeable(stay: JourneyDayStay): boolean {
  return stay.status === 'open' || stay.status === 'skipped';
}

/**
 * Every open stay chosen but those Dawarich itself doubts (the car park passed
 * on the way, more often than not), and the same place twice in a row already
 * joined: the square somebody left for a coffee and came back to is one memory.
 */
export function initialChoice(stays: JourneyDayStay[]): DayImportChoice {
  const selected = new Set(
    stays
      .filter((stay) => stay.status === 'open' && !(stay.confidenceBand === 'low' && stay.sourceStatus !== 'confirmed'))
      .map((stay) => stay.suggestionId)
  );
  const joined = new Set<number>();
  stays.forEach((stay, index) => {
    const before = stays[index - 1];
    if (before && selected.has(stay.suggestionId) && selected.has(before.suggestionId) && samePlace(before, stay)) {
      joined.add(stay.suggestionId);
    }
  });
  return { selected, names: {}, joined, mode: 'entries', titles: {}, anchors: {} };
}

function samePlace(a: JourneyDayStay, b: JourneyDayStay): boolean {
  if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase()) return false;
  if (a.lat === null || a.lng === null || b.lat === null || b.lng === null) return true;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h)) <= SAME_PLACE_METERS;
}

export function nameOf(choice: DayImportChoice, stay: JourneyDayStay): string {
  return choice.names[stay.suggestionId] ?? stay.name;
}

/** Whether a stay can be joined to the one listed before it: both chosen and both free to take. */
export function canJoin(choice: DayImportChoice, stays: JourneyDayStay[], index: number): boolean {
  const stay = stays[index];
  const before = stays[index - 1];
  return (
    choice.mode === 'entries' &&
    !!stay &&
    !!before &&
    isTakeable(stay) &&
    isTakeable(before) &&
    choice.selected.has(stay.suggestionId) &&
    choice.selected.has(before.suggestionId)
  );
}

/** The entries the choice writes, in the order the day was lived. */
export function groupsOf(choice: DayImportChoice, stays: JourneyDayStay[]): DayImportGroup[] {
  const chosen = stays.filter((stay) => isTakeable(stay) && choice.selected.has(stay.suggestionId));
  if (choice.mode === 'report' && chosen.length > 1) return [{ key: REPORT_KEY, kind: 'report', stays: chosen }];
  const groups: DayImportGroup[] = [];
  stays.forEach((stay, index) => {
    if (!chosen.includes(stay)) return;
    const last = groups[groups.length - 1];
    if (last && choice.joined.has(stay.suggestionId) && canJoin(choice, stays, index)) {
      last.stays.push(stay);
      last.kind = 'merged';
    } else {
      groups.push({ key: stay.suggestionId, kind: 'single', stays: [stay] });
    }
  });
  return groups;
}

/**
 * The longest stay that has a place: where a group sits on the map unless
 * somebody picks another. A night somewhere outlasts any sight of the day, so
 * a stay that ends on the same day goes first and the hotel only when there is
 * nothing else.
 */
export function defaultAnchor(stays: JourneyDayStay[]): number | null {
  const placed = stays.filter((stay) => stay.lat !== null && stay.lng !== null);
  const sameDay = placed.filter((stay) => stay.startedAt.slice(0, 10) === stay.endedAt.slice(0, 10));
  let best: JourneyDayStay | null = null;
  for (const stay of sameDay.length > 0 ? sameDay : placed) {
    if (!best || stay.durationMinutes > best.durationMinutes) best = stay;
  }
  return best?.suggestionId ?? null;
}

/** The picked stay while it is still in the group; one unchosen or split off since falls back to the default. */
export function anchorOf(choice: DayImportChoice, group: DayImportGroup): number | null {
  const picked = choice.anchors[group.key];
  if (picked === undefined) return defaultAnchor(group.stays);
  if (picked !== null && !group.stays.some((stay) => stay.suggestionId === picked)) return defaultAnchor(group.stays);
  return picked;
}

/** A group's title as typed, else what it starts with: the place for a merged entry, the given default for a report. */
export function titleOf(choice: DayImportChoice, group: DayImportGroup, reportDefault: string): string {
  const typed = choice.titles[group.key];
  if (typed !== undefined) return typed;
  if (group.kind === 'report') return reportDefault;
  const anchor = group.stays.find((stay) => stay.suggestionId === anchorOf(choice, group)) ?? group.stays[0];
  return anchor ? nameOf(choice, anchor) : '';
}

/** Why the choice cannot be taken over yet, or null. A blank name or title would write an empty card. */
export function problemOf(
  choice: DayImportChoice,
  stays: JourneyDayStay[],
  reportDefault: string
): 'nothing' | 'name' | 'title' | null {
  const groups = groupsOf(choice, stays);
  if (groups.length === 0) return 'nothing';
  if (groups.some((group) => group.stays.some((stay) => !nameOf(choice, stay).trim()))) return 'name';
  if (groups.some((group) => group.kind !== 'single' && !titleOf(choice, group, reportDefault).trim())) return 'title';
  return null;
}

/** The take-over as the server reads it; open stays left unchosen are sent as left out. */
export function requestOf(
  choice: DayImportChoice,
  stays: JourneyDayStay[],
  reportDefault: string
): JourneyDayImportRequest {
  const groups = groupsOf(choice, stays).map((group) => {
    const named = group.stays.map((stay) => {
      const name = nameOf(choice, stay).trim();
      return name === stay.name ? { suggestionId: stay.suggestionId } : { suggestionId: stay.suggestionId, name };
    });
    if (group.kind === 'single') return { kind: group.kind, stays: named };
    const title = titleOf(choice, group, reportDefault).trim();
    const anchor = anchorOf(choice, group);
    // A merged entry of stays without a position has nothing to pin; the server then writes it without one.
    if (anchor === null && group.kind === 'merged') return { kind: group.kind, stays: named, title };
    return { kind: group.kind, stays: named, title, anchorSuggestionId: anchor };
  });
  const skipSuggestionIds = stays
    .filter((stay) => stay.status === 'open' && !choice.selected.has(stay.suggestionId))
    .map((stay) => stay.suggestionId);
  return skipSuggestionIds.length > 0 ? { groups, skipSuggestionIds } : { groups };
}

export function toggleStay(choice: DayImportChoice, id: number): DayImportChoice {
  const selected = new Set(choice.selected);
  const joined = new Set(choice.joined);
  if (selected.has(id)) {
    selected.delete(id);
    joined.delete(id);
  } else {
    selected.add(id);
  }
  return { ...choice, selected, joined };
}

export function toggleJoin(choice: DayImportChoice, id: number): DayImportChoice {
  const joined = new Set(choice.joined);
  if (joined.has(id)) joined.delete(id);
  else joined.add(id);
  return { ...choice, joined };
}

export function rename(choice: DayImportChoice, stay: JourneyDayStay, name: string): DayImportChoice {
  const names = { ...choice.names };
  if (name === stay.name) delete names[stay.suggestionId];
  else names[stay.suggestionId] = name;
  return { ...choice, names };
}
