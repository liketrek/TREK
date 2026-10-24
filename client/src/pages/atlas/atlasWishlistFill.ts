/**
 * The striped fill that marks a wishlist country or region on the atlas map. It
 * lives apart from useAtlas because it only touches the DOM and a canvas, never
 * the hook's state.
 */

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.substring(0, 2), 16);
  const g = Number.parseInt(clean.substring(2, 4), 16);
  const b = Number.parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * The same diagonal stripes for the region layer, which draws with SVG where a
 * CanvasPattern means nothing (#1901): an SVG pattern kept in one hidden defs
 * block, referenced by `url(#id)`. Built once per colour and theme.
 */
export function svgWishlistFill(color: string, dark: boolean): string {
  const id = `trek-wish-${color.replace('#', '')}-${dark ? 'd' : 'l'}`;
  if (typeof document === 'undefined') return color;
  if (!document.getElementById(id)) {
    const ns = 'http://www.w3.org/2000/svg';
    let host: Element | null = document.getElementById('trek-wish-patterns');
    if (!host) {
      host = document.createElementNS(ns, 'svg');
      host.id = 'trek-wish-patterns';
      host.setAttribute('width', '0');
      host.setAttribute('height', '0');
      host.setAttribute('aria-hidden', 'true');
      host.setAttribute('style', 'position:absolute');
      host.appendChild(document.createElementNS(ns, 'defs'));
      document.body.appendChild(host);
    }
    const pattern = document.createElementNS(ns, 'pattern');
    pattern.id = id;
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '8');
    pattern.setAttribute('height', '8');
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('width', '8');
    bg.setAttribute('height', '8');
    bg.setAttribute('fill', hexToRgba(color, dark ? 0.14 : 0.2));
    const stripes = document.createElementNS(ns, 'path');
    stripes.setAttribute('d', 'M-1,9 L9,-1 M-1,1 L1,-1 M7,9 L9,7');
    stripes.setAttribute('stroke', color);
    stripes.setAttribute('stroke-width', '2');
    pattern.append(bg, stripes);
    host.firstElementChild!.appendChild(pattern);
  }
  return `url(#${id})`;
}

// Diagonal-stripe CanvasPattern for the wishlist country fill, in that
// country's own "if visited" color — built once per render pass so it
// survives Leaflet's Canvas renderer (ctx.fillStyle accepts a CanvasPattern
// object same as a color string). Returns null in environments without a
// real 2D canvas context (e.g. jsdom in tests), so callers must fall back to
// a plain color.
export function createWishlistPattern(color: string, dark: boolean): CanvasPattern | null {
  try {
    const size = 8;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = size;
    patternCanvas.height = size;
    const ctx = patternCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = hexToRgba(color, dark ? 0.14 : 0.2);
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1, size + 1);
    ctx.lineTo(size + 1, -1);
    ctx.moveTo(-1, 1);
    ctx.lineTo(1, -1);
    ctx.moveTo(size - 1, size + 1);
    ctx.lineTo(size + 1, size - 1);
    ctx.stroke();
    return ctx.createPattern(patternCanvas, 'repeat');
  } catch {
    return null;
  }
}
