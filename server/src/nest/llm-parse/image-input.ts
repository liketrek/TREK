import { extname } from 'node:path';
import { Jimp } from 'jimp';
import { PDFParse } from 'pdf-parse';
import { LLM_PHOTO_EXTENSIONS } from '@trek/shared';

/** A photographed document on its way to a vision model, by the extensions shared/ lists. */
const IMAGE_MIME_BY_EXT: Record<(typeof LLM_PHOTO_EXTENSIONS)[number], string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export const IMAGE_EXTENSIONS: readonly string[] = LLM_PHOTO_EXTENSIONS;

/** The image MIME type for a file name, or null when it is not a photo TREK sends. */
export function imageMimeType(fileName: string): string | null {
  return (IMAGE_MIME_BY_EXT as Record<string, string>)[extname(fileName).toLowerCase()] ?? null;
}

/**
 * Long edge in pixels. A phone photo is around twelve megapixels, which a model
 * pays for in prompt tokens without reading the print any better: the same
 * receipt on a local qwen3.5:4b took 252s whole and 37-124s at this size.
 */
export const IMAGE_MAX_EDGE = 1600;
const IMAGE_JPEG_QUALITY = 82;

/**
 * The most pixels a photo may have before it is decoded. Decoding is pure JS on
 * the main thread, and a PNG says in its first bytes how large it inflates: a
 * 2 MB file of one flat colour can claim 20000 x 20000, which is 1.6 GB of
 * bitmap before a single pixel is resized. Forty megapixels is more than any
 * phone takes by default and stays in the hundreds of megabytes.
 */
export const IMAGE_MAX_PIXELS = 40_000_000;

/**
 * The most bytes a photo is sent with. Anthropic refuses an image over 5 MB and
 * base64 adds a third, so a small image that is heavy (a noisy PNG) is
 * re-encoded as a JPEG, and one TREK cannot re-encode is refused over it.
 */
export const IMAGE_MAX_BYTES = Math.floor(3.5 * 1024 * 1024);

/** A photo TREK will not decode or send: the message says why, for the import's warning. */
export class ImageTooLargeError extends Error {}

export interface ImageHeader {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

/** JPEG start-of-frame markers: every SOFn except DHT (C4), JPG (C8) and DAC (CC). */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function jpegSize(data: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i + 4 <= data.length) {
    // Stray bytes between segments, which some cameras write, are stepped over.
    if (data[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = data[i + 1];
    // Fill bytes, and the markers that carry no length.
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    // The scan or the end came before any frame header.
    if (marker === 0xd9 || marker === 0xda) return null;
    const length = data.readUInt16BE(i + 2);
    if (length < 2) return null;
    if (isStartOfFrame(marker)) {
      if (i + 9 > data.length) return null;
      return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

function webpSize(data: Buffer): { width: number; height: number } | null {
  const chunk = data.toString('latin1', 12, 16);
  if (chunk === 'VP8 ' && data.length >= 30) {
    return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L' && data.length >= 25) {
    const bits = data.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X' && data.length >= 30) {
    return { width: data.readUIntLE(24, 3) + 1, height: data.readUIntLE(27, 3) + 1 };
  }
  return null;
}

/**
 * What a photo is and how large, read from its first bytes without decoding it:
 * PNG from IHDR, JPEG from its frame header, WebP from its VP8, VP8L or VP8X
 * chunk. Null when the bytes are none of the three, or do not say.
 */
export function readImageHeader(data: Buffer): ImageHeader | null {
  let found: ImageHeader | null = null;
  if (data.length >= 24 && data.readUInt32BE(0) === 0x89504e47 && data.toString('latin1', 12, 16) === 'IHDR') {
    found = { mimeType: 'image/png', width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  } else if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    const size = jpegSize(data);
    found = size && { mimeType: 'image/jpeg', ...size };
  } else if (data.length >= 16 && data.toString('latin1', 0, 4) === 'RIFF' && data.toString('latin1', 8, 12) === 'WEBP') {
    const size = webpSize(data);
    found = size && { mimeType: 'image/webp', ...size };
  }
  // A zero edge is a header that defers its size (a JPEG's DNL), which says nothing.
  return found && found.width > 0 && found.height > 0 ? found : null;
}

/** Bytes sent as they came, as long as a provider takes them at that size. */
function asTheyCame(data: Buffer, mimeType: string): { data: Buffer; mimeType: string } {
  if (data.length > IMAGE_MAX_BYTES) {
    const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
    throw new ImageTooLargeError(
      `the photo is ${mb(data.length)} MB and cannot be made smaller, a model takes at most ${mb(IMAGE_MAX_BYTES)} MB`,
    );
  }
  return { data, mimeType };
}

/**
 * The image, no larger than the model needs, typed by its bytes rather than its
 * name: a PNG renamed to .jpg goes as the PNG it is, which Anthropic insists on.
 *
 * A PNG or JPEG is decoded only when its header says it is within the pixel cap,
 * and shrunk to the long edge, or re-encoded when it is small but heavy. Bytes
 * TREK cannot decode (WebP, or a header that says nothing) go as they came,
 * since a photo that might be read beats one refused over a failed resize, as
 * long as they are within the byte cap. Throws `ImageTooLargeError` for a photo
 * over either cap; the callers turn it into a warning like any unreadable file.
 */
export async function capImage(data: Buffer, mimeType: string): Promise<{ data: Buffer; mimeType: string }> {
  const header = readImageHeader(data);
  if (header && header.width * header.height > IMAGE_MAX_PIXELS) {
    throw new ImageTooLargeError(
      `the photo is ${header.width} x ${header.height} pixels, more than the ${IMAGE_MAX_PIXELS / 1_000_000} megapixels TREK reads`,
    );
  }
  if (!header || header.mimeType === 'image/webp') return asTheyCame(data, header?.mimeType ?? mimeType);
  if (Math.max(header.width, header.height) <= IMAGE_MAX_EDGE && data.length <= IMAGE_MAX_BYTES) {
    return { data, mimeType: header.mimeType };
  }
  try {
    // jpeg-js checks the size again while it decodes, in case the file has more than one frame header.
    const image = await Jimp.read(data, { 'image/jpeg': { maxResolutionInMP: IMAGE_MAX_PIXELS / 1_000_000 } });
    if (Math.max(image.width, image.height) > IMAGE_MAX_EDGE) {
      if (image.width >= image.height) image.resize({ w: IMAGE_MAX_EDGE });
      else image.resize({ h: IMAGE_MAX_EDGE });
    }
    const encoded = await image.getBuffer('image/jpeg', { quality: IMAGE_JPEG_QUALITY });
    return { data: Buffer.from(encoded), mimeType: 'image/jpeg' };
  } catch {
    return asTheyCame(data, header.mimeType);
  }
}

/**
 * Pages of a PDF read the only way a scan can be: as pictures. The booking
 * details sit on the first pages, and every page costs the model a photo's
 * worth of prompt, so only the first two are drawn.
 */
export const PDF_PAGES_AS_IMAGES = 2;

/**
 * The first pages of a PDF drawn as images, capped like a photo; empty when none could be drawn.
 *
 * Each page is drawn with its LONG edge at the cap, so no canvas is ever larger
 * than a capped photo: scaled by width alone, a page of 10 x 2000 points became
 * a canvas of 1600 x 320000 pixels. pdf.js leaves out an embedded image above the
 * pixel cap instead of decoding it, since it decodes images only while drawing.
 */
export async function renderPdfPages(data: Buffer): Promise<{ data: Buffer; mimeType: string }[]> {
  const parser = new PDFParse({ data: new Uint8Array(data), maxImageSize: IMAGE_MAX_PIXELS });
  try {
    const info = await parser.getInfo({ first: PDF_PAGES_AS_IMAGES, parsePageInfo: true });
    const pages: { data: Buffer; mimeType: string }[] = [];
    for (const { pageNumber, width, height } of info.pages) {
      const longEdge = Math.max(width, height);
      if (!Number.isFinite(longEdge) || Math.min(width, height) <= 0) continue;
      const shot = await parser.getScreenshot({
        partial: [pageNumber],
        scale: IMAGE_MAX_EDGE / longEdge,
        imageBuffer: true,
        imageDataUrl: false,
      });
      for (const page of shot.pages) {
        if (page.data?.length) pages.push(await capImage(Buffer.from(page.data), 'image/png'));
      }
    }
    return pages;
  } finally {
    await parser.destroy().catch(() => {});
  }
}
