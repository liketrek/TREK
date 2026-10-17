/**
 * FerratasService over a real snapshot db: the box resolved into grid cells,
 * the cells served from `ferrata_tiles` (and the memory in front of it), and
 * Overpass, faked, asked once per 0.1 degree block for the cells never fetched.
 */
import { FerrataTiles } from '../../../src/db/entities/FerrataTiles.entity';
import { FerrataTilesRepository } from '../../../src/db/repositories/FerrataTiles.repository';
import { DomainError } from '../../../src/nest/common/domain-error';
import { FerratasOverpassClient } from '../../../src/nest/ferratas/ferratas-overpass.client';
import { FerratasModule } from '../../../src/nest/ferratas/ferratas.module';
import {
  FERRATA_TILE_STALE_MS,
  FERRATAS_UNAVAILABLE_MESSAGE,
  FerratasService,
} from '../../../src/nest/ferratas/ferratas.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, deleteRows, findRow, findRows, insertRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import {
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  FERRATAS_ATTRIBUTION,
  FERRATAS_RESULT_CAP,
  FERRATAS_UNAVAILABLE_CODE,
  ferratasResponseSchema,
  type Ferrata,
} from '@trek/shared';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const NOW = 1_800_000_000_000;
/** What `fetched_at` holds for NOW: the table keeps seconds. */
const NOW_S = NOW / 1000;
const seconds = (ms: number) => Math.floor(ms / 1000);

/** 47.1 to 47.2 north, 11.2 to 11.3 east once snapped: 2 by 2 cells, one block of one query. */
const bbox = { south: 47.12, west: 11.21, north: 47.18, east: 11.29 };
/** 47.1 to 47.4 north, 11.2 to 11.6 east once snapped: 6 by 8 cells, 3 by 4 blocks. */
const wide = { south: 47.12, west: 11.21, north: 47.38, east: 11.57 };
const element = {
  type: 'way',
  id: 42,
  tags: { highway: 'via_ferrata', name: 'Klettersteig', via_ferrata_scale: '2+' },
  geometry: [
    { lat: 47.15, lon: 11.25 },
    { lat: 47.16, lon: 11.26 },
  ],
};

const stored = (id: string, geometry: [number, number][]): Ferrata => ({
  id,
  name: 'Stored',
  grade: { raw: null, level: null, plus: null },
  routeName: null,
  geometry,
  osmUrl: `https://www.openstreetmap.org/${id}`,
});
const payload = (ferratas: Ferrata[], truncated = false) => JSON.stringify({ ferratas, truncated });

const query = vi.fn<(q: string) => Promise<unknown[]>>();
let t: TestModule | undefined;
let service: FerratasService;
const orm = () => {
  if (!t) throw new Error('No container booted');
  return t.get(MikroORM);
};

/** A fresh container on the same db: an empty memory, what a restart looks like. */
async function boot(): Promise<void> {
  await t?.close();
  t = await createTestModule({
    db,
    imports: [FerratasModule],
    overrides: [{ provide: FerratasOverpassClient, useValue: { query } }],
  });
  service = t.get(FerratasService);
}

function deferred(): { promise: Promise<unknown[]>; resolve: (v: unknown[]) => void; reject: (e: Error) => void } {
  let resolve: (v: unknown[]) => void = () => {};
  let reject: (e: Error) => void = () => {};
  const promise = new Promise<unknown[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  resetTestDb(db);
  query.mockReset();
  query.mockResolvedValue([element]);
  await boot();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await t?.close();
  db.close();
});

describe('FerratasService.list: cells fetched for the first time', () => {
  it('FERSVC-001: answers the ferratas with source and attribution, inside the response contract', async () => {
    const res = await service.list(bbox, NOW);
    expect(res).toMatchObject({ truncated: false, source: 'openstreetmap', attribution: FERRATAS_ATTRIBUTION });
    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(ferratasResponseSchema.safeParse(res).success).toBe(true);
  });

  it('FERSVC-002: asks Overpass once for a box of one block', async () => {
    await service.list(bbox, NOW);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toContain('(47.1,11.2,47.2,11.3)');
  });

  it('FERSVC-023: asks a wider box block by block, never more than 0.1 degree a side, at most two at once', async () => {
    const gates = Array.from({ length: 12 }, () => deferred());
    let next = 0;
    query.mockImplementation(() => (gates[next++] ?? deferred()).promise);

    const answer = service.list(wide, NOW);
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(2));
    gates[0]?.resolve([element]);
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(3));
    for (const gate of gates) gate.resolve([element]);
    const res = await answer;

    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(query).toHaveBeenCalledTimes(12);
    for (const [text] of query.mock.calls) {
      const [south, west, north, east] = (/\(([\d.,-]+)\)/.exec(text)?.[1] ?? '').split(',').map(Number);
      expect((north ?? 0) - (south ?? 0)).toBeLessThanOrEqual(0.1 + 1e-9);
      expect((east ?? 0) - (west ?? 0)).toBeLessThanOrEqual(0.1 + 1e-9);
    }
    expect(await countRows(orm(), FerrataTiles)).toBe(6 * 8);
  });

  it('FERSVC-003: stores every cell, each with the ferratas whose line touches it, at the time in seconds', async () => {
    await service.list(bbox, NOW);

    expect(await countRows(orm(), FerrataTiles)).toBe(2 * 2);
    // 47.15 and 11.25 lie on cell edges, so way 42 belongs to the four cells around that corner.
    const holding = (await findRows(orm(), FerrataTiles, {}, { tile_key: 'asc' }))
      .filter((row) => row.payload.includes('way/42'))
      .map((row) => row.tile_key);
    expect(holding).toEqual(['942,224', '942,225', '943,224', '943,225']);
    expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toMatchObject({ fetched_at: NOW_S });

    // The next block north holds none of it: its cells are stored empty.
    await service.list({ south: 47.21, west: 11.21, north: 47.29, east: 11.29 }, NOW);
    expect(await findRow(orm(), FerrataTiles, { tile_key: '944,224' })).toEqual({
      tile_key: '944,224',
      payload: payload([]),
      fetched_at: NOW_S,
    });
  });

  it('FERSVC-004: answers a ferrata crossing several cells once', async () => {
    const res = await service.list(bbox, NOW);
    expect(res.ferratas).toHaveLength(1);
  });

  it('FERSVC-005: answers only the ferratas that reach into the asked box, not the whole cells', async () => {
    const outside = {
      ...element,
      id: 43,
      geometry: [
        { lat: 47.1, lon: 11.22 },
        { lat: 47.11, lon: 11.23 },
      ],
    };
    query.mockResolvedValue([element, outside]);

    const res = await service.list(bbox, NOW);

    expect(res.ferratas.map((ferrata) => ferrata.id)).toEqual(['way/42']);
    // The cell still keeps it, for the next box that does reach that far south.
    expect((await findRow(orm(), FerrataTiles, { tile_key: '942,224' }))?.payload).toContain('way/43');
  });

  it('FERSVC-006: shares one Overpass call between concurrent identical requests', async () => {
    const pending = deferred();
    query.mockReturnValueOnce(pending.promise);
    const both = Promise.all([service.list(bbox, NOW), service.list(bbox, NOW)]);
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    pending.resolve([element]);
    const [a, b] = await both;
    expect(a).toEqual(b);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-007: asks a cut block again cell by cell, and stores a cell still cut as old so a restart asks again', async () => {
    const many = Array.from({ length: FERRATAS_RESULT_CAP + 1 }, (_, i) => ({ ...element, id: 1000 + i }));
    query.mockResolvedValue(many);

    const res = await service.list(bbox, NOW);

    expect(res.truncated).toBe(true);
    expect(res.ferratas).toHaveLength(FERRATAS_RESULT_CAP);
    expect(ferratasResponseSchema.safeParse(res).success).toBe(true);
    // The block, then each of its four cells on its own.
    expect(query).toHaveBeenCalledTimes(1 + 4);
    expect(query.mock.calls[1]?.[0]).toContain('(47.1,11.2,47.15,11.25)');
    const row = await findRow(orm(), FerrataTiles, { tile_key: '942,224' });
    expect(row?.fetched_at).toBe(0);
    expect(row?.payload).toContain('"truncated":true');

    // This process keeps the cut cells; a restart serves them and asks again in the background.
    expect((await service.list(bbox, NOW + 1)).truncated).toBe(true);
    expect(query).toHaveBeenCalledTimes(5);
    await boot();
    query.mockReset();
    query.mockResolvedValue([element]);
    expect((await service.list(bbox, NOW)).truncated).toBe(true);
    expect(query).toHaveBeenCalledTimes(1);
    await vi.waitFor(async () =>
      expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toMatchObject({ fetched_at: NOW_S }),
    );
    expect((await service.list(bbox, NOW + 1)).truncated).toBe(false);
  });

  it('FERSVC-024: a block cut at the cap whose cells each fit is stored whole, and not marked cut', async () => {
    const many = Array.from({ length: FERRATAS_RESULT_CAP + 1 }, (_, i) => ({ ...element, id: 1000 + i }));
    query.mockResolvedValueOnce(many).mockResolvedValue([element]);

    const res = await service.list(bbox, NOW);

    expect(res.truncated).toBe(false);
    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(query).toHaveBeenCalledTimes(5);
    const rows = await findRows(orm(), FerrataTiles, {}, { tile_key: 'asc' });
    expect(rows.map((r) => [r.tile_key, r.fetched_at, r.payload.includes('"truncated":false')])).toEqual([
      ['942,224', NOW_S, true],
      ['942,225', NOW_S, true],
      ['943,224', NOW_S, true],
      ['943,225', NOW_S, true],
    ]);
  });

  it('FERSVC-008: refuses a box over the cell cap before asking anyone', async () => {
    const err = await service.list({ south: 47, west: 11, north: 48, east: 12 }, NOW).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DomainError);
    expect((err as DomainError).getStatus()).toBe(400);
    expect((err as DomainError).getResponse()).toEqual({ error: FERRATA_BBOX_TOO_LARGE_MESSAGE });
    expect(query).not.toHaveBeenCalled();
  });
});

describe('FerratasService.list: cells already stored', () => {
  it('FERSVC-009: serves a nearby request from the cells, without Overpass', async () => {
    await service.list(bbox, NOW);
    const res = await service.list({ south: 47.11, west: 11.22, north: 47.19, east: 11.28 }, NOW + 1);
    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-010: serves the cells from the table after a restart', async () => {
    await service.list(bbox, NOW);
    await boot();

    const res = await service.list(bbox, NOW + 1);

    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-011: serves the cells from memory without reading the table again', async () => {
    await service.list(bbox, NOW);
    await deleteRows(orm(), FerrataTiles);

    const res = await service.list(bbox, NOW + 1);

    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-012: asks Overpass only for the cells not stored yet', async () => {
    await service.list({ south: 47.1, west: 11.2, north: 47.2, east: 11.3 }, NOW);
    query.mockClear();

    await service.list({ south: 47.1, west: 11.2, north: 47.3, east: 11.3 }, NOW);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toContain('(47.2,11.2,47.3,11.3)');
    expect(await countRows(orm(), FerrataTiles)).toBe(4 * 2);
  });

  it('FERSVC-013: reads a stored cell that does not decode as never fetched, and fetches it again', async () => {
    await insertRows(orm(), FerrataTiles, [{ tile_key: '942,224', payload: '{"ferratas":"nope"}', fetched_at: NOW_S }]);
    query.mockResolvedValue([]);

    await service.list({ south: 47.1, west: 11.2, north: 47.15, east: 11.25 }, NOW + 1000);

    expect(query).toHaveBeenCalledTimes(1);
    expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toEqual({
      tile_key: '942,224',
      payload: payload([]),
      fetched_at: NOW_S + 1,
    });
  });
});

describe('FerratasService.list: old cells', () => {
  const cell = { south: 47.1, west: 11.2, north: 47.15, east: 11.25 };
  const old = stored('way/7', [
    [47.11, 11.21],
    [47.12, 11.22],
  ]);
  const seedOld = () =>
    insertRows(orm(), FerrataTiles, [
      { tile_key: '942,224', payload: payload([old]), fetched_at: seconds(NOW - FERRATA_TILE_STALE_MS) },
    ]);

  it('FERSVC-014: serves an old cell at once and refreshes it in the background', async () => {
    await seedOld();
    const pending = deferred();
    query.mockReturnValueOnce(pending.promise);

    const res = await service.list(cell, NOW);

    expect(res.ferratas.map((f) => f.id)).toEqual(['way/7']);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toContain('(47.1,11.2,47.15,11.25)');

    pending.resolve([]);
    await vi.waitFor(async () =>
      expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toEqual({
        tile_key: '942,224',
        payload: payload([]),
        fetched_at: NOW_S,
      }),
    );
    expect((await service.list(cell, NOW + 1)).ferratas).toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-015: a cell just under the age limit is not refreshed', async () => {
    await insertRows(orm(), FerrataTiles, [
      { tile_key: '942,224', payload: payload([old]), fetched_at: seconds(NOW - FERRATA_TILE_STALE_MS) + 1 },
    ]);
    await service.list(cell, NOW);
    expect(query).not.toHaveBeenCalled();
  });

  it('FERSVC-016: starts one refresh for an old cell, however many requests see it', async () => {
    await seedOld();
    const pending = deferred();
    query.mockReturnValueOnce(pending.promise);

    await service.list(cell, NOW);
    await service.list(cell, NOW);

    expect(query).toHaveBeenCalledTimes(1);
    pending.resolve([]);
    await vi.waitFor(async () =>
      expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toMatchObject({ fetched_at: NOW_S }),
    );
  });

  it('FERSVC-017: a failed refresh keeps the old cell, never reaches the client, and is tried again later', async () => {
    await seedOld();
    query.mockRejectedValueOnce(new Error('Could not reach any Overpass endpoint'));

    const res = await service.list(cell, NOW);

    expect(res.ferratas.map((f) => f.id)).toEqual(['way/7']);
    // Let the rejected refresh settle; an unhandled rejection would fail the run.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toMatchObject({
      fetched_at: seconds(NOW - FERRATA_TILE_STALE_MS),
    });

    query.mockResolvedValueOnce([]);
    expect((await service.list(cell, NOW + 1000)).ferratas.map((f) => f.id)).toEqual(['way/7']);
    expect(query).toHaveBeenCalledTimes(2);
    await vi.waitFor(async () =>
      expect(await findRow(orm(), FerrataTiles, { tile_key: '942,224' })).toMatchObject({ fetched_at: NOW_S + 1 }),
    );
  });

  it('FERSVC-018: an old cell is refreshed in a query of its own, so its failure cannot fail the new cells', async () => {
    await seedOld();
    query.mockImplementation((text) =>
      text.includes('(47.1,11.2,47.15,11.25)') ? Promise.reject(new Error('timeout')) : Promise.resolve([]),
    );

    const res = await service.list({ south: 47.1, west: 11.2, north: 47.2, east: 11.25 }, NOW);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls.map(([text]) => text.match(/\(([\d.,]+)\)/)?.[1]).sort()).toEqual([
      '47.1,11.2,47.15,11.25',
      '47.15,11.2,47.2,11.25',
    ]);
    // The old cell is served as it was; the new one came back on its own.
    expect(res.ferratas.map((f) => f.id)).toEqual(['way/7']);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await findRows(orm(), FerrataTiles, {}, { tile_key: 'asc' })).toEqual([
      { tile_key: '942,224', payload: payload([old]), fetched_at: seconds(NOW - FERRATA_TILE_STALE_MS) },
      { tile_key: '943,224', payload: payload([]), fetched_at: NOW_S },
    ]);
  });
});

describe('FerratasService.list: Overpass failing', () => {
  it('FERSVC-019: turns a failure for a cell never fetched into a 502 with a code, and stores nothing', async () => {
    query.mockRejectedValueOnce(new Error('Could not reach any Overpass endpoint'));
    const err = await service.list(bbox, NOW).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DomainError);
    const domain = err as DomainError;
    expect(domain.getStatus()).toBe(502);
    expect(domain.code).toBe(FERRATAS_UNAVAILABLE_CODE);
    expect(domain.getResponse()).toEqual({ error: FERRATAS_UNAVAILABLE_MESSAGE, code: FERRATAS_UNAVAILABLE_CODE });
    expect(await countRows(orm(), FerrataTiles)).toBe(0);

    const retry = await service.list(bbox, NOW);
    expect(retry.ferratas).toHaveLength(1);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('FERSVC-020: fails every request that joined the failed batch', async () => {
    const pending = deferred();
    query.mockReturnValueOnce(pending.promise);
    const both = Promise.allSettled([service.list(bbox, NOW), service.list(bbox, NOW)]);
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    pending.reject(new Error('down'));
    const results = await both;
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-021: needs no Overpass at all while every cell is stored and fresh', async () => {
    await service.list(bbox, NOW);
    query.mockRejectedValue(new Error('down'));
    const res = await service.list(bbox, NOW + 1);
    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('FERSVC-022: an answer the table refuses to store is still served, and kept in memory', async () => {
    vi.spyOn(FerrataTilesRepository.prototype, 'upsertTiles').mockRejectedValueOnce(new Error('disk full'));

    const res = await service.list(bbox, NOW);

    expect(res.ferratas.map((f) => f.id)).toEqual(['way/42']);
    expect(await countRows(orm(), FerrataTiles)).toBe(0);
    await service.list(bbox, NOW + 1);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
