import type { CardReader, Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, finite } from '../card-values';
import { localeOf, Rows, text } from '../preview-format';
import {
  argText,
  atlasSnapshotOf,
  bucketSnapshotOf,
  countryCodeOf,
  entryOf,
  identityOf,
  regionCodeOf,
  regionsSnapshotOf,
  sameWish,
  targetDateOf,
  visitedRegionsIn,
  type AtlasSnapshot,
  type BucketSnapshot,
  type CountryStanding,
  type RegionEntry,
} from './atlas-values';
import type {
  AtlasBucketCard,
  AtlasBucketEntry,
  AtlasCountryCard,
  AtlasStatusAfter,
  AtlasTally,
  TrekCard,
  VisitStatus,
} from '@trek/shared';

/**
 * The change cards of the atlas writes, drawn before the user decides: the
 * country (or region) with its flag, where it stands now and after, and how
 * the visited counters move; a wish of the bucket list as it will be added,
 * changed or removed, and how long the list gets. A mark or a bucket change is
 * predicted exactly; an unmark of a country the user's trips put on the map,
 * and the unmark of a country's last region, stay `unknown` until applied,
 * since the trips decide (the applied card is exact). The subject names the
 * country in the user's language instead of its code.
 */

/** What a change card is predicted from, read once per turn; null where a read failed. */
export interface AtlasLoaded {
  atlas: AtlasSnapshot | null;
  regions: ReadonlyMap<string, RegionEntry> | null;
  bucket: BucketSnapshot | null;
}

const NOTHING: AtlasLoaded = { atlas: null, regions: null, bucket: null };

export async function loadAtlas(_args: ToolArgs, read: CardReader): Promise<AtlasLoaded> {
  return { ...NOTHING, atlas: atlasSnapshotOf(await read('get_atlas_stats')) };
}

export async function loadAtlasRegions(_args: ToolArgs, read: CardReader): Promise<AtlasLoaded> {
  const [atlas, regions] = await Promise.all([read('get_atlas_stats'), read('list_visited_regions')]);
  return { ...NOTHING, atlas: atlasSnapshotOf(atlas), regions: regionsSnapshotOf(regions) };
}

export async function loadBucket(_args: ToolArgs, read: CardReader): Promise<AtlasLoaded> {
  return { ...NOTHING, bucket: bucketSnapshotOf(await read('list_bucket_list')) };
}

/** A country's name in the user's language; its code where the runtime has none. */
export function countryNameIn(ctx: Pick<PreviewContext, 'locale'>, code: string): string {
  try {
    return new Intl.DisplayNames([localeOf(ctx)], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The empty country a change card starts from: no trips or places listed, the change carries the story. */
function countryCard(code: string, entry: CountryStanding | undefined) {
  return {
    kind: 'atlasCountry' as const,
    code,
    status: entry?.status ?? null,
    markedBy: null,
    placeCount: entry?.placeCount ?? null,
    tripCount: entry?.tripCount ?? null,
    trips: [],
    moreTrips: 0,
    places: [],
    morePlaces: 0,
  };
}

function tally(before: number, after: number | null): AtlasTally {
  return { before, after: after === null ? null : Math.max(0, after) };
}

function markCountry(args: ToolArgs, loaded: AtlasLoaded | null): AtlasCountryCard | null {
  const code = countryCodeOf(args.country_code);
  if (!code) return null;
  const atlas = loaded?.atlas ?? null;
  const entry = atlas?.countries.get(code);
  const countries = atlas ? tally(atlas.visited, atlas.visited + (entry?.status === 'visited' ? 0 : 1)) : null;
  return {
    ...countryCard(code, entry),
    change: { op: 'mark', region: null, after: 'visited', countries, regions: null },
  };
}

/**
 * Where an unmarked country ends up. The tombstone hides what a mark or a
 * booking put on the map; a country with places of the user's trips stays,
 * at whatever status those trips give it.
 */
function unmarkCountry(args: ToolArgs, loaded: AtlasLoaded | null): AtlasCountryCard | null {
  const code = countryCodeOf(args.country_code);
  if (!code) return null;
  const atlas = loaded?.atlas ?? null;
  const entry = atlas?.countries.get(code);
  let after: AtlasStatusAfter = 'none';
  let visitedAfter: number | null = atlas?.visited ?? null;
  if (entry && entry.placeCount > 0) {
    after = entry.status === 'visited' ? 'unknown' : entry.status;
    if (entry.status === 'visited') visitedAfter = null;
  } else if (entry?.status === 'visited' && atlas) visitedAfter = atlas.visited - 1;
  return {
    ...countryCard(code, entry),
    change: {
      op: 'unmark',
      region: null,
      after,
      countries: atlas ? tally(atlas.visited, visitedAfter) : null,
      regions: null,
    },
  };
}

function markRegion(args: ToolArgs, loaded: AtlasLoaded | null): AtlasCountryCard | null {
  const code = countryCodeOf(args.countryCode);
  const regionCode = regionCodeOf(args.regionCode);
  if (!code || !regionCode) return null;
  const country = markCountry({ country_code: code }, loaded);
  const regions = loaded?.regions ?? null;
  const before: VisitStatus | null = regions?.get(regionCode)?.status ?? null;
  const visited = regions ? visitedRegionsIn(regions, code) : null;
  if (!country?.change) return null;
  return {
    ...country,
    change: {
      ...country.change,
      region: { code: regionCode, name: argText(args.regionName, 80) ?? regionCode, before, after: 'visited' },
      regions: visited === null ? null : tally(visited, visited + (before === 'visited' ? 0 : 1)),
    },
  };
}

/**
 * The unmark of a region. Its country is read from the regions, else from the
 * code. Taking a country's last region away may take the country along
 * (unless it was marked itself), so the country's fate stays `unknown` then.
 */
function unmarkRegion(args: ToolArgs, loaded: AtlasLoaded | null): AtlasCountryCard | null {
  const regionCode = regionCodeOf(args.regionCode);
  if (!regionCode) return null;
  const regions = loaded?.regions ?? null;
  const known = regions?.get(regionCode);
  const code = known?.country ?? regionCode.slice(0, 2);
  const atlas = loaded?.atlas ?? null;
  const entry = atlas?.countries.get(code);
  const visited = regions ? visitedRegionsIn(regions, code) : null;
  const left = visited === null ? null : visited - (known?.status === 'visited' ? 1 : 0);
  const cascades = left === null || left <= 0;
  const after: AtlasStatusAfter = cascades ? 'unknown' : (entry?.status ?? 'none');
  const countries = atlas ? tally(atlas.visited, cascades ? null : atlas.visited) : null;
  return {
    ...countryCard(code, entry),
    change: {
      op: 'unmark',
      region: { code: regionCode, name: known?.name ?? regionCode, before: known?.status ?? null, after: 'none' },
      after,
      countries,
      regions: visited === null ? null : tally(visited, left),
    },
  };
}

function bucketCard(entry: AtlasBucketEntry, change: NonNullable<AtlasBucketCard['change']>): AtlasBucketCard {
  return { kind: 'atlasBucket', items: [entry], more: 0, change };
}

function createWish(args: ToolArgs, loaded: AtlasLoaded | null): AtlasBucketCard | null {
  const entry = entryOf({ ...args, id: null, visited_at: null }, { fromResult: false });
  if (!entry) return null;
  const bucket = loaded?.bucket ?? null;
  const identity = identityOf(args, { upperCountry: true });
  const duplicate = bucket ? [...bucket.wishes.values()].some((wish) => sameWish(wish.identity, identity)) : false;
  const wishes = bucket ? tally(bucket.size, bucket.size + (duplicate ? 0 : 1)) : null;
  return bucketCard(entry, { op: 'add', before: null, duplicate, wishes });
}

/** The wish as it will read once changed: only the fields the call sets move. */
function changedWish(args: ToolArgs, before: AtlasBucketEntry): AtlasBucketEntry {
  const countryCode = args.country_code !== undefined ? countryCodeOf(args.country_code) : before.countryCode;
  const region = before.regionCode;
  return {
    ...before,
    name: argText(args.name, 120) ?? before.name,
    notes: args.notes !== undefined ? argText(args.notes, 200) : before.notes,
    countryCode,
    regionCode: region && countryCode && region.startsWith(`${countryCode}-`) ? region : null,
    targetDate: args.target_date !== undefined ? targetDateOf(args.target_date) : before.targetDate,
  };
}

function updateWish(args: ToolArgs, loaded: AtlasLoaded | null): AtlasBucketCard | null {
  const id = argId(args, 'itemId');
  const bucket = loaded?.bucket ?? null;
  const current = id === null ? undefined : bucket?.wishes.get(id);
  if (!bucket || !current) return null;
  // A blank name leaves the stored one, as the service's `name?.trim() || item.name` does.
  const named = typeof args.name === 'string' && args.name.trim() !== '' ? args.name : null;
  const next = identityOf({
    name: named ?? current.identity.name,
    country_code: args.country_code !== undefined ? args.country_code : current.identity.country,
    target_date: args.target_date !== undefined ? args.target_date : current.identity.target,
    lat: args.lat !== undefined ? finite(args.lat) : current.identity.lat,
    lng: args.lng !== undefined ? finite(args.lng) : current.identity.lng,
  });
  const duplicate = [...bucket.wishes].some(([other, wish]) => other !== id && sameWish(wish.identity, next));
  return bucketCard(changedWish(args, current.entry), { op: 'update', before: current.entry, duplicate, wishes: null });
}

function deleteWish(args: ToolArgs, loaded: AtlasLoaded | null): AtlasBucketCard | null {
  const id = argId(args, 'itemId');
  const bucket = loaded?.bucket ?? null;
  const current = id === null ? undefined : bucket?.wishes.get(id);
  if (!bucket || !current) return null;
  return bucketCard(current.entry, {
    op: 'remove',
    before: current.entry,
    duplicate: false,
    wishes: tally(bucket.size, bucket.size - 1),
  });
}

type ChangeBuilder = (ctx: PreviewContext, args: ToolArgs, loaded: AtlasLoaded | null) => TrekCard | null;

/** The change cards by tool. */
export const ATLAS_CHANGES = {
  mark_country_visited: (_ctx, args, loaded) => markCountry(args, loaded),
  unmark_country_visited: (_ctx, args, loaded) => unmarkCountry(args, loaded),
  mark_region_visited: (_ctx, args, loaded) => markRegion(args, loaded),
  unmark_region_visited: (_ctx, args, loaded) => unmarkRegion(args, loaded),
  create_bucket_list_item: (_ctx, args, loaded) => createWish(args, loaded),
  update_bucket_list_item: (_ctx, args, loaded) => updateWish(args, loaded),
  delete_bucket_list_item: (_ctx, args, loaded) => deleteWish(args, loaded),
} satisfies Readonly<Record<string, ChangeBuilder>>;

/** The words of a country change: the country by its name, under the tool's own label. */
function describeCountry(tool: string, ctx: PreviewContext, args: ToolArgs): Described {
  const code = countryCodeOf(args.country_code);
  return {
    subject: code ? countryNameIn(ctx, code) : text(args.country_code),
    rows: new Rows(),
    dayId: null,
    placeIds: [],
    tool,
    domain: 'atlas',
  };
}

function describeRegion(tool: string, ctx: PreviewContext, args: ToolArgs, loaded: AtlasLoaded | null): Described {
  const regionCode = regionCodeOf(args.regionCode);
  const known = regionCode ? loaded?.regions?.get(regionCode) : undefined;
  const country = countryCodeOf(args.countryCode) ?? known?.country ?? (regionCode ? regionCode.slice(0, 2) : null);
  const name = argText(args.regionName, 80) ?? known?.name ?? regionCode ?? text(args.regionCode);
  return {
    subject: name,
    rows: new Rows().add('location', country ? countryNameIn(ctx, country) : ''),
    dayId: null,
    placeIds: [],
    tool,
    domain: 'atlas',
  };
}

function describeWish(tool: string, ctx: PreviewContext, args: ToolArgs, loaded: AtlasLoaded | null): Described {
  const id = argId(args, 'itemId');
  const before = id === null ? undefined : loaded?.bucket?.wishes.get(id)?.entry;
  const country = countryCodeOf(args.country_code);
  const rows = new Rows();
  if (tool === 'update_bucket_list_item') {
    if (typeof args.name === 'string') rows.change('name', before?.name ?? null, text(args.name));
    if (args.notes !== undefined) rows.change('notes', before?.notes ?? null, text(args.notes));
  } else if (tool === 'create_bucket_list_item') {
    rows.add('location', country ? countryNameIn(ctx, country) : '').add('notes', text(args.notes));
  }
  const named = tool === 'delete_bucket_list_item' ? null : argText(args.name, 120);
  return {
    subject: named ?? before?.name ?? (id === null ? '' : `#${id}`),
    rows,
    dayId: null,
    placeIds: [],
    tool,
    domain: 'atlas',
  };
}

type Describer = (ctx: PreviewContext, args: ToolArgs, loaded: AtlasLoaded | null) => Described;

/** The describers by tool; each one gives a card for empty arguments too. */
export const ATLAS_DESCRIBERS = {
  mark_country_visited: (ctx, args) => describeCountry('mark_country_visited', ctx, args),
  unmark_country_visited: (ctx, args) => describeCountry('unmark_country_visited', ctx, args),
  mark_region_visited: (ctx, args, loaded) => describeRegion('mark_region_visited', ctx, args, loaded),
  unmark_region_visited: (ctx, args, loaded) => describeRegion('unmark_region_visited', ctx, args, loaded),
  create_bucket_list_item: (ctx, args, loaded) => describeWish('create_bucket_list_item', ctx, args, loaded),
  update_bucket_list_item: (ctx, args, loaded) => describeWish('update_bucket_list_item', ctx, args, loaded),
  delete_bucket_list_item: (ctx, args, loaded) => describeWish('delete_bucket_list_item', ctx, args, loaded),
} satisfies Readonly<Record<string, Describer>>;
