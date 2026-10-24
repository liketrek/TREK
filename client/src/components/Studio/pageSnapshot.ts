import { ASSISTANT_PAGE_IMAGE, type BookPageSetup, type BookSpread } from '@trek/shared';
import { snapshotFontCss } from './snapshotFonts';

/**
 * One Studio page as a JPEG, for the assistant to look at (journey-studio.md
 * 3.1). The page is the editor's own SpreadView, drawn off screen, and this
 * turns that DOM into an image through modern-screenshot, which is loaded
 * only when a page is first drawn, so nobody downloads it before the Studio
 * chat asks for one.
 *
 * What is drawn is what is sent, so the filter runs here, on the DOM, before
 * anything is rasterised: a picture from another server (map tiles, a static
 * map) is left out, because it would taint the canvas and say where the user
 * is, and so is any photo the turn named as hidden. The photos left in are
 * read off the DOM itself, so the upload declares exactly what the image shows.
 */

/** CSS pixels in a millimetre, the size SpreadView's millimetre boxes are laid out at. */
const PX_PER_MM = 96 / 25.4;

/** How long the pictures of one page may take to load before it is drawn without them. */
const LOAD_TIMEOUT_MS = 8_000;

/** The path of a TREK photo, with its id. */
const PHOTO_PATH = /^\/api\/photos\/(\d+)\//;

interface PageSnapshot {
  image: Blob;
  width: number;
  height: number;
  /** The photos the image shows, as the server checks them. */
  drawnPhotoIds: number[];
}

/** A sheet's size in CSS pixels: one page for the covers and the first and last pages, two for an inner spread. */
export function sheetSizePx(spread: BookSpread, page: BookPageSetup): { width: number; height: number } {
  const pages = spread.role === 'inner' ? 2 : 1;
  return { width: page.pageWidth * pages * PX_PER_MM, height: page.pageHeight * PX_PER_MM };
}

/** Where a picture element takes its image from: an img's src, an SVG image's href. */
function sourceOf(node: Element): string | null {
  const tag = node.tagName.toLowerCase();
  if (tag === 'img') return node.getAttribute('src');
  if (tag === 'image') return node.getAttribute('href') ?? node.getAttribute('xlink:href');
  return null;
}

/** A picture's URL read against this page, or null when it is not one. */
function urlOf(src: string): URL | null {
  try {
    return new URL(src, window.location.href);
  } catch {
    return null;
  }
}

/** The TREK photo a picture shows, or null for any other picture. */
function photoIdOf(url: URL): number | null {
  const match = PHOTO_PATH.exec(url.pathname);
  return match ? Number(match[1]) : null;
}

/** Whether a picture may be drawn: an inline one, or one from this server that is not a hidden photo. */
function drawable(src: string, hidden: ReadonlySet<number>): boolean {
  if (src.startsWith('data:')) return true;
  const url = urlOf(src);
  if (!url || url.origin !== window.location.origin) return false;
  const photoId = photoIdOf(url);
  return photoId === null || !hidden.has(photoId);
}

/** Whether a node of the page goes into the image. */
export function keepNode(node: Node, hidden: ReadonlySet<number>): boolean {
  if (!(node instanceof Element)) return true;
  const src = sourceOf(node);
  return src === null || drawable(src, hidden);
}

/** The photos the kept pictures of a page show, each once. */
export function drawnPhotoIdsOf(root: Element, hidden: ReadonlySet<number>): number[] {
  const ids = new Set<number>();
  root.querySelectorAll('img, image').forEach((node) => {
    const src = sourceOf(node);
    const url = src !== null && drawable(src, hidden) ? urlOf(src) : null;
    const photoId = url ? photoIdOf(url) : null;
    if (photoId !== null) ids.add(photoId);
  });
  return [...ids];
}

/** Waits for one picture, loading it now if it was lazy. */
async function decoded(img: HTMLImageElement): Promise<void> {
  img.loading = 'eager';
  try {
    await img.decode();
  } catch {
    // Drawn as the browser has it: a picture that cannot be decoded leaves its frame, and the page still goes.
  }
}

/** Waits for the page's own pictures, at most `LOAD_TIMEOUT_MS`. */
async function picturesLoaded(root: Element, hidden: ReadonlySet<number>): Promise<void> {
  const loads = [...root.querySelectorAll('img')].flatMap((img) => {
    const src = img.getAttribute('src');
    return src !== null && drawable(src, hidden) ? [decoded(img)] : [];
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, LOAD_TIMEOUT_MS);
  });
  await Promise.race([Promise.all(loads), late]);
  clearTimeout(timer);
}

/**
 * The sheet under `root` as a JPEG, its long edge at
 * `ASSISTANT_PAGE_IMAGE.longEdge` pixels (journey-studio.md 3.2: a double
 * spread 1280 x 640, a single page 1280 on its long edge). `size` is the
 * sheet's own size in CSS pixels (`sheetSizePx`). Null when the image comes
 * out larger than the server takes, so the turn goes on with the page's
 * description.
 */
export async function snapshotSpread(
  root: HTMLElement,
  size: { width: number; height: number },
  hiddenPhotoIds: ReadonlySet<number>
): Promise<PageSnapshot | null> {
  await picturesLoaded(root, hiddenPhotoIds);
  // Only the faces the page draws travel with it (snapshotFonts.ts); without any, the library looks for itself.
  const fontCss = await snapshotFontCss(root);
  // A single page is drawn up to the long edge too: a larger scale renders the page sharper, it stretches no pixels.
  const scale = ASSISTANT_PAGE_IMAGE.longEdge / Math.max(size.width, size.height);
  const { domToBlob } = await import('modern-screenshot');
  const image = await domToBlob(root, {
    width: size.width,
    height: size.height,
    scale,
    type: 'image/jpeg',
    quality: ASSISTANT_PAGE_IMAGE.jpegQuality,
    filter: (node) => keepNode(node, hiddenPhotoIds),
    timeout: LOAD_TIMEOUT_MS,
    ...(fontCss ? { font: { cssText: fontCss } } : {}),
    fetch: { requestInit: { credentials: 'same-origin', cache: 'force-cache' } },
  });
  if (image.size > ASSISTANT_PAGE_IMAGE.maxBytes) return null;
  return {
    image,
    width: Math.round(size.width * scale),
    height: Math.round(size.height * scale),
    drawnPhotoIds: drawnPhotoIdsOf(root, hiddenPhotoIds),
  };
}
