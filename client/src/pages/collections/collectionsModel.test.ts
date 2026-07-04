// FE-COLLECTIONS-MODEL-001 to FE-COLLECTIONS-MODEL-030
// Pure-function tests for the Collections page data-shaping helpers. No React,
// no network — plain vitest over collectionsModel.ts.
import type { CollectionPlace, CollectionStatus } from '@trek/shared';
import {
  filterPlaces,
  sortPlaces,
  statusCounts,
  presentCategories,
  presentLabels,
  mappablePlaces,
  normalizeLinkUrl,
} from './collectionsModel';
import type { CollectionLabel } from '@trek/shared';

// ── Inline CollectionPlace-ish builder ────────────────────────────────────────
// Only the fields the helpers actually read are meaningful; the rest satisfy the
// type. Callers override what a given case cares about.
interface CatLike {
  id: number;
  name: string | null;
  color?: string | null;
  icon?: string | null;
}
interface PlaceLike {
  id: number;
  name: string;
  status: CollectionStatus;
  category_id?: number | null;
  category?: CatLike | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  notes?: string | null;
  sort_order?: number;
  created_at?: string;
  label_ids?: number[];
}
function cp(overrides: PlaceLike): CollectionPlace {
  return {
    collection_id: 1,
    ...overrides,
  } as unknown as CollectionPlace;
}
// A stray hole in the array (WS race / partial payload). Typed as CollectionPlace
// so it can sit in the arrays the helpers receive.
const HOLE = undefined as unknown as CollectionPlace;

describe('collectionsModel', () => {
  // ── filterPlaces ────────────────────────────────────────────────────────────
  describe('filterPlaces', () => {
    it('FE-COLLECTIONS-MODEL-001: status filter keeps only the matching status', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        cp({ id: 2, name: 'B', status: 'want' }),
        cp({ id: 3, name: 'C', status: 'want' }),
        cp({ id: 4, name: 'D', status: 'visited' }),
      ];
      const out = filterPlaces(places, 'want', '');
      expect(out.map(p => p.id)).toEqual([2, 3]);
    });

    it("FE-COLLECTIONS-MODEL-002: statusFilter 'all' keeps every (defined) place", () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        cp({ id: 2, name: 'B', status: 'want' }),
        cp({ id: 3, name: 'C', status: 'visited' }),
      ];
      expect(filterPlaces(places, 'all', '')).toHaveLength(3);
    });

    it('FE-COLLECTIONS-MODEL-003: category filter keeps only that category_id', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', category_id: 5 }),
        cp({ id: 2, name: 'B', status: 'idea', category_id: 9 }),
        cp({ id: 3, name: 'C', status: 'idea', category_id: 5 }),
        cp({ id: 4, name: 'D', status: 'idea' }), // no category
      ];
      const out = filterPlaces(places, 'all', '', 5);
      expect(out.map(p => p.id)).toEqual([1, 3]);
    });

    it('FE-COLLECTIONS-MODEL-004: search matches place name (case-insensitive)', () => {
      const places = [
        cp({ id: 1, name: 'Eiffel Tower', status: 'idea' }),
        cp({ id: 2, name: 'Louvre', status: 'idea' }),
      ];
      const out = filterPlaces(places, 'all', 'eiffel');
      expect(out.map(p => p.id)).toEqual([1]);
    });

    it('FE-COLLECTIONS-MODEL-005: search matches address', () => {
      const places = [
        cp({ id: 1, name: 'Nameless', status: 'idea', address: '10 Rue de Paris' }),
        cp({ id: 2, name: 'Other', status: 'idea', address: 'Berlin' }),
      ];
      const out = filterPlaces(places, 'all', 'rue');
      expect(out.map(p => p.id)).toEqual([1]);
    });

    it('FE-COLLECTIONS-MODEL-006: search matches notes', () => {
      const places = [
        cp({ id: 1, name: 'X', status: 'idea', notes: 'sunset spot' }),
        cp({ id: 2, name: 'Y', status: 'idea', notes: 'breakfast' }),
      ];
      const out = filterPlaces(places, 'all', 'SUNSET');
      expect(out.map(p => p.id)).toEqual([1]);
    });

    it('FE-COLLECTIONS-MODEL-007: blank/whitespace search returns all', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        cp({ id: 2, name: 'B', status: 'want' }),
      ];
      expect(filterPlaces(places, 'all', '   ')).toHaveLength(2);
    });

    it('FE-COLLECTIONS-MODEL-008: a stray undefined entry is skipped, not crashing', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        HOLE,
        cp({ id: 2, name: 'B', status: 'want' }),
      ];
      expect(() => filterPlaces(places, 'all', '')).not.toThrow();
      const out = filterPlaces(places, 'all', '');
      expect(out.map(p => p.id)).toEqual([1, 2]);
    });

    it('FE-COLLECTIONS-MODEL-009: status + category + search combine (AND)', () => {
      const places = [
        cp({ id: 1, name: 'Beach Bar', status: 'want', category_id: 3, notes: 'cocktails' }),
        cp({ id: 2, name: 'Beach Hut', status: 'idea', category_id: 3 }),
        cp({ id: 3, name: 'Beach Cafe', status: 'want', category_id: 9 }),
      ];
      const out = filterPlaces(places, 'want', 'beach', 3);
      expect(out.map(p => p.id)).toEqual([1]);
    });
  });

  // ── sortPlaces ──────────────────────────────────────────────────────────────
  describe('sortPlaces', () => {
    it('FE-COLLECTIONS-MODEL-010: orders by sort_order ascending', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', sort_order: 2 }),
        cp({ id: 2, name: 'B', status: 'idea', sort_order: 0 }),
        cp({ id: 3, name: 'C', status: 'idea', sort_order: 1 }),
      ];
      expect(sortPlaces(places).map(p => p.id)).toEqual([2, 3, 1]);
    });

    it('FE-COLLECTIONS-MODEL-011: ties on sort_order fall back to created_at newest-first', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', sort_order: 0, created_at: '2025-01-01T00:00:00Z' }),
        cp({ id: 2, name: 'B', status: 'idea', sort_order: 0, created_at: '2025-03-01T00:00:00Z' }),
        cp({ id: 3, name: 'C', status: 'idea', sort_order: 0, created_at: '2025-02-01T00:00:00Z' }),
      ];
      // newest created_at first
      expect(sortPlaces(places).map(p => p.id)).toEqual([2, 3, 1]);
    });

    it('FE-COLLECTIONS-MODEL-012: missing sort_order is treated as 0', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', sort_order: 5 }),
        cp({ id: 2, name: 'B', status: 'idea' }), // no sort_order -> 0
      ];
      expect(sortPlaces(places).map(p => p.id)).toEqual([2, 1]);
    });

    it('FE-COLLECTIONS-MODEL-013: does not mutate the input array', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', sort_order: 2 }),
        cp({ id: 2, name: 'B', status: 'idea', sort_order: 1 }),
      ];
      const snapshot = places.map(p => p.id);
      sortPlaces(places);
      expect(places.map(p => p.id)).toEqual(snapshot);
    });
  });

  // ── statusCounts ────────────────────────────────────────────────────────────
  describe('statusCounts', () => {
    it('FE-COLLECTIONS-MODEL-014: counts per status plus a total under all', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        cp({ id: 2, name: 'B', status: 'idea' }),
        cp({ id: 3, name: 'C', status: 'want' }),
        cp({ id: 4, name: 'D', status: 'visited' }),
        cp({ id: 5, name: 'E', status: 'visited' }),
        cp({ id: 6, name: 'F', status: 'visited' }),
      ];
      expect(statusCounts(places)).toEqual({ all: 6, idea: 2, want: 1, visited: 3 });
    });

    it('FE-COLLECTIONS-MODEL-015: empty input yields all zeros', () => {
      expect(statusCounts([])).toEqual({ all: 0, idea: 0, want: 0, visited: 0 });
    });

    it('FE-COLLECTIONS-MODEL-016: undefined entries are skipped from every count', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        HOLE,
        cp({ id: 2, name: 'B', status: 'want' }),
      ];
      expect(() => statusCounts(places)).not.toThrow();
      expect(statusCounts(places)).toEqual({ all: 2, idea: 1, want: 1, visited: 0 });
    });
  });

  // ── presentCategories ───────────────────────────────────────────────────────
  describe('presentCategories', () => {
    it('FE-COLLECTIONS-MODEL-017: distinct categories with per-category counts', () => {
      const museum = { id: 3, name: 'Museums', color: '#111', icon: 'landmark' };
      const food = { id: 7, name: 'Food', color: '#222', icon: 'utensils' };
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', category_id: 3, category: museum }),
        cp({ id: 2, name: 'B', status: 'idea', category_id: 3, category: museum }),
        cp({ id: 3, name: 'C', status: 'idea', category_id: 7, category: food }),
      ];
      const out = presentCategories(places);
      // sorted alphabetically by name: Food, Museums
      expect(out.map(c => c.name)).toEqual(['Food', 'Museums']);
      expect(out.find(c => c.id === 3)?.count).toBe(2);
      expect(out.find(c => c.id === 7)?.count).toBe(1);
    });

    it('FE-COLLECTIONS-MODEL-018: carries color and icon from the category', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', category_id: 4, category: { id: 4, name: 'Parks', color: '#0f0', icon: 'tree' } }),
      ];
      const [opt] = presentCategories(places);
      expect(opt).toMatchObject({ id: 4, name: 'Parks', color: '#0f0', icon: 'tree', count: 1 });
    });

    it('FE-COLLECTIONS-MODEL-019: does NOT throw on an undefined entry (white-screen guard)', () => {
      const places = [
        HOLE,
        cp({ id: 1, name: 'A', status: 'idea', category_id: 3, category: { id: 3, name: 'Museums', color: null, icon: null } }),
      ];
      let out: ReturnType<typeof presentCategories> = [];
      expect(() => { out = presentCategories(places); }).not.toThrow();
      expect(out.map(c => c.id)).toEqual([3]);
    });

    it('FE-COLLECTIONS-MODEL-020: place with category_id but no category object is skipped (does not throw)', () => {
      // Regression: presentCategories used to read undefined.category_id / .name here.
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', category_id: 3 }), // category_id but no category
        cp({ id: 2, name: 'B', status: 'idea', category_id: 3, category: { id: 3, name: 'Museums', color: null, icon: null } }),
      ];
      let out: ReturnType<typeof presentCategories> = [];
      expect(() => { out = presentCategories(places); }).not.toThrow();
      // Only the place that actually carries the joined category contributes.
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({ id: 3, name: 'Museums', count: 1 });
    });

    it('FE-COLLECTIONS-MODEL-021: places with no category at all yield an empty list', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea' }),
        cp({ id: 2, name: 'B', status: 'want' }),
      ];
      expect(presentCategories(places)).toEqual([]);
    });

    it('FE-COLLECTIONS-MODEL-022: null color/icon on the category survive as null', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', category_id: 8, category: { id: 8, name: 'Misc', color: null, icon: null } }),
      ];
      expect(presentCategories(places)[0]).toMatchObject({ id: 8, name: 'Misc', color: null, icon: null, count: 1 });
    });
  });

  // ── mappablePlaces ──────────────────────────────────────────────────────────
  describe('mappablePlaces', () => {
    it('FE-COLLECTIONS-MODEL-023: keeps only places with numeric lat and lng', () => {
      const places = [
        cp({ id: 1, name: 'A', status: 'idea', lat: 48.85, lng: 2.35 }),
        cp({ id: 2, name: 'B', status: 'idea', lat: null, lng: 2.35 }),
        cp({ id: 3, name: 'C', status: 'idea', lat: 40.0, lng: null }),
        cp({ id: 4, name: 'D', status: 'idea' }), // neither
      ];
      expect(mappablePlaces(places).map(p => p.id)).toEqual([1]);
    });

    it('FE-COLLECTIONS-MODEL-024: keeps a place at the (0,0) origin (0 is numeric)', () => {
      const places = [cp({ id: 1, name: 'NullIsland', status: 'idea', lat: 0, lng: 0 })];
      expect(mappablePlaces(places).map(p => p.id)).toEqual([1]);
    });

    it('FE-COLLECTIONS-MODEL-025: skips a stray undefined entry without throwing', () => {
      const places = [
        HOLE,
        cp({ id: 1, name: 'A', status: 'idea', lat: 10, lng: 20 }),
      ];
      expect(() => mappablePlaces(places)).not.toThrow();
      expect(mappablePlaces(places).map(p => p.id)).toEqual([1]);
    });
  });

  // ── normalizeLinkUrl ────────────────────────────────────────────────────────
  describe('normalizeLinkUrl', () => {
    it('FE-COLLECTIONS-MODEL-026: prepends https:// to a scheme-less host', () => {
      expect(normalizeLinkUrl('booking.com')).toBe('https://booking.com');
    });

    it('FE-COLLECTIONS-MODEL-027: leaves an http:// URL unchanged', () => {
      expect(normalizeLinkUrl('http://example.com/path')).toBe('http://example.com/path');
    });

    it('FE-COLLECTIONS-MODEL-028: leaves an https:// URL unchanged (case-insensitive scheme)', () => {
      expect(normalizeLinkUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeLinkUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
    });

    it('FE-COLLECTIONS-MODEL-029: blank / whitespace-only input returns an empty string', () => {
      expect(normalizeLinkUrl('')).toBe('');
      expect(normalizeLinkUrl('   ')).toBe('');
    });

    it('FE-COLLECTIONS-MODEL-030: trims and strips leading slashes before prefixing', () => {
      expect(normalizeLinkUrl('  booking.com  ')).toBe('https://booking.com');
      expect(normalizeLinkUrl('//booking.com')).toBe('https://booking.com');
    });
  });

  describe('labels', () => {
    const places = [
      cp({ id: 1, name: 'Berlin gate', status: 'idea', label_ids: [10] }),
      cp({ id: 2, name: 'Hamburg port', status: 'idea', label_ids: [11] }),
      cp({ id: 3, name: 'Both', status: 'idea', label_ids: [10, 11] }),
      cp({ id: 4, name: 'None', status: 'idea', label_ids: [] }),
    ];
    const labels: CollectionLabel[] = [
      { id: 10, collection_id: 1, name: 'Berlin', color: '#f00' },
      { id: 11, collection_id: 1, name: 'Hamburg', color: '#00f' },
      { id: 12, collection_id: 1, name: 'Unused', color: null },
    ];

    it('FE-COLLECTIONS-MODEL-031: an empty label filter keeps every place', () => {
      expect(filterPlaces(places, 'all', '', 'all', [])).toHaveLength(4);
    });

    it('FE-COLLECTIONS-MODEL-032: a single label keeps places carrying it (incl. multi-label)', () => {
      const out = filterPlaces(places, 'all', '', 'all', [10]).map(p => p.id);
      expect(out).toEqual([1, 3]);
    });

    it('FE-COLLECTIONS-MODEL-033: multiple labels are OR — any match passes', () => {
      const out = filterPlaces(places, 'all', '', 'all', [10, 11]).map(p => p.id);
      expect(out).toEqual([1, 2, 3]);
    });

    it('FE-COLLECTIONS-MODEL-034: the label filter composes with status + search', () => {
      const mixed = [
        cp({ id: 5, name: 'Museum', status: 'visited', label_ids: [10] }),
        cp({ id: 6, name: 'Museum', status: 'idea', label_ids: [10] }),
      ];
      const out = filterPlaces(mixed, 'visited', 'mus', 'all', [10]).map(p => p.id);
      expect(out).toEqual([5]);
    });

    it('FE-COLLECTIONS-MODEL-035: presentLabels keeps definition order with per-label counts, incl. zero', () => {
      const opts = presentLabels(labels, places);
      expect(opts.map(o => [o.id, o.count])).toEqual([[10, 2], [11, 2], [12, 0]]);
    });
  });
});
