import type { SkiDiscipline, SkiTechnique, TourListItem } from '@trek/shared';
import { CableCar, createLucideIcon, Snowflake, Spline, TrendingUp, type LucideIcon } from 'lucide-react';

/**
 * SKI-02: a snowboard seen from above, laid across the square with its two
 * bindings. Lucide has no board, and the snowflake is the winter hike's mark:
 * both sit in the same corner badge, so the board needs a glyph of its own to
 * be told apart there.
 */
const BOARD = 'rotate(-45 12 12)';
const Snowboard = createLucideIcon('snowboard', [
  ['rect', { x: '1.5', y: '8.5', width: '21', height: '7', rx: '3.5', transform: BOARD, key: 'board' }],
  ['path', { d: 'M8.5 10v4', transform: BOARD, key: 'binding-front' }],
  ['path', { d: 'M15.5 10v4', transform: BOARD, key: 'binding-back' }],
]);

/**
 * SKI-02: a snowshoe seen from above, the racket frame narrowing to its tail,
 * with the lacing across and the binding in the middle. Footprints already
 * mean a city walk and a walk's moving time, so a snowshoe tile marked with
 * them would read as a walk.
 */
const Snowshoe = createLucideIcon('snowshoe', [
  ['path', { d: 'M12 3c3.3 0 5.5 2.8 5.5 6.5 0 4-2.4 7.6-5.5 12-3.1-4.4-5.5-8-5.5-12S8.7 3 12 3z', key: 'frame' }],
  ['path', { d: 'M7 7.5h10', key: 'lacing-front' }],
  ['path', { d: 'M7.3 13.5h9.4', key: 'lacing-back' }],
  ['path', { d: 'M12 3v18.5', key: 'lacing-middle' }],
  ['path', { d: 'M9.5 10.5h5', key: 'binding' }],
]);

/**
 * SKI-02: the icon each discipline goes by, each its own: a lift for alpine
 * skiing, a board for snowboarding, a winding trail for cross-country, the
 * climb on skins for ski touring, a snowshoe for snowshoeing and a snowflake
 * for winter hiking. They all take the same corner of a tile, so no two share
 * a glyph, none is the tile's own mountain, and none is the mark of another
 * tour type or fact (footprints stay the walk's).
 */
export const SKI_DISCIPLINE_ICON: Record<SkiDiscipline, LucideIcon> = {
  alpine: CableCar,
  snowboard: Snowboard,
  cross_country: Spline,
  touring: TrendingUp,
  snowshoe: Snowshoe,
  winter_hike: Snowflake,
};

export type SkiTour = Partial<Pick<TourListItem, 'tour_type' | 'ski_discipline' | 'ski_technique'>>;

/** The discipline of a ski tour, or null for any other tour and a ski track listed before it had one. */
export function skiDisciplineOf(tour: SkiTour): SkiDiscipline | null {
  return tour.tour_type === 'ski' ? (tour.ski_discipline ?? null) : null;
}

/** A cross-country tour's technique; null for every other discipline and type. */
export function skiTechniqueOf(tour: SkiTour): SkiTechnique | null {
  return skiDisciplineOf(tour) === 'cross_country' ? (tour.ski_technique ?? null) : null;
}

/** The classification in words, the discipline and a cross-country technique, as one tooltip reads it. */
export function skiClassificationText(tour: SkiTour, t: (key: string) => string): string | null {
  const discipline = skiDisciplineOf(tour);
  if (!discipline) return null;
  const technique = skiTechniqueOf(tour);
  const name = t(`tours.ski.discipline.${discipline}`);
  return technique ? `${name}, ${t('tours.ski.technique')}: ${t(`tours.ski.technique.${technique}`)}` : name;
}
