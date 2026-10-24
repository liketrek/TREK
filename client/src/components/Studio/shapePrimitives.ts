/**
 * The building blocks the shape tables are drawn with, on a 0..100 square.
 *
 * Shared by shapes.ts, shapes-more.ts and shapes-cutouts.ts, which is why they
 * live apart from any one table. Every path they build keeps to the subset
 * `scalePath` depends on (see the note at the top of shapes.ts): absolute M,
 * L, C, Q and Z, numbers alternating x and y.
 */

/** Circle-to-cubic constant: the handle length that makes a quarter arc. */
export const K = 0.5523;

export const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Stretch a ring of points to fill the 0..100 box exactly.
 *
 * A regular hexagon inscribed in a circle is 86.6 units wide and 100 tall, and
 * drawn that way it would leave 7 units of nothing down each side of its own
 * frame. In an editor that is a real problem rather than a cosmetic one: the
 * selection outline, the resize handles and every snap target follow the frame,
 * so a shape that does not fill its frame cannot be aligned to anything you can
 * see. Filling the box is also what Canva does, and it costs a regularity
 * nobody can spot: a hexagon in a square frame still reads as a hexagon.
 */
function fit(points: [number, number][]): string {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const sx = maxX > minX ? 100 / (maxX - minX) : 1;
  const sy = maxY > minY ? 100 / (maxY - minY) : 1;
  return `M${points.map(([x, y]) => `${r2((x - minX) * sx)} ${r2((y - minY) * sy)}`).join('L')}Z`;
}

/** A regular polygon, first point at the top, stretched to fill the box. */
export function polygon(sides: number, rotation = -90): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rotation + (360 / sides) * i) * Math.PI) / 180;
    pts.push([50 + 50 * Math.cos(a), 50 + 50 * Math.sin(a)]);
  }
  return fit(pts);
}

/**
 * A star, `points` tips alternating with `points` valleys.
 *
 * `inner` is the valley radius as a fraction of the tip radius, and it is the
 * only number that decides whether a star looks like a star or like a gear:
 * roughly 0.38 for five points, higher as the count grows, or the tips get so
 * thin they disappear at print size.
 */
export function star(points: number, inner: number, rotation = -90): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? 50 : 50 * inner;
    const a = ((rotation + (180 / points) * i) * Math.PI) / 180;
    pts.push([50 + rad * Math.cos(a), 50 + rad * Math.sin(a)]);
  }
  return fit(pts);
}

/**
 * A scalloped edge: a wax seal, a sticker, a burst.
 *
 * Not a star with a soft inner radius: the lobes have to bulge *outwards*
 * between the points, which needs a curve through each valley rather than a
 * straight line to it.
 */
export function scallop(lobes: number, depth: number): string {
  const step = (Math.PI * 2) / lobes;
  /*
   * The petal tip is the curve's midpoint, not its control point.
   *
   * A quadratic at t=0.5 sits a quarter of the way to each end and half the way
   * to the control, so the furthest the outline actually reaches is
   * `0.5·R·cos(Δ/2) + 0.5·rm`, well short of `rm` itself. Sizing from `rm`
   * would draw a flower that overflows its box by a tenth and gets clipped;
   * solving for that midpoint instead makes the drawn petals touch the edge
   * exactly, which is what "normalised to 0..100" has to mean.
   */
  const reach = 0.5 * Math.cos(step / 2) + 0.5 * (1 + depth);
  const R = 50 / reach;
  const rm = R * (1 + depth);
  let d = '';
  for (let i = 0; i < lobes; i++) {
    const a0 = -Math.PI / 2 + step * i;
    const a1 = a0 + step;
    const am = (a0 + a1) / 2;
    const x0 = r2(50 + R * Math.cos(a0)),
      y0 = r2(50 + R * Math.sin(a0));
    const x1 = r2(50 + R * Math.cos(a1)),
      y1 = r2(50 + R * Math.sin(a1));
    const xm = r2(50 + rm * Math.cos(am)),
      ym = r2(50 + rm * Math.sin(am));
    d += i === 0 ? `M${x0} ${y0}` : '';
    d += `Q${xm} ${ym} ${x1} ${y1}`;
  }
  return `${d}Z`;
}

/** A circle as four cubics. */
export function circle(cx = 50, cy = 50, rx = 50, ry = 50): string {
  const kx = rx * K,
    ky = ry * K;
  return (
    `M${r2(cx)} ${r2(cy - ry)}` +
    `C${r2(cx + kx)} ${r2(cy - ry)} ${r2(cx + rx)} ${r2(cy - ky)} ${r2(cx + rx)} ${r2(cy)}` +
    `C${r2(cx + rx)} ${r2(cy + ky)} ${r2(cx + kx)} ${r2(cy + ry)} ${r2(cx)} ${r2(cy + ry)}` +
    `C${r2(cx - kx)} ${r2(cy + ry)} ${r2(cx - rx)} ${r2(cy + ky)} ${r2(cx - rx)} ${r2(cy)}` +
    `C${r2(cx - rx)} ${r2(cy - ky)} ${r2(cx - kx)} ${r2(cy - ry)} ${r2(cx)} ${r2(cy - ry)}Z`
  );
}

/** A rounded rectangle, corner radius in the same 0..100 units. */
export function roundRect(r: number, x = 0, y = 0, w = 100, h = 100): string {
  const k = r * (1 - K);
  return (
    `M${r2(x + r)} ${r2(y)}L${r2(x + w - r)} ${r2(y)}` +
    `C${r2(x + w - k)} ${r2(y)} ${r2(x + w)} ${r2(y + k)} ${r2(x + w)} ${r2(y + r)}` +
    `L${r2(x + w)} ${r2(y + h - r)}` +
    `C${r2(x + w)} ${r2(y + h - k)} ${r2(x + w - k)} ${r2(y + h)} ${r2(x + w - r)} ${r2(y + h)}` +
    `L${r2(x + r)} ${r2(y + h)}` +
    `C${r2(x + k)} ${r2(y + h)} ${r2(x)} ${r2(y + h - k)} ${r2(x)} ${r2(y + h - r)}` +
    `L${r2(x)} ${r2(y + r)}` +
    `C${r2(x)} ${r2(y + k)} ${r2(x + k)} ${r2(y)} ${r2(x + r)} ${r2(y)}Z`
  );
}
