import { TrekPlacesLayersService } from '../maps/trek-places-layers.service';
import { OverpassElementsClient } from '../overpass/overpass-elements.service';
import { Injectable } from '@nestjs/common';
import {
  OSM_TAG_VALUE_MAX,
  sacScaleSchema,
  type TourTrailGrade,
  type TourTrailGradeRequest,
  type TourTrailGradeResponse,
} from '@trek/shared';

import { z } from 'zod';

/** Ways per Overpass question: a query names them all, and a shorter one answers sooner. */
const WAYS_PER_QUERY = 400;
/** How long a way's grades are kept: OpenStreetMap changes slowly, and the sources are shared. */
const KEPT_MS = 24 * 60 * 60 * 1000;
/** The most ways kept at once; the oldest go first. */
const MAX_KEPT = 50_000;

const wayElementSchema = z.object({
  type: z.literal('way'),
  id: z.number().int().positive(),
  tags: z.record(z.string(), z.string()).optional(),
});

/** A tag's value as a step of its scale (`S2` and ` 2 ` read as 2), or null when it is none. */
function step(value: string | undefined, top: number, signed: boolean): string | null {
  const match = /^\s*S?([0-9])([+-])?\s*$/i.exec(value ?? '');
  if (!match || Number(match[1]) > top) return null;
  return signed ? `${match[1]}${match[2] ?? ''}` : match[1];
}

/**
 * MAP-04: a tag's value as OpenStreetMap wrote it, only trimmed and bounded,
 * never normalised: the planner groups it and says what was written.
 */
function written(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.slice(0, OSM_TAG_VALUE_MAX) : null;
}

/**
 * MAP-03: a way's `sac_scale` as one of the scale's six values, read exactly
 * as OpenStreetMap wrote it (only trimmed). A value that is not one of them
 * word for word (`T3`, `Alpine_Hiking`, `hiking;mountain_hiking`, a typo) is
 * handed on as written and never read to a step, so the planner says unclear
 * and shows what was written rather than a value TREK made up.
 */
function sacOf(value: string | undefined): Pick<TourTrailGrade, 'sac_scale' | 'sac_scale_unclear'> {
  const text = written(value);
  if (!text) return { sac_scale: null, sac_scale_unclear: null };
  const known = sacScaleSchema.safeParse(text);
  if (known.success) return { sac_scale: known.data, sac_scale_unclear: null };
  return { sac_scale: null, sac_scale_unclear: text };
}

function gradeOf(id: number, tags: Record<string, string> = {}): TourTrailGrade | null {
  const grade: TourTrailGrade = {
    id,
    mtb_scale: step(tags['mtb:scale'], 6, true),
    mtb_scale_uphill: step(tags['mtb:scale:uphill'], 5, true),
    mtb_scale_imba: step(tags['mtb:scale:imba'], 4, false),
    ...sacOf(tags['sac_scale']),
    surface: written(tags['surface']),
    highway: written(tags['highway']),
  };
  // A way none of whose values is recorded is left out: the planner reads its absence as unknown.
  return Object.entries(grade).some(([key, value]) => key !== 'id' && value !== null) ? grade : null;
}

/**
 * BIK-05, MAP-03 and MAP-04: what OpenStreetMap records for the ways a tour
 * runs on (the mountain bike scales; the SAC hiking scale, the surface and the
 * kind of way of a hike). Read from the TREK Places ways layer, and through the
 * operator's Overpass mirrors only when that cannot answer: switched off, not
 * built yet, or failing. What was read is kept a day, so the same tour asked
 * about again costs nobody anything; ways no source could answer are said,
 * never guessed.
 */
@Injectable()
export class TourTrailGradeService {
  private readonly kept = new Map<number, { grade: TourTrailGrade | null; at: number }>();

  constructor(
    private readonly layers: TrekPlacesLayersService,
    private readonly overpass: OverpassElementsClient,
  ) {}

  async grades(request: TourTrailGradeRequest): Promise<TourTrailGradeResponse> {
    const now = Date.now();
    const ids = [...new Set(request.way_ids)];
    const unknown = ids.filter((id) => {
      const known = this.kept.get(id);
      return !known || now - known.at > KEPT_MS;
    });
    const unanswered = unknown.length === 0 ? [] : await this.read(unknown, now);
    const ways = ids.flatMap((id) => {
      const grade = this.kept.get(id)?.grade;
      return grade ? [grade] : [];
    });
    return { ways, unanswered };
  }

  /**
   * Reads the grades of the ways not kept yet into what is kept: from the ways
   * layer first, then from the mirrors part by part for the ways the layer
   * did not answer (all of them when it gave nothing, only the rest when it
   * stopped part way). Gives back the ways no source answered.
   */
  private async read(ids: number[], now: number): Promise<number[]> {
    const layer = await this.layers.wayTags(ids);
    let rest = ids;
    if (layer.ok) {
      const open = new Set(layer.value.complete === false ? layer.value.unanswered : []);
      this.keepAll(
        ids.filter((id) => !open.has(id)),
        layer.value.ways,
        now,
      );
      rest = ids.filter((id) => open.has(id));
    }
    const parts = Array.from({ length: Math.ceil(rest.length / WAYS_PER_QUERY) }, (_, index) =>
      rest.slice(index * WAYS_PER_QUERY, (index + 1) * WAYS_PER_QUERY),
    );
    // One question after another, so a long tour does not flood the shared mirrors.
    return parts.reduce<Promise<number[]>>(async (done, part) => {
      const failed = await done;
      return (await this.askOverpass(part, now)) ? failed : [...failed, ...part];
    }, Promise.resolve([]));
  }

  /** Reads one part's grades from the mirrors into what is kept; false when no mirror answered. */
  private async askOverpass(ids: number[], now: number): Promise<boolean> {
    let elements: unknown[];
    try {
      elements = await this.overpass.query(`[out:json][timeout:25];way(id:${ids.join(',')});out tags;`, 'Tours');
    } catch {
      return false;
    }
    this.keepAll(ids, elements, now);
    return true;
  }

  /** Keeps a grade, or that there is none, for every way asked, out of the elements one source answered. */
  private keepAll(ids: readonly number[], elements: readonly unknown[], now: number): void {
    const tagged = new Map<number, Record<string, string> | undefined>();
    for (const element of elements) {
      const way = wayElementSchema.safeParse(element);
      if (way.success) tagged.set(way.data.id, way.data.tags);
    }
    // A way the answer leaves out has no tags worth naming, or no longer exists: no grade either way.
    for (const id of ids) this.keep(id, gradeOf(id, tagged.get(id)), now);
  }

  private keep(id: number, grade: TourTrailGrade | null, at: number): void {
    this.kept.delete(id);
    this.kept.set(id, { grade, at });
    if (this.kept.size > MAX_KEPT) {
      const oldest = this.kept.keys().next().value;
      if (oldest !== undefined) this.kept.delete(oldest);
    }
  }
}
