/**
 * PaddleObstaclesService over a snapshot db: the objects of a box with how far
 * the regions cover it (none, partial, covered), the cap, the span limit, an
 * object two overlapping regions both hold answered once, and a stored row
 * that does not read left out.
 */
import { PaddleFeatures } from '../../../../src/db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../../../src/db/entities/PaddleRegions.entity';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { PaddleObstaclesModule } from '../../../../src/nest/paddle-obstacles/paddle-obstacles.module';
import {
  PADDLE_BOX_INVALID_MESSAGE,
  PaddleObstaclesService,
} from '../../../../src/nest/paddle-obstacles/paddle-obstacles.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows, insertRow, insertRows, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { PADDLE_OBSTACLES_CAP, paddleObstaclesResponseSchema } from '@trek/shared';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const log = vi.hoisted(() => ({ logInfo: vi.fn(), logWarn: vi.fn(), logError: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  ...log,
}));

const db = createSnapshotTestDb();
let t: TestModule | undefined;
let service: PaddleObstaclesService;
const orm = () => {
  if (!t) throw new Error('No container booted');
  return t.get(MikroORM);
};

/** The Oberpfalz as a square, 48.9 to 50 north and 11.5 to 13 east. */
const oberpfalz = {
  type: 'Polygon',
  coordinates: [
    [
      [11.5, 48.9],
      [13, 48.9],
      [13, 50],
      [11.5, 50],
      [11.5, 48.9],
    ],
  ],
};

async function region(id: string, options: { boundary?: object | null; imported?: boolean } = {}) {
  const boundary = options.boundary === undefined ? oberpfalz : options.boundary;
  await insertRow(orm(), PaddleRegions, {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    boundary: boundary ? JSON.stringify(boundary) : null,
    min_lat: 48.9,
    min_lng: 11.5,
    max_lat: 50,
    max_lng: 13,
    status: options.imported === false ? 'queued' : 'ready',
    feature_count: 0,
    source_timestamp: '2026-10-01T00:00:00.000Z',
    imported_at: options.imported === false ? null : '2026-10-02 04:20:00',
  });
}

const weir = (regionId: string, ref: string, lat: number, lng: number) => ({
  region: regionId,
  osm_ref: ref,
  kind: 'weir',
  group_key: null,
  name: 'Wehr',
  geometry: JSON.stringify({ type: 'Point', coordinates: [lng, lat] }),
  tags: JSON.stringify({ waterway: 'weir', name: 'Wehr' }),
  tag_hash: `hash-${ref}`,
  min_lat: lat,
  min_lng: lng,
  max_lat: lat,
  max_lng: lng,
});

beforeEach(async () => {
  resetTestDb(db);
  await t?.close();
  t = await createTestModule({ db, imports: [AppConfigModule, DemoModule, PaddleObstaclesModule] });
  service = t.get(PaddleObstaclesService);
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await t?.close();
  db.close();
});

describe('PaddleObstaclesService.inBox', () => {
  it('PADOBS-001: an area outside every region answers none, not an empty all-clear', async () => {
    const res = await service.inBox('53.2,12.8,53.3,13.0');
    expect(res).toEqual({ features: [], coverage: { state: 'none', regions: [] }, truncated: false });
    expect(paddleObstaclesResponseSchema.safeParse(res).success).toBe(true);
  });

  it('PADOBS-002: an area inside a region answers its objects and covered, with the date of the data', async () => {
    await region('oberpfalz');
    await insertRows(orm(), PaddleFeatures, [weir('oberpfalz', 'way/29256405', 49.1235, 12.131)]);

    const res = await service.inBox('49.1,12.1,49.2,12.2');

    expect(res.coverage).toEqual({
      state: 'covered',
      regions: [
        {
          id: 'oberpfalz',
          name: 'Oberpfalz',
          source_timestamp: '2026-10-01T00:00:00.000Z',
          imported_at: '2026-10-02T04:20:00Z',
        },
      ],
    });
    expect(res.features).toEqual([
      {
        ref: 'way/29256405',
        kind: 'weir',
        group_key: null,
        name: 'Wehr',
        geometry: { type: 'Point', coordinates: [12.131, 49.1235] },
        tags: { waterway: 'weir', name: 'Wehr' },
        tag_hash: 'hash-way/29256405',
        region_id: 'oberpfalz',
      },
    ]);
    expect(paddleObstaclesResponseSchema.safeParse(res).success).toBe(true);
  });

  it('PADOBS-003: an area reaching past the region is partly covered; a covered area without objects stays covered', async () => {
    await region('oberpfalz');
    expect((await service.inBox('49.9,12.9,50.1,13.1')).coverage.state).toBe('partial');
    const empty = await service.inBox('49.3,12.3,49.4,12.4');
    expect(empty).toMatchObject({ features: [], coverage: { state: 'covered' }, truncated: false });
  });

  it('PADOBS-004: a region being read again, or whose last read failed, still counts with the data it has', async () => {
    await region('oberpfalz');
    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { status: 'importing' });
    expect((await service.inBox('49.1,12.1,49.2,12.2')).coverage.state).toBe('covered');
  });

  it('PADOBS-005: a region not read yet does not count', async () => {
    await region('oberpfalz', { imported: false });
    expect((await service.inBox('49.1,12.1,49.2,12.2')).coverage.state).toBe('none');
  });

  it('PADOBS-006: a region without a boundary counts by its box', async () => {
    await region('oberpfalz', { boundary: null });
    expect((await service.inBox('49.1,12.1,49.2,12.2')).coverage.state).toBe('covered');
  });

  it('PADOBS-007: an object two overlapping regions both hold is answered once', async () => {
    await region('oberpfalz');
    await region('bayern');
    await insertRows(orm(), PaddleFeatures, [
      weir('oberpfalz', 'node/1', 49.15, 12.15),
      weir('bayern', 'node/1', 49.15, 12.15),
      weir('bayern', 'node/2', 49.16, 12.16),
    ]);
    const res = await service.inBox('49.1,12.1,49.2,12.2');
    expect(res.features.map((feature) => feature.ref)).toEqual(['node/1', 'node/2']);
    expect(res.coverage.regions.map((entry) => entry.id)).toEqual(['bayern', 'oberpfalz']);
  });

  it('PADOBS-008: cuts the answer at the cap and says so', async () => {
    await region('oberpfalz');
    const many = Array.from({ length: PADDLE_OBSTACLES_CAP + 5 }, (_, i) =>
      weir('oberpfalz', `node/${i + 1}`, 49.1 + (i % 100) * 0.0005, 12.1 + Math.floor(i / 100) * 0.0005),
    );
    await insertRows(orm(), PaddleFeatures, many);
    const res = await service.inBox('49.1,12.1,49.2,12.2');
    expect(res.features).toHaveLength(PADDLE_OBSTACLES_CAP);
    expect(res.truncated).toBe(true);
  });

  it('PADOBS-009: leaves out a stored object that does not read, and logs it', async () => {
    await region('oberpfalz');
    await insertRows(orm(), PaddleFeatures, [
      { ...weir('oberpfalz', 'node/1', 49.15, 12.15), geometry: '{broken' },
      { ...weir('oberpfalz', 'node/2', 49.15, 12.15), kind: 'castle' },
      { ...weir('oberpfalz', 'node/3', 49.15, 12.15), tags: '[]' },
    ]);
    const res = await service.inBox('49.1,12.1,49.2,12.2');
    expect(res.features.map((feature) => [feature.ref, feature.tags])).toEqual([['node/3', {}]]);
    expect(log.logWarn).toHaveBeenCalledWith('[Paddle] stored object oberpfalz/node/1 does not read; left out');
    expect(log.logWarn).toHaveBeenCalledWith('[Paddle] stored object oberpfalz/node/2 does not read; left out');
    expect(log.logWarn).toHaveBeenCalledWith(expect.stringContaining('paddle_features.tags (oberpfalz/node/3)'));
  });

  it.each(['49,12,50.5,12.5', '49.2,12,49.1,12.1', '1,2,3'])(
    'PADOBS-010: refuses the box %s with the bbox message',
    async (bbox) => {
      const err = await service.inBox(bbox).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(DomainError);
      expect(err).toMatchObject({ status: 400, publicMessage: PADDLE_BOX_INVALID_MESSAGE });
    },
  );
});

describe('PaddleObstaclesService.readAlong', () => {
  it('PADOBS-011: reads a long line run by run, answers an object two runs or regions hold once, and covers the line itself', async () => {
    await region('oberpfalz');
    await region('bayern');
    // A line 0.3 degrees east, three runs: a weir at its start, one in its middle, held twice.
    await insertRows(orm(), PaddleFeatures, [
      weir('oberpfalz', 'node/1', 49.2, 12.0),
      weir('oberpfalz', 'node/2', 49.2, 12.15),
      weir('bayern', 'node/2', 49.2, 12.15),
      weir('oberpfalz', 'node/3', 49.6, 12.15),
    ]);
    const along = await service.readAlong([
      [49.2, 12.0],
      [49.2, 12.3],
    ]);
    expect(along.features.map((feature) => feature.ref).sort()).toEqual(['node/1', 'node/2']);
    expect(along.regions.map((entry) => entry.id).sort()).toEqual(['bayern', 'oberpfalz']);
    expect(along).toMatchObject({ coverage: 'covered', truncated: false });
  });

  it('PADOBS-012: a line past the edge of the data is partly covered, one outside every region not at all', async () => {
    await region('oberpfalz');
    expect(
      (
        await service.readAlong([
          [49.9, 12.5],
          [50.2, 12.5],
        ])
      ).coverage,
    ).toBe('partial');
    expect(
      await service.readAlong([
        [53.2, 12.8],
        [53.25, 12.9],
      ]),
    ).toEqual({ features: [], regions: [], coverage: 'none', truncated: false });
  });

  it('PADOBS-013: a run cut at the cap marks the whole answer as cut', async () => {
    await region('oberpfalz');
    const many = Array.from({ length: PADDLE_OBSTACLES_CAP + 1 }, (_, i) =>
      weir('oberpfalz', `node/${i + 1}`, 49.2 + (i % 50) * 0.0001, 12.1 + Math.floor(i / 50) * 0.0001),
    );
    await insertRows(orm(), PaddleFeatures, many);
    const along = await service.readAlong([
      [49.2, 12.1],
      [49.21, 12.11],
    ]);
    expect(along.truncated).toBe(true);
    expect(along.features).toHaveLength(PADDLE_OBSTACLES_CAP);
  });
});

describe('PaddleObstaclesService.dataVersion', () => {
  it('PADOBS-014: changes when objects are added or removed and when a region is read again or removed', async () => {
    const empty = await service.dataVersion();
    await region('oberpfalz');
    const withRegion = await service.dataVersion();
    expect(withRegion).not.toBe(empty);
    await insertRows(orm(), PaddleFeatures, [weir('oberpfalz', 'node/1', 49.2, 12.0)]);
    const withObject = await service.dataVersion();
    expect(withObject).not.toBe(withRegion);
    expect(await service.dataVersion()).toBe(withObject);
    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { imported_at: '2026-11-03 04:20:00' });
    const readAgain = await service.dataVersion();
    expect(readAgain).not.toBe(withObject);
    await deleteRows(orm(), PaddleRegions, { id: 'oberpfalz' });
    expect(await service.dataVersion()).toBe(empty);
  });
});

describe('PaddleObstaclesService.readAlong: whole locks', () => {
  it('PADOBS-015: a lock the corridor cuts through comes with its parts beyond it, other locks and objects do not', async () => {
    await region('oberpfalz');
    const part = (ref: string, lat: number, lng: number, group: string | null) => ({
      ...weir('oberpfalz', ref, lat, lng),
      kind: 'lock_gate',
      group_key: group,
    });
    await insertRows(orm(), PaddleFeatures, [
      part('node/1', 49.2, 12.005, 'lock:node/1'),
      // 1.1 km north of the line, out of the corridor but part of the same lock.
      part('node/2', 49.21, 12.005, 'lock:node/1'),
      // Another lock out there, and a lone weir.
      part('node/3', 49.21, 12.006, 'lock:node/3'),
      weir('oberpfalz', 'node/4', 49.21, 12.007),
    ]);
    const along = await service.readAlong([
      [49.2, 12.0],
      [49.2, 12.01],
    ]);
    expect(along.features.map((feature) => feature.ref).sort()).toEqual(['node/1', 'node/2']);
  });
});
