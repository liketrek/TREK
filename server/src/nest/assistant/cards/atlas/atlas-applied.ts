import type { ToolArgs, ToolCards, UndoSnapshot } from '../card-types';
import { idIn, readKey, recordOf } from '../card-values';
import { countOf, entryOf, statusOf } from './atlas-values';
import type { AssistantChangePreview, AtlasBucketCard, AtlasCountryCard, AtlasStatusAfter } from '@trek/shared';

/**
 * The cards of applied atlas changes, which take the place of the change
 * cards beside their receipts: the country with where it really stands now
 * and the exact counters (the mark tools answer `after`), a wish with the id
 * it was stored under. And the way back from an added wish: deleting it,
 * as long as it still reads as it was added.
 */

type AppliedInput = { args: ToolArgs; result: unknown; preview: AssistantChangePreview | null };

function countryCardOf(preview: AssistantChangePreview | null): AtlasCountryCard | null {
  const card = preview?.card;
  return card?.kind === 'atlasCountry' ? card : null;
}

function bucketCardOf(preview: AssistantChangePreview | null): AtlasBucketCard | null {
  const card = preview?.card;
  return card?.kind === 'atlasBucket' ? card : null;
}

/** A country change with the counters the write answered; the preview's prediction where it answered none. */
function appliedCountry({ result, preview }: AppliedInput, region: 'mark' | 'unmark' | null): AtlasCountryCard | null {
  const card = countryCardOf(preview);
  const change = card?.change;
  if (!card || !change) return null;
  const after = recordOf(recordOf(result).after);
  if (Object.keys(after).length === 0) return card;
  const status: AtlasStatusAfter = statusOf(after.country_status) ?? 'none';
  const visited = countOf(after.countries_visited);
  const regionsLeft = after.regions_visited === undefined ? null : countOf(after.regions_visited);
  const regionAfter: AtlasStatusAfter = region === 'mark' ? 'visited' : 'none';
  return {
    ...card,
    change: {
      ...change,
      after: status,
      countries: change.countries ? { before: change.countries.before, after: visited } : null,
      region: change.region && region ? { ...change.region, after: regionAfter } : change.region,
      regions:
        change.regions && regionsLeft !== null ? { before: change.regions.before, after: regionsLeft } : change.regions,
    },
  };
}

/** An added or changed wish as it was stored, with its id; the counter from the preview. */
function appliedWish({ result, preview }: AppliedInput, op: 'add' | 'update'): AtlasBucketCard | null {
  const entry = entryOf(recordOf(result).item, { fromResult: true });
  if (!entry) return null;
  const change = bucketCardOf(preview)?.change ?? null;
  const wishes = change?.wishes ?? null;
  return {
    kind: 'atlasBucket',
    items: [entry],
    more: 0,
    change: {
      op,
      before: op === 'update' ? (change?.before ?? null) : null,
      duplicate: false,
      // The add landed, so the list grew by one whatever the preview foresaw.
      wishes: wishes && op === 'add' ? { before: wishes.before, after: wishes.before + 1 } : wishes,
    },
  };
}

export const ATLAS_APPLIED = {
  mark_country_visited: (input: AppliedInput) => appliedCountry(input, null),
  unmark_country_visited: (input: AppliedInput) => appliedCountry(input, null),
  mark_region_visited: (input: AppliedInput) => appliedCountry(input, 'mark'),
  unmark_region_visited: (input: AppliedInput) => appliedCountry(input, 'unmark'),
  create_bucket_list_item: (input: AppliedInput) => appliedWish(input, 'add'),
  update_bucket_list_item: (input: AppliedInput) => appliedWish(input, 'update'),
  // A removed wish reads as the change card showed it.
  delete_bucket_list_item: ({ preview }: AppliedInput) => bucketCardOf(preview),
};

const BUCKET_READ = { tool: 'list_bucket_list', args: {} };

/**
 * An added wish, still as it was added: on the list under its id with the
 * name, country, region, date and notes it was created with, and not reached
 * since. A wish edited or ticked off meanwhile is kept.
 */
function wishUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const added = recordOf(recordOf(result).item);
  const id = idIn(result, 'item');
  const items = recordOf(snapshot.reads.get(readKey(BUCKET_READ.tool, BUCKET_READ.args))).items;
  if (id === null || !Array.isArray(items)) return false;
  const current = items.map(recordOf).find((row) => row.id === id);
  if (!current || current.visited_at) return false;
  return (['name', 'country_code', 'region_code', 'target_date', 'notes', 'lat', 'lng'] as const).every(
    (key) => (current[key] ?? null) === (added[key] ?? null),
  );
}

/** An added wish taken back by deleting it. */
export const DELETE_ADDED_WISH: NonNullable<ToolCards['undo']> = {
  tool: 'delete_bucket_list_item',
  args: (_args, result) => {
    const itemId = idIn(result, 'item');
    return itemId ? { itemId } : null;
  },
  reads: () => [BUCKET_READ],
  unchanged: wishUnchanged,
};
