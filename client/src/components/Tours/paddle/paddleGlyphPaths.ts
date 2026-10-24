import type { PaddleObstacleKind } from '@trek/shared';

/**
 * The paddler's symbols as SVG paths on lucide's 24 grid, one source for the
 * React glyph and the map markers (Leaflet takes markup, not components).
 */
export type PaddleGlyphKind =
  'lock' | 'weir' | 'dam' | 'rapids' | 'waterfall' | 'put_in' | 'take_out' | 'portage' | 'hazard' | 'access';

const WAVE = 'M3 18c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0';

export const PADDLE_GLYPH_PATHS: Record<PaddleGlyphKind, readonly string[]> = {
  lock: ['M3 7h18', 'M3 17h18', 'M4 7l3 5-3 5', 'M20 7l-3 5 3 5', 'M9 12h6'],
  weir: ['M2 8h7c3 0 3 8 6 8h7', 'M9 8v12', 'M15 20h7'],
  dam: ['M9 4h5l5 16H5z', 'M2 9h5', 'M2 13h4'],
  rapids: [
    'M2 7l3 2 3-2 3 2 3-2 3 2 3-2 2 1.5',
    'M2 12l3 2 3-2 3 2 3-2 3 2 3-2 2 1.5',
    'M2 17l3 2 3-2 3 2 3-2 3 2 3-2 2 1.5',
  ],
  waterfall: ['M3 5h9v14', 'M15 9v10', 'M19 7v12', 'M3 19h18'],
  put_in: ['M12 3v10', 'M8 9l4 4 4-4', WAVE],
  take_out: ['M12 14V4', 'M8 8l4-4 4 4', WAVE],
  // lucide's footprints
  portage: [
    'M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z',
    'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z',
    'M16 17h4',
    'M4 13h4',
  ],
  hazard: ['M12 3 2 20h20Z', 'M12 9v5', 'M12 17h.01'],
  // lucide's ban
  access: ['M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z', 'M4.929 4.929 19.07 19.071'],
};

/** The symbol an obstacle of a kind is shown with. */
export const OBSTACLE_GLYPH: Record<PaddleObstacleKind, PaddleGlyphKind> = {
  weir: 'weir',
  dam: 'dam',
  lock: 'lock',
  lock_gate: 'lock',
  waterfall: 'waterfall',
  rapids: 'rapids',
  hazard: 'hazard',
  put_in: 'put_in',
  slipway: 'put_in',
  egress: 'take_out',
  portage: 'portage',
  access: 'access',
};

/** The symbol as SVG markup for a map marker; it carries no user content. */
export function paddleGlyphSvg(kind: PaddleGlyphKind, size: number, color: string): string {
  const paths = PADDLE_GLYPH_PATHS[kind].map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
