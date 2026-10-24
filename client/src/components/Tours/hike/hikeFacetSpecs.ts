import type { HikeFacetSpec } from './hikeFacets';
import { SAC_FACET } from './sacGrades';
import { SURFACE_FACET, WAY_FACET } from './wayTagFacets';

/** What a hike's card reads along the line, one at a time: the SAC grade, the surface or the kind of way. */
export type HikeFacet = 'sac' | 'surface' | 'way';

export const HIKE_FACETS: Readonly<Record<HikeFacet, HikeFacetSpec<string>>> = {
  sac: SAC_FACET,
  surface: SURFACE_FACET,
  way: WAY_FACET,
};
