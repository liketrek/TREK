import { PaddleFeatures } from '../../db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../db/entities/PaddleRegions.entity';
import { PADDLE_FEATURE_GEOMETRY, PADDLE_FEATURE_TAGS, PADDLE_REGION_BOUNDARY } from '../../db/json-columns';
import type { Box, PaddleFeatureRow, PaddleFeaturesRepository } from '../../db/repositories/PaddleFeatures.repository';
import type { PaddleRegionRow, PaddleRegionsRepository } from '../../db/repositories/PaddleRegions.repository';
import { utcSuffix } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import { logWarn } from '../audit/audit-log.logger';
import { badRequest } from '../common/domain-error';
import { coverageOf, coverageOfLine, parseBox } from './paddle-geo';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  NEAR_M,
  PADDLE_OBSTACLES_CAP,
  paddleObstacleKindSchema,
  type PaddleCoverageRegion,
  type PaddleCoverageState,
  type PaddleFeature,
  type PaddleObstaclesResponse,
} from '@trek/shared';

/** The widest a run of a line is read at once, in degrees a side; a long tour is read run by run. */
const RUN_SPAN_DEG = 0.1;
/** How far round the parts of a lock found along a line its other parts are looked for, in degrees (about 2 km). */
const LOCK_PART_MARGIN_DEG = 0.02;

/** What the data holds along a paddle tour's line, as the checklist reads it. */
export interface PaddleObstaclesAlong {
  features: PaddleFeature[];
  regions: PaddleCoverageRegion[];
  coverage: PaddleCoverageState;
  truncated: boolean;
}

/** The boxes a line is read in: runs no wider than RUN_SPAN_DEG, each grown by NEAR_M so nothing near the line is missed. */
function runBoxesOf(points: readonly (readonly [number, number])[]): Box[] {
  const boxes: Box[] = [];
  let box: Box | null = null;
  let last: readonly [number, number] | null = null;
  for (const [lat, lng] of points) {
    if (
      box &&
      Math.max(box.north, lat) - Math.min(box.south, lat) <= RUN_SPAN_DEG &&
      Math.max(box.east, lng) - Math.min(box.west, lng) <= RUN_SPAN_DEG
    ) {
      box = {
        south: Math.min(box.south, lat),
        west: Math.min(box.west, lng),
        north: Math.max(box.north, lat),
        east: Math.max(box.east, lng),
      };
    } else {
      if (box) boxes.push(box);
      // A new run starts at the last point of the one before, so the stretch between them is read too.
      const [fromLat, fromLng] = last ?? [lat, lng];
      box = {
        south: Math.min(fromLat, lat),
        west: Math.min(fromLng, lng),
        north: Math.max(fromLat, lat),
        east: Math.max(fromLng, lng),
      };
    }
    last = [lat, lng];
  }
  if (box) boxes.push(box);
  return boxes.map((run) => {
    const dLat = NEAR_M / 111_195;
    const dLng = dLat / Math.max(0.1, Math.cos((((run.south + run.north) / 2) * Math.PI) / 180));
    return { south: run.south - dLat, west: run.west - dLng, north: run.north + dLat, east: run.east + dLng };
  });
}

export const PADDLE_BOX_INVALID_MESSAGE = 'bbox must be south,west,north,east and at most one degree a side';

function coverageRegionOf(region: PaddleRegionRow): PaddleCoverageRegion {
  return {
    id: region.id,
    name: region.name,
    source_timestamp: region.source_timestamp,
    imported_at: utcSuffix(region.imported_at),
  };
}

function featureOf(row: PaddleFeatureRow): PaddleFeature | null {
  const context = `${row.region_id}/${row.osm_ref}`;
  const kind = paddleObstacleKindSchema.safeParse(row.kind);
  const geometry = decodeJson(PADDLE_FEATURE_GEOMETRY, row.geometry, context);
  if (!kind.success || !geometry) {
    logWarn(`[Paddle] stored object ${context} does not read; left out`);
    return null;
  }
  return {
    ref: row.osm_ref,
    kind: kind.data,
    group_key: row.group_key,
    name: row.name,
    geometry,
    tags: decodeJson(PADDLE_FEATURE_TAGS, row.tags, context),
    tag_hash: row.tag_hash,
    region_id: row.region_id,
  };
}

/**
 * PAD-05A, the reading side: the paddle objects inside a map area and how far
 * TREK's data covers it. An area outside every region answers `none`, not an
 * empty list read as "no obstacles"; one cut at the cap says so. Where two
 * regions overlap (a country and one of its states), an object both hold is
 * answered once.
 */
@Injectable()
export class PaddleObstaclesService {
  constructor(
    @InjectRepository(PaddleFeatures) private readonly features: PaddleFeaturesRepository,
    @InjectRepository(PaddleRegions) private readonly regions: PaddleRegionsRepository,
  ) {}

  async inBox(bbox: string): Promise<PaddleObstaclesResponse> {
    const box = parseBox(bbox);
    if (!box) throw badRequest(PADDLE_BOX_INVALID_MESSAGE);
    return await this.read(box);
  }

  /**
   * The objects along a paddle tour's line (`[lat, lng]` points) and how far
   * the data covers the line itself, for the checklist (PAD-06, PAD-09). The
   * line is read in runs; an object two runs or two regions hold is answered
   * once, and a run cut at the cap marks the whole answer as cut.
   */
  async readAlong(points: readonly (readonly [number, number])[]): Promise<PaddleObstaclesAlong> {
    const boxes = runBoxesOf(points);
    const runs = await Promise.all(
      boxes.map(async (box) => {
        const [rows, regions] = await Promise.all([
          this.features.findInBox(box, PADDLE_OBSTACLES_CAP + 1),
          this.regions.withDataInBox(box),
        ]);
        return { rows, regions };
      }),
    );
    const seen = new Set<string>();
    const features: PaddleFeature[] = [];
    const regions = new Map<string, PaddleRegionRow>();
    const take = (row: PaddleFeatureRow) => {
      if (seen.has(row.osm_ref)) return;
      seen.add(row.osm_ref);
      const feature = featureOf(row);
      if (feature) features.push(feature);
    };
    for (const run of runs) {
      run.rows.slice(0, PADDLE_OBSTACLES_CAP).forEach(take);
      for (const region of run.regions) regions.set(region.id, region);
    }
    // The parts of a lock the corridor cut off: its checklist entry reads the lock whole, however the route runs.
    (await this.lockPartsAround(runs.flatMap((run) => run.rows.slice(0, PADDLE_OBSTACLES_CAP)))).forEach(take);
    const held = [...regions.values()];
    return {
      features,
      regions: held.map(coverageRegionOf),
      coverage: coverageOfLine(
        points,
        held.map((region) => ({
          boundary: decodeJson(PADDLE_REGION_BOUNDARY, region.boundary, region.id),
          box:
            region.min_lat === null || region.min_lng === null || region.max_lat === null || region.max_lng === null
              ? null
              : { south: region.min_lat, west: region.min_lng, north: region.max_lat, east: region.max_lng },
        })),
      ),
      truncated: runs.some((run) => run.rows.length > PADDLE_OBSTACLES_CAP),
    };
  }

  /** Every stored part of the locks among the rows, within a margin round the parts found. */
  private async lockPartsAround(rows: readonly PaddleFeatureRow[]): Promise<PaddleFeatureRow[]> {
    const grouped = rows.filter((row) => row.group_key !== null);
    if (grouped.length === 0) return [];
    const keys = [...new Set(grouped.flatMap((row) => row.group_key ?? []))];
    const box = {
      south: Math.min(...grouped.map((row) => row.min_lat)) - LOCK_PART_MARGIN_DEG,
      west: Math.min(...grouped.map((row) => row.min_lng)) - LOCK_PART_MARGIN_DEG,
      north: Math.max(...grouped.map((row) => row.max_lat)) + LOCK_PART_MARGIN_DEG,
      east: Math.max(...grouped.map((row) => row.max_lng)) + LOCK_PART_MARGIN_DEG,
    };
    return await this.features.findGroupParts(keys, box, PADDLE_OBSTACLES_CAP);
  }

  /**
   * A text that changes whenever the data a checklist reads could have:
   * an object added or removed, a region read again or removed. The checklist
   * caches its reading under it.
   */
  async dataVersion(): Promise<string> {
    const [stats, regions] = await Promise.all([this.features.stats(), this.regions.readTimes()]);
    return `${stats.count}:${stats.max_id ?? '-'}:${regions.map((region) => `${region.id}@${region.imported_at ?? '-'}`).join(';')}`;
  }

  /** The same answer for a box already known to be valid, for the server's own route checks. */
  async read(box: Box): Promise<PaddleObstaclesResponse> {
    const [rows, regions] = await Promise.all([
      this.features.findInBox(box, PADDLE_OBSTACLES_CAP + 1),
      this.regions.withDataInBox(box),
    ]);
    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      if (seen.has(row.osm_ref)) return false;
      seen.add(row.osm_ref);
      return true;
    });
    return {
      features: unique.slice(0, PADDLE_OBSTACLES_CAP).flatMap((row) => featureOf(row) ?? []),
      coverage: {
        state: coverageOf(
          box,
          regions.map((region) => decodeJson(PADDLE_REGION_BOUNDARY, region.boundary, region.id)),
        ),
        regions: regions.map(coverageRegionOf),
      },
      truncated: unique.length > PADDLE_OBSTACLES_CAP,
    };
  }
}
