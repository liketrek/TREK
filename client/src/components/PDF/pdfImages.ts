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

/** The short side of a copy: three times the 52 px thumbnail, sharp at print resolution. */
const THUMB_PX = 156;
const JPEG_QUALITY = 0.72;
/**
 * Photos in flight at once: a trip of hundreds should neither queue one by one nor
 * decode all at once. Kept low for the phone, where each decode costs memory.
 */
const CONCURRENCY = 3;
/** Height a photo is decoded at: twice THUMB_PX, so a portrait one still has room to shrink. */
const DECODE_PX = THUMB_PX * 2;
const FETCH_TIMEOUT_MS = 10_000;
/** Anything larger is not read into memory for a thumbnail; it keeps its URL. */
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * The shrunk copy of each same-origin photo in `urls`, keyed by its URL. A URL
 * missing from the result prints as it is. Stops starting new photos once
 * `signal` aborts, and returns what it has.
 */
export async function shrinkPdfImages(urls: Iterable<string>, signal?: AbortSignal): Promise<Map<string, string>> {
  const shrunk = new Map<string, string>();
  const queue = [...new Set(urls)].filter(isSameOrigin);
  if (queue.length === 0 || !canShrink()) return shrunk;

  const worker = async () => {
    for (let url = queue.shift(); url !== undefined && !signal?.aborted; url = queue.shift()) {
      const copy = await shrinkImage(url, signal);
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

async function shrinkImage(url: string, signal?: AbortSignal): Promise<string | null> {
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
    // Decoded near thumbnail size: a 48 MP phone photo decoded in full holds about
    // 190 MB, which can end the web view on a phone. Browsers without the option
    // decode in full and toJpeg scales down as before.
    const bitmap = await createImageBitmap(blob, { resizeHeight: DECODE_PX, resizeQuality: 'medium' });
    try {
      return toJpeg(bitmap);
    } finally {
      bitmap.close();
    }
  } catch {
    // Offline, timed out, aborted or undecodable: the photo prints from its URL.
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
}

/** The bitmap with its short side at THUMB_PX, or null when it is that small already. */
function toJpeg(bitmap: ImageBitmap): string | null {
  const scale = THUMB_PX / Math.min(bitmap.width, bitmap.height);
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
