/**
 * When the print view of a book is actually printable.
 *
 * Both halves matter and neither is covered by the load event: a photograph
 * still decoding prints as an empty box, and a face still loading prints in the
 * fallback, the exact substitution the bundled typefaces exist to prevent.
 */

/** How long the print view waits at most, and the photo count past which a book gets the longer wait. */
const PRINT_READY = {
  ceilingMs: 8000,
  largeCeilingMs: 15000,
  largeBookPhotos: 40,
} as const;

/**
 * The longest the Save button stays off for a book of `photos` pictures. A
 * book of a few dozen photographs from a slow provider can take longer than
 * eight seconds to decode; one that has not finished must not go to the press.
 */
export function printReadyCeilingMs(photos: number): number {
  return photos > PRINT_READY.largeBookPhotos ? PRINT_READY.largeCeilingMs : PRINT_READY.ceilingMs;
}

/** What `whenReady` reads off the print document: its `<img>` elements, its SVG and its fonts. */
interface PrintDocument {
  images: ArrayLike<Element & { complete?: boolean }>;
  querySelectorAll?: (selector: string) => ArrayLike<Element>;
  fonts?: { ready: Promise<unknown> };
}

const XLINK = 'http://www.w3.org/1999/xlink';

/**
 * The SVG pictures to wait for: every `<image>` that names a source, wherever
 * it sits. `doc.images` does not collect them, and they are not only the
 * photographs in a map's markers: a photo cut to a mask or set behind clipped
 * type is an `<image>` inside a `<clipPath>` or `<defs>`, which the selector
 * reaches just the same. One that names no source would never fire an event,
 * so it is left out rather than left to hold the button until the ceiling.
 */
export function svgImagesToWait(doc: PrintDocument): Element[] {
  const found = Array.from(doc.querySelectorAll?.('image') ?? []);
  return found.filter((el) => !!(el.getAttribute('href') || el.getAttributeNS(XLINK, 'href')));
}

/** Resolves when the element has loaded or failed: a picture that will not load must not hold the button hostage. */
function settle(el: Element): Promise<void> {
  return new Promise<void>((resolve) => {
    el.addEventListener('load', () => resolve(), { once: true });
    el.addEventListener('error', () => resolve(), { once: true });
  });
}

/**
 * Wait until the print view's pictures and faces are in, or until the
 * ceiling, which rises for a book with many photographs. Without `complete`
 * on an SVG image there is no way to tell one that is still coming from one
 * whose events fired before this ran, and a Save button that never enables is
 * worse than a marker that prints blank.
 */
export async function whenReady(iframe: HTMLIFrameElement): Promise<void> {
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument as PrintDocument | null;
  if (!win || !doc) return;

  const imgs = Array.from(doc.images);
  const svg = svgImagesToWait(doc);
  const images = imgs.map((img) => (img.complete ? Promise.resolve() : settle(img)));

  const wait = win.setTimeout?.bind(win) ?? setTimeout;
  const ceiling = new Promise<void>((resolve) => {
    wait(resolve, printReadyCeilingMs(imgs.length + svg.length));
  });

  await Promise.race([Promise.all([...images, ...svg.map(settle), doc.fonts?.ready ?? Promise.resolve()]), ceiling]);
}
