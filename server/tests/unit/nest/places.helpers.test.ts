/**
 * Unit tests for the pure places helpers (moved from
 * tests/unit/services/kmzUnpack.test.ts when placeService went DI-native — the
 * KMZ unpacker touches no DB, so it lives in places.helpers.ts).
 */
import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import fs from 'fs';

vi.mock('../../../src/db/database', () => ({
  db: { prepare: vi.fn() },
  getPlaceWithTags: vi.fn(),
}));
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import {
  COORD_DEDUP_TOLERANCE,
  googleMapsFeatureIdFromItem,
  googleMapsHexId,
  isPlaceDuplicate,
  KMZ_DECOMPRESSED_SIZE_LIMIT,
  mapWithConcurrency,
  trackInsertedInDedupSet,
  trimOrNull,
  unpackKmzToKml,
  type DedupSet,
} from '../../../src/nest/places/places.helpers';

const KMZ_FIXTURE = path.join(__dirname, '../../fixtures/test.kmz');

describe('unpackKmzToKml', () => {
  it('extracts the KML entry from a valid KMZ', async () => {
    const kmzBuffer = fs.readFileSync(KMZ_FIXTURE);
    const kmlBuffer = await unpackKmzToKml(kmzBuffer);
    expect(kmlBuffer.length).toBeGreaterThan(0);
    expect(kmlBuffer.toString('utf-8')).toContain('<kml');
  });

  it('rejects a KMZ whose KML entry exceeds the decompressed size limit', async () => {
    const kmzBuffer = fs.readFileSync(KMZ_FIXTURE);
    // test.kmz contains a KML with uncompressedSize 634 — set limit to 1 byte
    await expect(unpackKmzToKml(kmzBuffer, 1)).rejects.toThrow('exceeds the maximum allowed decompressed size');
  });

  it('rejects a KMZ that contains no KML file', async () => {
    // Craft a minimal ZIP containing only a non-KML entry using raw ZIP bytes
    // We use the test GPX fixture (a real file) re-zipped via Node's zlib/archiver
    // Simplest: a KMZ whose only file has a .txt extension
    const Archiver = await import('archiver');
    const archiver = Archiver.default;
    const { PassThrough } = await import('stream');

    const chunks: Buffer[] = [];
    const output = new PassThrough();
    output.on('data', (chunk) => chunks.push(chunk));

    const archive = archiver('zip', { zlib: { level: 1 } });
    archive.pipe(output);
    archive.append(Buffer.from('not a kml'), { name: 'data.txt' });
    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);
    await expect(unpackKmzToKml(zipBuffer)).rejects.toThrow('does not contain a KML file');
  });

  it('rejects a buffer that is not a valid ZIP archive', async () => {
    await expect(unpackKmzToKml(Buffer.from('this is not a zip'))).rejects.toThrow('Invalid KMZ archive');
  });

  it('exports KMZ_DECOMPRESSED_SIZE_LIMIT as 50 MB', () => {
    expect(KMZ_DECOMPRESSED_SIZE_LIMIT).toBe(50 * 1024 * 1024);
  });
});

// ── Import dedup predicates ───────────────────────────────────────────────────

const emptyDedup = (): DedupSet => ({ names: new Set(), coords: [] });

describe('isPlaceDuplicate / trackInsertedInDedupSet', () => {
  it('matches a named place case- and whitespace-insensitively', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: '  Eiffel Tower ', lat: 1, lng: 2 }, dedup);
    expect(isPlaceDuplicate({ name: 'eiffel tower', lat: null, lng: null }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: 'Louvre', lat: null, lng: null }, dedup)).toBe(false);
  });

  it('falls back to coordinate proximity for unnamed places', () => {
    const dedup = emptyDedup();
    // No name — tracked by coordinates instead.
    trackInsertedInDedupSet({ name: null, lat: 48.85, lng: 2.35 }, dedup);
    expect(dedup.names.size).toBe(0);
    expect(isPlaceDuplicate({ name: undefined, lat: 48.85 + COORD_DEDUP_TOLERANCE / 2, lng: 2.35 }, dedup)).toBe(true);
    expect(isPlaceDuplicate({ name: undefined, lat: 48.9, lng: 2.35 }, dedup)).toBe(false);
  });

  it('a named candidate never falls through to the coordinate check', () => {
    const dedup = emptyDedup();
    trackInsertedInDedupSet({ name: null, lat: 48.85, lng: 2.35 }, dedup);
    // Same spot, but it carries a name — name lookup misses, so it is not a dup.
    expect(isPlaceDuplicate({ name: 'Named', lat: 48.85, lng: 2.35 }, dedup)).toBe(false);
  });

  it('a candidate with neither a name nor coordinates is never a duplicate', () => {
    expect(isPlaceDuplicate({ name: null, lat: null, lng: null }, emptyDedup())).toBe(false);
  });
});

// ── Google Maps feature ids ───────────────────────────────────────────────────

describe('googleMapsHexId / googleMapsFeatureIdFromItem', () => {
  it('passes an already-hex id through lower-cased', () => {
    expect(googleMapsHexId('0x882BF179E806D471')).toBe('0x882bf179e806d471');
  });

  it("converts Google's signed 64-bit decimals to unsigned hex", () => {
    expect(googleMapsHexId('-8634542354666695567')).toBe('0x882bf179e806d471');
    expect(googleMapsHexId(255)).toBe('0xff');
  });

  it('rejects anything that is not a hex or decimal id', () => {
    expect(googleMapsHexId('not-an-id')).toBeNull();
    expect(googleMapsHexId(null)).toBeNull();
    expect(googleMapsHexId({})).toBeNull();
  });

  it('reads the ftid pair from either item slot, else null', () => {
    expect(googleMapsFeatureIdFromItem([null, [0, 0, 0, 0, 0, 0, ['0x1', '0x2']]])).toBe('0x1:0x2');
    expect(googleMapsFeatureIdFromItem([null, null, null, null, null, null, null, [null, ['0x3', '0x4']]])).toBe('0x3:0x4');
    expect(googleMapsFeatureIdFromItem([null, [0, 0, 0, 0, 0, 0, ['0x1']]])).toBeNull();
    expect(googleMapsFeatureIdFromItem('not an array')).toBeNull();
  });
});

// ── Enrichment plumbing ───────────────────────────────────────────────────────

describe('mapWithConcurrency / trimOrNull', () => {
  it('visits every item and never runs more than `limit` at once', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const seen: number[] = [];
    let inFlight = 0;
    let peak = 0;
    await mapWithConcurrency(items, 3, async (n) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      seen.push(n);
      inFlight -= 1;
    });
    expect(seen.sort((a, b) => a - b)).toEqual(items);
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('is a no-op for an empty list', async () => {
    const fn = vi.fn();
    await mapWithConcurrency([], 3, fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it('trimOrNull keeps real strings and nulls everything else', () => {
    expect(trimOrNull('  Paris ')).toBe('Paris');
    expect(trimOrNull('   ')).toBeNull();
    expect(trimOrNull(42)).toBeNull();
    expect(trimOrNull(undefined)).toBeNull();
  });
});
