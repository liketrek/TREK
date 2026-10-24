import type { BookLineElement } from '@trek/shared';

/**
 * The lines and dividers the Elements panel offers, as looks for a new line,
 * and the points each is placed with.
 */

type Look = Partial<Omit<BookLineElement, 'id' | 'kind' | 'frame' | 'points'>>;

export interface LinePreset {
  id: string;
  look: Look;
  /** A curve through three points rather than a straight rule. */
  bend?: boolean;
}

export const LINE_PRESETS: readonly LinePreset[] = [
  { id: 'straight', look: {} },
  { id: 'arrow', look: { endCap: 'arrow' } },
  { id: 'double', look: { startCap: 'arrow', endCap: 'arrow' } },
  { id: 'dashed', look: { dash: 'dashed' } },
  { id: 'dotted', look: { dash: 'dotted', strokeWidth: 0.8 } },
  { id: 'curved', look: { curve: 'smooth', endCap: 'arrow' }, bend: true },
  { id: 'wave', look: { squiggle: 'wave' } },
  { id: 'zigzag', look: { squiggle: 'zigzag' } },
  { id: 'hand', look: { wobble: 0.8, endCap: 'open', strokeWidth: 0.7 } },
  {
    id: 'route',
    look: { dash: 'dotted', strokeWidth: 0.9, curve: 'smooth', startCap: 'dot', endCap: 'arrow' },
    bend: true,
  },
];

export const DIVIDER_PRESETS: readonly LinePreset[] = (['diamond', 'sun', 'star', 'heart', 'dot'] as const).map(
  (o) => ({
    id: `divider-${o}`,
    look: { ornament: o, strokeWidth: 0.3 },
  })
);

/** The points a preset is placed with, in a box `w` wide around a middle line. */
export function presetPoints(p: LinePreset, x: number, y: number, w: number): { x: number; y: number }[] {
  if (!p.bend) {
    return [
      { x, y },
      { x: x + w, y },
    ];
  }
  const rise = w * 0.18;
  return [
    { x, y: y + rise },
    { x: x + w * 0.5, y: y - rise },
    { x: x + w, y: y + rise },
  ];
}
