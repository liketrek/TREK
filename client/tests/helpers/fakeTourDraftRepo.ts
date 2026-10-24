/**
 * An in-memory stand-in for `repo/tourDraftRepo`, for the planner suites: a
 * draft is kept the moment the planner keeps it (no settling delay, no
 * network), read back on the next mount and gone once it is forgotten.
 * `draftStore` reads and seeds it by the key the planner's drafts were kept
 * under in local storage before they moved to the account (`tour-draft-<trip>`),
 * so a suite asks for a trip's draft as it always did.
 *
 *   vi.mock('../../../repo/tourDraftRepo', async () => ({
 *     tourDraftRepo: (await import('../../../../tests/helpers/fakeTourDraftRepo')).fakeTourDraftRepo,
 *   }));
 *
 * Clear it in `beforeEach` with `draftStore.clear()`, as a suite clears local storage.
 */
const drafts = new Map<string, string>();

const keyOf = (tripId: number | string) => `tour-draft-${tripId}`;

export const draftStore = {
  getItem: (key: string): string | null => drafts.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    drafts.set(key, value);
  },
  removeItem: (key: string): void => {
    drafts.delete(key);
  },
  clear: (): void => drafts.clear(),
  get length(): number {
    return drafts.size;
  },
};

export const fakeTourDraftRepo = {
  read: async (tripId: number | string): Promise<string | null> => drafts.get(keyOf(tripId)) ?? null,
  keep: (tripId: number | string, payload: string): void => {
    drafts.set(keyOf(tripId), payload);
  },
  flush: (): void => undefined,
  forget: async (tripId: number | string): Promise<void> => {
    drafts.delete(keyOf(tripId));
  },
};
