/**
 * How much of the atlas map's edges a screen's own chrome covers, in px: the
 * touch shell's rail along the leading edge, its floating header along the top.
 * The phone screen measures them (MAtlas), the camera keeps clear of them.
 */
export interface AtlasChromeInsets {
  top: number;
  start: number;
}

/** Arabic runs right to left, and the rail stands on the right then. */
function documentRtl(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
}

/** The northern edge of the inhabited world, which the opening view keeps below the header. */
export const NORTH_EDGE_LAT = 75;

/**
 * The pan that fits the opening view to what the chrome leaves free, or null
 * when there is nothing to move. Sideways the centre moves into the middle of
 * the map beside the rail. Upwards the world moves down only as far as its
 * inhabited top (NORTH_EDGE_LAT, at `northEdgeY` in the map's own pixels) needs
 * to clear the header: a tall window shows it below the header anyway, a phone
 * had the stars of the far north under it. Leaflet pans the camera, so the
 * numbers point the other way from the world's move.
 */
export function chromePan(
  insets: AtlasChromeInsets | undefined,
  northEdgeY: number,
  rtl = documentRtl()
): [number, number] | null {
  if (!insets) return null;
  const x = insets.start ? (rtl ? 1 : -1) * (insets.start / 2) : 0;
  const y = Math.min(0, northEdgeY - insets.top);
  return x || y ? [x, y] : null;
}

/** The padding a country is framed with, wider on the rail's side and under the header. */
export function chromeFitPadding(
  insets: AtlasChromeInsets | undefined,
  rtl = documentRtl()
): { paddingTopLeft: [number, number]; paddingBottomRight: [number, number] } {
  const start = insets?.start ?? 0;
  return {
    paddingTopLeft: [24 + (rtl ? 0 : start), 24 + (insets?.top ?? 0)],
    paddingBottomRight: [24 + (rtl ? start : 0), 24],
  };
}
