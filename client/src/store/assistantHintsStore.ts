import { create } from 'zustand';

const STORAGE_PREFIX = 'trek:assistant-hints:';
/** Ids kept per list and trip. A hint whose situation changed has a new id, so old ones only pile up. */
const MAX_KEPT = 100;

interface HintMarks {
  /** Hints the user waved away in this trip. */
  dismissed: readonly string[];
  /** Hints the user has been shown, so the launcher stops pointing at them. */
  seen: readonly string[];
}

const NONE: HintMarks = { dismissed: [], seen: [] };

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string').slice(-MAX_KEPT) : [];
}

function readMarks(tripId: number): HintMarks {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + tripId) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return NONE;
    const raw = parsed as Record<string, unknown>;
    return { dismissed: ids(raw.dismissed), seen: ids(raw.seen) };
  } catch {
    // Storage blocked or the entry unreadable: every hint counts as new.
    return NONE;
  }
}

function writeMarks(tripId: number, marks: HintMarks): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + tripId, JSON.stringify(marks));
  } catch {
    // Storage blocked: the marks still hold while the page is up.
  }
}

function withIds(list: readonly string[], added: readonly string[]): readonly string[] {
  const fresh = [...new Set(added)].filter((id) => !list.includes(id));
  return fresh.length === 0 ? list : [...list, ...fresh].slice(-MAX_KEPT);
}

interface AssistantHintsState {
  /** Per trip, once read from storage. */
  byTrip: Record<number, HintMarks>;
  load: (tripId: number) => void;
  dismiss: (tripId: number, id: string) => void;
  markSeen: (tripId: number, ids: readonly string[]) => void;
}

/**
 * Which plan hints one person has dismissed or seen, per trip, on this
 * device. A view preference like a hidden tour: nobody else sees it and it
 * never touches the trip. Mirrored to the browser's storage, so a reload
 * keeps it; without storage it lasts as long as the page.
 */
export const useAssistantHintsStore = create<AssistantHintsState>()((set, get) => {
  const update = (tripId: number, next: (marks: HintMarks) => HintMarks) => {
    const before = get().byTrip[tripId] ?? readMarks(tripId);
    const after = next(before);
    if (after === before && get().byTrip[tripId]) return;
    if (after !== before) writeMarks(tripId, after);
    set((s) => ({ byTrip: { ...s.byTrip, [tripId]: after } }));
  };
  return {
    byTrip: {},
    load: (tripId) => update(tripId, (marks) => marks),
    dismiss: (tripId, id) =>
      update(tripId, (marks) => {
        const dismissed = withIds(marks.dismissed, [id]);
        return dismissed === marks.dismissed ? marks : { ...marks, dismissed };
      }),
    markSeen: (tripId, seenIds) =>
      update(tripId, (marks) => {
        const seen = withIds(marks.seen, seenIds);
        return seen === marks.seen ? marks : { ...marks, seen };
      }),
  };
});
