/**
 * Thumbnail-sized copies of the place photos for the trip PDF (#1501).
 *
 * The print engine embeds every image at the size it was served in, so a trip of
 * two hundred stops printed to a file of fifty megabytes for pictures 52 px wide.
 * Each photo this server hands out (uploads and the place-photo proxy) is fetched,
 * scaled down and baked into the document as a JPEG data URL. A photo from another
 * origin keeps its URL: without CORS a canvas that drew it could not be read back.
 *
 * Best-effort throughout. A photo that fails to load, is not an image, is already
 * small or cannot be encoded keeps its URL, and none holds the export up for longer
 * than FETCH_TIMEOUT_MS.
 */

/** The short side of a place card's copy: three times its 74 px photo, sharp at print resolution. */
const THUMB_PX = 222;
/** The short side of a copy for the photo strip that opens a day, which runs the width of the page. */
export const STRIP_PX = 480;
const JPEG_QUALITY = 0.72;
/**
 * Photos in flight at once: a trip of hundreds should neither queue one by one nor
 * decode all at once. Kept low for the phone, where each decode costs memory.
 */
const CONCURRENCY = 3;
const FETCH_TIMEOUT_MS = 10_000;
/** Anything larger is not read into memory for a thumbnail; it keeps its URL. */
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * The shrunk copy of each same-origin photo in `urls`, keyed by its URL. A URL
 * missing from the result prints as it is. Stops starting new photos once
 * `signal` aborts, and returns what it has.
 */
export async function shrinkPdfImages(
  urls: Iterable<string>,
  signal?: AbortSignal,
  shortSide = THUMB_PX
): Promise<Map<string, string>> {
  const shrunk = new Map<string, string>();
  const queue = [...new Set(urls)].filter(isSameOrigin);
  if (queue.length === 0 || !canShrink()) return shrunk;

  const worker = async () => {
    for (let url = queue.shift(); url !== undefined && !signal?.aborted; url = queue.shift()) {
      const copy = await shrinkImage(url, shortSide, signal);
      if (copy) shrunk.set(url, copy);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  return shrunk;
}

function isSameOrigin(url: string): boolean {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    // Not a URL at all: there is nothing to fetch, and the document prints it as given.
    return false;
  }
}

// createImageBitmap is checked first: where it is missing (old browsers, jsdom) the
// canvas is never asked for a context.
function canShrink(): boolean {
  return typeof createImageBitmap === 'function' && document.createElement('canvas').getContext('2d') !== null;
}

async function shrinkImage(url: string, shortSide: number, signal?: AbortSignal): Promise<string | null> {
  // Decoded at twice the short side, so a portrait photo still has room to shrink.
  const bitmap = await fetchBitmap(url, shortSide * 2, signal);
  if (!bitmap) return null;
  try {
    return toJpeg(bitmap, shortSide);
  } finally {
    bitmap.close();
  }
}

/**
 * The photo at `url` decoded at `height` pixels, or null when it cannot be had. Decoded
 * near the size it is drawn at: a 48 MP phone photo decoded in full holds about 190 MB,
 * which can end the web view on a phone. Browsers without the option decode in full and
 * the canvas scales down as before.
 */
async function fetchBitmap(url: string, height: number, signal?: AbortSignal): Promise<ImageBitmap | null> {
  // A controller and a timer rather than AbortSignal.timeout/any, which Safari only
  // has from 16 and 17.4 on; a throw there would cost the whole export.
  const fetching = new AbortController();
  const stop = () => fetching.abort();
  const timer = setTimeout(stop, FETCH_TIMEOUT_MS);
  signal?.addEventListener('abort', stop);
  try {
    const res = await fetch(url, { signal: fetching.signal });
    if (!res.ok || Number(res.headers.get('content-length') ?? 0) > MAX_BYTES) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size > MAX_BYTES) return null;
    return await createImageBitmap(blob, { resizeHeight: height, resizeQuality: 'medium' });
  } catch {
    // Offline, timed out, aborted or undecodable: the photo prints from its URL.
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
}

/** The cover page in pixels: A4 at 150 dpi, enough for a photo behind the type. */
const COVER_W = 1240;
const COVER_H = 1754;
const COVER_QUALITY = 0.82;

/** One stop of the shade over the cover photo: how far down the page, 0 to 1, and how dark. */
export type ShadeStop = readonly [at: number, alpha: number];

/**
 * The cover photo cropped to the page with its shade painted in, as one JPEG at print
 * size. A page-sized photo under a translucent gradient is composited again by every
 * viewer on every redraw, which made the first pages stutter in the preview and in the
 * saved file; one flat picture is drawn once. Null for a photo from another origin or
 * one that cannot be read: the cover then prints the photo and the shade as before.
 */
export async function bakePdfCover(
  url: string,
  shade: readonly ShadeStop[],
  signal?: AbortSignal
): Promise<string | null> {
  if (!isSameOrigin(url) || !canShrink()) return null;
  const bitmap = await fetchBitmap(url, COVER_H, signal);
  if (!bitmap) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = COVER_W;
    canvas.height = COVER_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Cropped the way background-size: cover crops it, around the middle.
    const scale = Math.max(COVER_W / bitmap.width, COVER_H / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    ctx.drawImage(bitmap, (COVER_W - width) / 2, (COVER_H - height) / 2, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, COVER_H);
    for (const [at, alpha] of shade) gradient.addColorStop(at, `rgba(10, 10, 14, ${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, COVER_W, COVER_H);
    const baked = canvas.toDataURL('image/jpeg', COVER_QUALITY);
    return baked.startsWith('data:image/jpeg') ? baked : null;
  } finally {
    bitmap.close();
  }
}

/** The bitmap with its short side at `shortSide`, or null when it is that small already. */
function toJpeg(bitmap: ImageBitmap, shortSide: number): string | null {
  const scale = shortSide / Math.min(bitmap.width, bitmap.height);
  if (!Number.isFinite(scale) || scale >= 1) return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // JPEG has no alpha channel: a transparent PNG would turn black without a white ground.
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const copy = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return copy.startsWith('data:image/jpeg') ? copy : null;
}
