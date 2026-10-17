import type { PaddleObstacleKind } from '@trek/shared';
import { useMapPaint } from '../../Map/mapPaint';

/**
 * The colours of paddle objects and carried stretches (styles/paddle.css):
 * a kind of object has its colour, never one for safe or unsafe. Map paint
 * reads them resolved (`usePaddlePaint`); markup on the page takes the CSS
 * variable itself (`paddleKindCss`), which follows the theme on its own.
 */
const PADDLE_PAINT_TOKENS = {
  obstacle: '--map-paddle-obstacle',
  access: '--map-paddle-access',
  landing: '--map-paddle-landing',
  portage: '--map-portage',
  rapids: '--map-paddle-rapids',
  gap: '--map-paddle-gap',
  disc: '--map-paddle-disc',
  shadow: '--map-paddle-shadow',
} as const;

export type PaddlePaint = Record<keyof typeof PADDLE_PAINT_TOKENS, string>;
type Category = 'obstacle' | 'access' | 'landing' | 'portage';

const CATEGORY: Record<PaddleObstacleKind, Category> = {
  weir: 'obstacle',
  dam: 'obstacle',
  lock: 'obstacle',
  lock_gate: 'obstacle',
  waterfall: 'obstacle',
  rapids: 'obstacle',
  hazard: 'obstacle',
  access: 'access',
  put_in: 'landing',
  egress: 'landing',
  slipway: 'landing',
  portage: 'portage',
};

/** The resolved colour of a kind, for map paint. */
export function paddleKindPaint(kind: PaddleObstacleKind, paint: PaddlePaint): string {
  return paint[CATEGORY[kind]];
}

/** The colour of a kind as a CSS variable, for markup on the page (the card, the route band). */
export function paddleKindCss(kind: PaddleObstacleKind): string {
  return `var(${PADDLE_PAINT_TOKENS[CATEGORY[kind]]})`;
}

/** A carried stretch's brown, for markup on the page. */
export const PORTAGE_CSS_COLOR = `var(${PADDLE_PAINT_TOKENS.portage})`;

/** The paddle colours resolved for map paint, again whenever the theme changes. */
export function usePaddlePaint(): PaddlePaint {
  return useMapPaint(PADDLE_PAINT_TOKENS);
}
