/**
 * The rating a place carries, as a disc on the corner of its marker.
 *
 * Bottom right, where a trip's day numbers sit — the two never appear together, since
 * a numbered stop is one you have already planned and this answers the question you
 * ask before that: of all these photos, which did I like. Amber rather than the number
 * badge's white, so a glance tells them apart without reading either.
 *
 * A rounded value and no star: at eighteen pixels a star is a smudge, and "4.5" is
 * already the whole sentence.
 */
export function ratingBadgeHtml(rating: number | null | undefined): string {
  if (typeof rating !== 'number' || !(rating > 0)) return '';
  const label = Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
  return `<span style="
    position:absolute;bottom:-4px;right:-4px;
    min-width:18px;height:18px;border-radius:9px;
    padding:0 4px;
    background:#f59e0b;
    border:1.5px solid rgba(255,255,255,0.92);
    box-shadow:0 1px 4px rgba(0,0,0,0.25);
    display:flex;align-items:center;justify-content:center;
    font-size:9px;font-weight:800;color:#fff;
    font-family:var(--font-system);line-height:1;
    box-sizing:border-box;white-space:nowrap;
  ">${label}</span>`;
}
