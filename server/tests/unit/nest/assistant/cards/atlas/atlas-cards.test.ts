/**
 * The atlas cards: the passport of get_atlas_stats, one country of
 * get_country_atlas_places, the wishes of list_bucket_list, the change cards
 * of the seven atlas writes predicted from the turn's reads, the applied
 * cards built from what the writes answer, and the way back from an added
 * wish. Every card is checked against the card union and holds no address.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { bucketListOf, countryOf, passportOf } from '../../../../../../src/nest/assistant/cards/atlas/atlas-answers';
import { DELETE_ADDED_WISH } from '../../../../../../src/nest/assistant/cards/atlas/atlas-applied';
import {
  ATLAS_CHANGES,
  countryNameIn,
  loadAtlas,
  loadAtlasRegions,
  loadBucket,
  type AtlasLoaded,
} from '../../../../../../src/nest/assistant/cards/atlas/atlas-changes';
import {
  atlasSnapshotOf,
  bucketSnapshotOf,
  regionsSnapshotOf,
} from '../../../../../../src/nest/assistant/cards/atlas/atlas-values';
import type { CardReader, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  TOOL_CARDS,
} from '../../../../../../src/nest/assistant/cards/registry';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { assistantChangePreviewSchema, trekCardSchema, type TrekCard } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const card = buildTripCard(1, 7, { trip: { title: 'Alps' } }, null, null);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: '2026-10-22', airport: () => null };

/** The card parses as a card of the union and carries no address. */
function valid(built: TrekCard | null): TrekCard {
  expect(built).not.toBeNull();
  expect(trekCardSchema.safeParse(built).success).toBe(true);
  expect(JSON.stringify(built)).not.toMatch(/https?:/);
  return built as TrekCard;
}

/** A country as `stats()` answers it. */
function visit(code: string, places: number, first: string | null, last: string | null, status: string) {
  return { code, placeCount: places, tripCount: places > 0 ? 1 : 0, firstVisit: first, lastVisit: last, status };
}

const STATS = {
  stats: {
    countries: [
      visit('FR', 4, '2019-05-01', '2019-05-09', 'visited'),
      visit('JP', 14, '2019-10-12', '2024-04-14', 'visited'),
      visit('DE', 0, null, null, 'visited'),
      visit('PT', 3, '2026-11-03', null, 'planned'),
      visit('IS', 1, null, null, 'idea'),
    ],
    stats: {
      totalTrips: 3,
      totalPlaces: 22,
      totalCountries: 3,
      totalCountriesPlanned: 1,
      totalCountriesIdea: 1,
      totalDays: 30,
      totalCities: 9,
    },
    continents: { Europe: 2, Asia: 1, Atlantis: 4 },
    continentsPlanned: { Europe: 1 },
    nextTrip: { id: 3, title: 'Lisbon', start_date: '2026-11-03', daysUntil: 12 },
    streak: 3,
  },
  travel: { countries: ['FR', 'JP', 'DE'], cities: ['paris'], totalDistanceKm: 18_230.6 },
};

const REGIONS = {
  regions: {
    JP: [
      { code: 'JP-26', name: 'Kyoto', placeCount: 6, status: 'visited' },
      { code: 'JP-13', name: 'Tokyo', placeCount: 8, status: 'visited' },
    ],
    DE: [{ code: 'DE-BY', name: 'Bavaria', placeCount: 0, status: 'visited', manuallyMarked: true }],
  },
};

const WISH = {
  id: 5,
  user_id: 1,
  name: 'Northern lights',
  lat: 64.1,
  lng: -21.9,
  country_code: 'IS',
  notes: 'Glacier hike',
  created_at: '2026-01-01 10:00:00',
  target_date: '2027-02',
  visited_at: null,
  visited_source: null,
  region_code: null,
};
const PETRA = { ...WISH, id: 8, name: 'Petra', country_code: 'JO' };
const BUCKET = {
  items: [
    WISH,
    { ...WISH, id: 6, name: 'Kyoto in autumn', country_code: 'JP', lat: null, lng: null, target_date: null },
    { ...WISH, id: 7, name: 'Machu Picchu', country_code: 'PER', target_date: '2026-05', notes: null },
    { ...PETRA, visited_at: '2025-04-02 08:00:00', visited_source: 'dawarich' },
  ],
};

const loaded: AtlasLoaded = {
  atlas: atlasSnapshotOf(STATS),
  regions: regionsSnapshotOf(REGIONS),
  bucket: bucketSnapshotOf(BUCKET),
};

describe('atlas answer cards', () => {
  it('ASTATLAS-001: the passport takes its figures, flags in the Atlas order, known continents and the flown distance', () => {
    const passport = valid(passportOf(STATS));
    expect(passport).toMatchObject({
      kind: 'atlasPassport',
      countries: { visited: 3, planned: 1, idea: 1 },
      totals: { trips: 3, days: 30, places: 22, cities: 9, flownKm: 18_231 },
      moreFlags: 0,
      nextTrip: { title: 'Lisbon', startDate: '2026-11-03', daysUntil: 12 },
      streakYears: 3,
    });
    // Visited latest first, the one without a date last, then planned; an idea is left out.
    expect(passport.kind === 'atlasPassport' && passport.flags).toEqual([
      { code: 'JP', status: 'visited' },
      { code: 'FR', status: 'visited' },
      { code: 'DE', status: 'visited' },
      { code: 'PT', status: 'planned' },
    ]);
    expect(passport.kind === 'atlasPassport' && passport.continents).toEqual([
      { name: 'Europe', visited: 2, planned: 1 },
      { name: 'Asia', visited: 1, planned: 0 },
    ]);
  });

  it('ASTATLAS-002: a user without trips gets the short form: no planned or idea counts, cities from the passport, nothing flown', () => {
    const passport = valid(
      passportOf({
        stats: {
          countries: [{ code: 'NO', placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }],
          trips: [],
          stats: { totalTrips: 0, totalPlaces: 0, totalCountries: 1, totalDays: 0 },
        },
        travel: { cities: ['oslo', 'bergen'], totalDistanceKm: 0 },
      }),
    );
    expect(passport).toMatchObject({
      countries: { visited: 1, planned: 0, idea: 0 },
      totals: { cities: 2, flownKm: null },
      flags: [{ code: 'NO', status: 'visited' }],
      continents: [],
      nextTrip: null,
      streakYears: null,
    });
    expect(passportOf({ stats: 'nope' })).toBeNull();
  });

  it('ASTATLAS-003: forty flags at most, the rest counted', () => {
    const countries = Array.from({ length: 45 }, (_, i) => ({
      code: `${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`,
      status: 'visited',
    }));
    const passport = valid(passportOf({ stats: { ...STATS.stats, countries }, travel: STATS.travel }));
    expect(passport.kind === 'atlasPassport' && passport.flags).toHaveLength(40);
    expect(passport).toMatchObject({ moreFlags: 5 });
  });

  it('ASTATLAS-004: a country reads its trips latest first and its places in their order, masked and cut', () => {
    const trips = [
      { id: 1, title: 'Tokyo food week', start_date: '2019-10-12', end_date: '2019-10-19' },
      { id: 2, title: 'Kyoto with ana@example.com', start_date: '2024-04-03', end_date: '2024-04-14' },
      ...[3, 4, 5].map((id) => ({ id, title: `Trip ${id}`, start_date: null, end_date: null })),
    ];
    const places = [
      { id: 10, name: 'Tsukiji', trip_id: 1 },
      { id: 11, name: 'Fushimi Inari', trip_id: 2 },
      ...Array.from({ length: 9 }, (_, i) => ({ id: 20 + i, name: `Spot ${i}`, trip_id: 2 })),
    ];
    const raw = { places, trips, manually_marked: false, marked_source: null, status: 'visited' };
    const country = valid(countryOf({ countryCode: 'jp' }, raw));
    expect(country).toMatchObject({
      kind: 'atlasCountry',
      code: 'JP',
      status: 'visited',
      markedBy: null,
      placeCount: 11,
      tripCount: 5,
      moreTrips: 1,
      morePlaces: 3,
      change: null,
    });
    if (country.kind !== 'atlasCountry') throw new Error('not a country');
    expect(country.trips.map((trip) => trip.id)).toEqual([2, 1, 3, 4]);
    expect(country.trips[0]?.title).not.toContain('ana@example.com');
    expect(country.places.slice(0, 2)).toEqual(['Fushimi Inari', 'Spot 0']);
    expect(country.places).not.toContain('Tsukiji');
  });

  it('ASTATLAS-005: a country nothing put on the map says so, one marked from recordings names it, a bad code gives none', () => {
    const empty = { places: [], trips: [], manually_marked: false, status: 'idea' };
    expect(countryOf({ countryCode: 'PE' }, empty)).toMatchObject({ status: null, placeCount: 0 });
    const recorded = { ...empty, manually_marked: true, marked_source: 'dawarich', status: 'visited' };
    const norway = valid(countryOf({ countryCode: 'NO' }, recorded));
    expect(norway).toMatchObject({ status: 'visited', markedBy: 'dawarich' });
    expect(countryOf({ countryCode: 'NOR' }, {})).toBeNull();
    expect(countryOf({}, {})).toBeNull();
  });

  it('ASTATLAS-006: the bucket list shows open wishes soonest first, then the reached ones, without coordinates', () => {
    const bucket = valid(bucketListOf(BUCKET));
    if (bucket.kind !== 'atlasBucket') throw new Error('not a bucket');
    expect(bucket.items.map((item) => item.id)).toEqual([7, 5, 6, 8]);
    expect(bucket.items[0]).toMatchObject({ countryCode: null, targetDate: '2026-05', notes: null });
    expect(bucket.items[3]).toMatchObject({ reachedOn: '2025-04-02', reachedFrom: 'dawarich' });
    expect(JSON.stringify(bucket)).not.toMatch(/lat|lng|user_id|64\.1/);
    const many = { items: Array.from({ length: 15 }, (_, i) => ({ ...WISH, id: i + 1, name: `Wish ${i}` })) };
    expect(bucketListOf(many)).toMatchObject({ more: 3 });
    expect(bucketListOf({ items: [] })).toBeNull();
    expect(bucketListOf('That is not a list')).toBeNull();
  });
});

describe('atlas change cards', () => {
  it('ASTATLAS-007: marking a country adds one unless it is visited already; an unread atlas leaves the counter out', () => {
    const peru = valid(ATLAS_CHANGES.mark_country_visited(ctx, { country_code: 'pe' }, loaded));
    expect(peru).toMatchObject({
      code: 'PE',
      status: null,
      change: { op: 'mark', after: 'visited', countries: { before: 3, after: 4 } },
    });
    const portugal = ATLAS_CHANGES.mark_country_visited(ctx, { country_code: 'PT' }, loaded);
    expect(portugal).toMatchObject({ status: 'planned', placeCount: 3, change: { countries: { after: 4 } } });
    const france = ATLAS_CHANGES.mark_country_visited(ctx, { country_code: 'FR' }, loaded);
    expect(france).toMatchObject({ change: { countries: { before: 3, after: 3 } } });
    const blind = ATLAS_CHANGES.mark_country_visited(ctx, { country_code: 'FR' }, null);
    expect(valid(blind)).toMatchObject({ status: null, change: { countries: null } });
    expect(ATLAS_CHANGES.mark_country_visited(ctx, {}, loaded)).toBeNull();
  });

  it('ASTATLAS-008: an unmark takes a country off the map unless its trips keep it, where the trips decide', () => {
    expect(ATLAS_CHANGES.unmark_country_visited(ctx, { country_code: 'DE' }, loaded)).toMatchObject({
      change: { op: 'unmark', after: 'none', countries: { before: 3, after: 2 } },
    });
    expect(ATLAS_CHANGES.unmark_country_visited(ctx, { country_code: 'JP' }, loaded)).toMatchObject({
      change: { after: 'unknown', countries: { before: 3, after: null } },
    });
    expect(ATLAS_CHANGES.unmark_country_visited(ctx, { country_code: 'PT' }, loaded)).toMatchObject({
      change: { after: 'planned', countries: { before: 3, after: 3 } },
    });
    expect(ATLAS_CHANGES.unmark_country_visited(ctx, { country_code: 'AU' }, loaded)).toMatchObject({
      status: null,
      change: { after: 'none', countries: { before: 3, after: 3 } },
    });
  });

  it('ASTATLAS-009: a region mark counts the regions of its country and moves the country like a mark', () => {
    const osaka = valid(
      ATLAS_CHANGES.mark_region_visited(ctx, { regionCode: 'jp-27', regionName: 'Osaka', countryCode: 'jp' }, loaded),
    );
    expect(osaka).toMatchObject({
      code: 'JP',
      change: {
        op: 'mark',
        region: { code: 'JP-27', name: 'Osaka', before: null, after: 'visited' },
        countries: { before: 3, after: 3 },
        regions: { before: 2, after: 3 },
      },
    });
    const kyoto = { regionCode: 'JP-26', regionName: 'Kyoto', countryCode: 'JP' };
    const again = ATLAS_CHANGES.mark_region_visited(ctx, kyoto, loaded);
    expect(again).toMatchObject({ change: { region: { before: 'visited' }, regions: { before: 2, after: 2 } } });
    expect(ATLAS_CHANGES.mark_region_visited(ctx, { regionCode: 'Osaka', countryCode: 'JP' }, loaded)).toBeNull();
  });

  it('ASTATLAS-010: a region unmark keeps the country while others are left; the last one leaves it to the trips', () => {
    expect(ATLAS_CHANGES.unmark_region_visited(ctx, { regionCode: 'JP-26' }, loaded)).toMatchObject({
      code: 'JP',
      change: {
        op: 'unmark',
        region: { code: 'JP-26', name: 'Kyoto', before: 'visited', after: 'none' },
        after: 'visited',
        countries: { before: 3, after: 3 },
        regions: { before: 2, after: 1 },
      },
    });
    const last = valid(ATLAS_CHANGES.unmark_region_visited(ctx, { regionCode: 'DE-BY' }, loaded));
    expect(last).toMatchObject({
      change: { after: 'unknown', countries: { before: 3, after: null }, regions: { before: 1, after: 0 } },
    });
    // A region the snapshot does not know is named by its code, its country by the code's prefix.
    expect(ATLAS_CHANGES.unmark_region_visited(ctx, { regionCode: 'FR-IDF' }, loaded)).toMatchObject({
      code: 'FR',
      change: { region: { name: 'FR-IDF', before: null } },
    });
  });

  it('ASTATLAS-011: an add shows the wish from its arguments and knows a duplicate, which does not grow the list', () => {
    const patagonia = { name: 'Patagonia', country_code: 'ar', target_date: '2028', notes: 'Torres del Paine' };
    const add = valid(ATLAS_CHANGES.create_bucket_list_item(ctx, { ...patagonia, lat: -50.9, lng: -73.4 }, loaded));
    expect(add).toMatchObject({
      items: [{ id: null, name: 'Patagonia', countryCode: 'AR', targetDate: '2028', notes: 'Torres del Paine' }],
      change: { op: 'add', duplicate: false, wishes: { before: 4, after: 5 } },
    });
    expect(JSON.stringify(add)).not.toContain('-50.9');
    const dup = ATLAS_CHANGES.create_bucket_list_item(
      ctx,
      { name: '  northern LIGHTS ', country_code: 'is', target_date: '2027-02', lat: 64.1, lng: -21.9 },
      loaded,
    );
    expect(dup).toMatchObject({ change: { duplicate: true, wishes: { before: 4, after: 4 } } });
    const otherDate = ATLAS_CHANGES.create_bucket_list_item(
      ctx,
      { name: 'Northern lights', country_code: 'IS', target_date: '2028-02', lat: 64.1, lng: -21.9 },
      loaded,
    );
    expect(otherDate).toMatchObject({ change: { duplicate: false } });
    expect(ATLAS_CHANGES.create_bucket_list_item(ctx, {}, loaded)).toBeNull();
  });

  it('ASTATLAS-012: a change shows the wish as it will read, a removal as it reads, and an unknown id draws no card', () => {
    const update = valid(
      ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 5, name: 'Aurora', target_date: '2027-03' }, loaded),
    );
    expect(update).toMatchObject({
      items: [{ id: 5, name: 'Aurora', targetDate: '2027-03', notes: 'Glacier hike', countryCode: 'IS' }],
      change: { op: 'update', before: { name: 'Northern lights', targetDate: '2027-02' }, duplicate: false },
    });
    const clash = ATLAS_CHANGES.update_bucket_list_item(
      ctx,
      { itemId: 6, name: 'Northern lights', country_code: 'IS', target_date: '2027-02', lat: 64.1, lng: -21.9 },
      loaded,
    );
    expect(clash).toMatchObject({ change: { duplicate: true } });
    expect(ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 99, name: 'x' }, loaded)).toBeNull();
    const remove = valid(ATLAS_CHANGES.delete_bucket_list_item(ctx, { itemId: 6 }, loaded));
    expect(remove).toMatchObject({
      items: [{ id: 6, name: 'Kyoto in autumn' }],
      change: { op: 'remove', before: { id: 6 }, wishes: { before: 4, after: 3 } },
    });
    expect(ATLAS_CHANGES.delete_bucket_list_item(ctx, { itemId: 6 }, null)).toBeNull();
  });

  it('ASTATLAS-013: the held card names the country in the user language, under the tool label in the atlas', () => {
    expect(countryNameIn({ locale: 'de' }, 'FR')).toBe('Frankreich');
    expect(countryNameIn({ locale: 'not a locale!' }, 'FR')).toBe('France');
    const german = { ...ctx, locale: 'de' };
    const preview = describeToolCall('mark_country_visited', 'tc-1', { country_code: 'fr' }, german, loaded);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({
      verbKey: 'genericCreate',
      subject: 'Frankreich',
      tool: 'mark_country_visited',
      domain: 'atlas',
      undoable: false,
      card: { kind: 'atlasCountry', code: 'FR' },
    });
    const region = describeToolCall('unmark_region_visited', 'tc-2', { regionCode: 'JP-26' }, ctx, loaded);
    expect(region).toMatchObject({ verbKey: 'genericRemove', subject: 'Kyoto' });
    expect(region.rows).toEqual([{ op: 'add', labelKey: 'location', before: null, after: 'Japan' }]);
    const wish = describeToolCall('update_bucket_list_item', 'tc-3', { itemId: 5, notes: 'With Ana' }, ctx, loaded);
    expect(wish).toMatchObject({
      subject: 'Northern lights',
      rows: [{ op: 'change', labelKey: 'notes', before: 'Glacier hike', after: 'With Ana' }],
    });
    const add = describeToolCall('create_bucket_list_item', 'tc-4', { name: 'Petra' }, ctx, loaded);
    expect(add).toMatchObject({ undoable: true, subject: 'Petra' });
    expect(describeToolCall('delete_bucket_list_item', 'tc-5', { itemId: 8 }, ctx, loaded)).toMatchObject({
      verbKey: 'genericRemove',
      subject: 'Petra',
    });
  });
});

describe('atlas lookups, applied cards and undo', () => {
  it('ASTATLAS-014: each change reads only what it needs, and a failed read leaves its snapshot empty', async () => {
    const answers: Record<string, unknown> = { get_atlas_stats: STATS, list_visited_regions: REGIONS };
    const read = vi.fn<CardReader>((tool) => Promise.resolve(answers[tool] ?? null));
    expect((await loadAtlas({}, read)).atlas?.visited).toBe(3);
    expect(read).toHaveBeenCalledWith('get_atlas_stats');
    const both = await loadAtlasRegions({}, read);
    expect(both.regions?.get('JP-26')).toEqual({ name: 'Kyoto', country: 'JP', status: 'visited' });
    expect(both.bucket).toBeNull();
    expect((await loadBucket({}, read)).bucket).toBeNull();
    expect(read).toHaveBeenCalledTimes(4);
    expect(atlasSnapshotOf({ stats: {} })).toBeNull();
    expect(regionsSnapshotOf('nope')).toBeNull();
  });

  it('ASTATLAS-015: the applied country takes the standing and the counters the write answered', () => {
    const held = describeToolCall('unmark_country_visited', 'tc-6', { country_code: 'JP' }, ctx, loaded);
    const applied = appliedCardOf('unmark_country_visited', {
      args: { country_code: 'JP' },
      result: { success: true, country_code: 'JP', after: { country_status: 'visited', countries_visited: 3 } },
      preview: held,
    });
    expect(valid(applied)).toMatchObject({ change: { after: 'visited', countries: { before: 3, after: 3 } } });
    const region = describeToolCall('unmark_region_visited', 'tc-7', { regionCode: 'DE-BY' }, ctx, loaded);
    const gone = appliedCardOf('unmark_region_visited', {
      args: { regionCode: 'DE-BY' },
      result: { success: true, after: { country_status: null, countries_visited: 2, regions_visited: 0 } },
      preview: region,
    });
    expect(gone).toMatchObject({
      change: { after: 'none', countries: { after: 2 }, region: { after: 'none' }, regions: { before: 1, after: 0 } },
    });
    // Without a held card there is nothing to build on.
    const blind = { args: { country_code: 'JP' }, result: {}, preview: null };
    expect(appliedCardOf('mark_country_visited', blind)).toBeNull();
  });

  it('ASTATLAS-016: an applied wish carries its stored id, a removal keeps its held card', () => {
    const held = describeToolCall('create_bucket_list_item', 'tc-8', { name: 'Patagonia' }, ctx, loaded);
    const added = appliedCardOf('create_bucket_list_item', {
      args: { name: 'Patagonia' },
      result: { item: { ...WISH, id: 41, name: 'Patagonia', country_code: 'AR', notes: 'mail me at ana@example.com' } },
      preview: held,
    });
    expect(valid(added)).toMatchObject({
      items: [{ id: 41, name: 'Patagonia', countryCode: 'AR' }],
      change: { op: 'add', wishes: { before: 4, after: 5 } },
    });
    expect(JSON.stringify(added)).not.toContain('ana@example.com');
    const removal = describeToolCall('delete_bucket_list_item', 'tc-9', { itemId: 5 }, ctx, loaded);
    const input = { args: { itemId: 5 }, result: { success: true }, preview: removal };
    const removed = appliedCardOf('delete_bucket_list_item', input);
    expect(removed).toEqual(removal.card);
  });

  it('ASTATLAS-017: an added wish is taken back while it reads as added, never once edited or reached', () => {
    const result = { item: { ...WISH, id: 41 } };
    expect(ASSISTANT_UNDO_MAP.create_bucket_list_item?.tool).toBe('delete_bucket_list_item');
    expect(DELETE_ADDED_WISH.args({}, result, null)).toEqual({ itemId: 41 });
    expect(DELETE_ADDED_WISH.args({}, { success: false }, null)).toBeNull();
    const reads = DELETE_ADDED_WISH.reads?.({}, result) ?? [];
    expect(reads).toEqual([{ tool: 'list_bucket_list', args: {} }]);
    const snapshot = (items: unknown[]) => ({
      summary: null,
      places: null,
      reads: new Map([[readKey('list_bucket_list', {}), { items }]]),
    });
    expect(DELETE_ADDED_WISH.unchanged(result, snapshot([{ ...WISH, id: 41 }]))).toBe(true);
    expect(DELETE_ADDED_WISH.unchanged(result, snapshot([{ ...WISH, id: 41, notes: 'Edited' }]))).toBe(false);
    expect(DELETE_ADDED_WISH.unchanged(result, snapshot([{ ...WISH, id: 41, visited_at: '2026-10-01' }]))).toBe(false);
    expect(DELETE_ADDED_WISH.unchanged(result, snapshot([]))).toBe(false);
  });

  it('ASTATLAS-018: the registry holds the atlas tools, guards their cards and adds the two prompt lines', () => {
    const marks = ['mark_country_visited', 'unmark_country_visited', 'mark_region_visited', 'unmark_region_visited'];
    for (const tool of marks) {
      expect(ASSISTANT_WRITE_TOOLS[tool]?.entity).toBe('atlas');
      expect(TOOL_CARDS[tool]?.load).toBeTypeOf('function');
    }
    expect(ASSISTANT_WRITE_TOOLS.update_bucket_list_item).toEqual({ entity: 'atlas', verbKey: 'genericUpdate' });
    const input = { toolCallId: 'tc-10', card, today: '2026-10-22' };
    const passport = answerCardOf('get_atlas_stats', { ...input, args: {}, value: STATS });
    expect(valid(passport)).toMatchObject({ kind: 'atlasPassport' });
    const bucket = answerCardOf('list_bucket_list', { ...input, args: {}, value: BUCKET });
    expect(bucket).toMatchObject({ kind: 'atlasBucket' });
    expect(answerCardOf('get_country_atlas_places', { ...input, args: { countryCode: 'x' }, value: {} })).toBeNull();
    expect(CARD_PROMPT_LINES.some((line) => line.includes('list_bucket_list'))).toBe(true);
  });

  it('ASTATLAS-019: the duplicate check compares a country as stored and a name only trimmed, as the service does', () => {
    const stored = bucketSnapshotOf({
      items: [
        { ...WISH, id: 20, name: 'Kyoto', country_code: 'jp', lat: null, lng: null, target_date: null },
        { ...WISH, id: 21, name: 'Osaka  Castle', country_code: 'JP', lat: null, lng: null, target_date: null },
      ],
    });
    const lower: AtlasLoaded = { atlas: null, regions: null, bucket: stored };
    // An update keeps its country as given: 'jp' meets the stored 'jp', 'JP' does not.
    const same = ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 21, name: 'Kyoto', country_code: 'jp' }, lower);
    expect(same).toMatchObject({ change: { duplicate: true } });
    const upper = ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 21, name: 'Kyoto', country_code: 'JP' }, lower);
    expect(upper).toMatchObject({ change: { duplicate: false } });
    // An add is stored upper-cased by its schema, so 'jp' lands as 'JP' and misses the stored 'jp'.
    const add = ATLAS_CHANGES.create_bucket_list_item(ctx, { name: 'Kyoto', country_code: 'jp' }, lower);
    expect(add).toMatchObject({ change: { duplicate: false } });
    // Inner spaces stay, as the service trims the ends only: the double space meets the stored one.
    const spaced = { itemId: 20, name: ' osaka  castle ', country_code: 'JP' };
    expect(ATLAS_CHANGES.update_bucket_list_item(ctx, spaced, lower)).toMatchObject({ change: { duplicate: true } });
    // A blank name keeps the stored one, so the wish clashes as it is.
    const blank = ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 20, name: '  ', country_code: 'JP' }, lower);
    expect(blank).toMatchObject({ items: [{ name: 'Kyoto' }], change: { duplicate: false } });
  });

  it('ASTATLAS-020: a wish moved to another country loses its region, one kept in its country keeps it', () => {
    const regional = bucketSnapshotOf({ items: [{ ...WISH, id: 30, region_code: 'IS-1' }] });
    const withRegion: AtlasLoaded = { atlas: null, regions: null, bucket: regional };
    const moved = ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 30, country_code: 'NO' }, withRegion);
    expect(moved).toMatchObject({
      items: [{ countryCode: 'NO', regionCode: null }],
      change: { before: { regionCode: 'IS-1' } },
    });
    const kept = ATLAS_CHANGES.update_bucket_list_item(ctx, { itemId: 30, notes: 'In March' }, withRegion);
    expect(kept).toMatchObject({ items: [{ countryCode: 'IS', regionCode: 'IS-1', notes: 'In March' }] });
  });

  it('ASTATLAS-021: a wish change is named by its new name, else its stored one, else its id', () => {
    const subject = (tool: string, args: Record<string, unknown>) =>
      describeToolCall(tool, 'tc-21', args, ctx, loaded).subject;
    expect(subject('update_bucket_list_item', { itemId: 5, name: 'Aurora' })).toBe('Aurora');
    expect(subject('update_bucket_list_item', { itemId: 5, target_date: '2027-03' })).toBe('Northern lights');
    expect(subject('update_bucket_list_item', { itemId: 99, notes: 'x' })).toBe('#99');
    // A removal never takes a name from its arguments.
    expect(subject('delete_bucket_list_item', { itemId: 6, name: 'Ignored' })).toBe('Kyoto in autumn');
    expect(subject('delete_bucket_list_item', { itemId: 99 })).toBe('#99');
    expect(subject('delete_bucket_list_item', {})).toBe('');
  });
});
