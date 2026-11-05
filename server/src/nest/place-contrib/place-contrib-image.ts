import { readImageHeader } from '../common/image-header';
import { IMAGE_JPEG_QUALITY, IMAGE_MAX_BYTES, IMAGE_MAX_EDGE, IMAGE_MAX_PIXELS } from './place-contrib.constants';

import { Jimp } from 'jimp';

/** The long edges tried, largest first, until the picture fits the byte cap. */
const EDGES = [IMAGE_MAX_EDGE, 1600, 1280, 1024] as const;

/**
 * A place picture as it is sent: decoded, its long edge at most 2048 px,
 * re-encoded as a JPEG at quality 85 and at most a megabyte. The re-encode is
 * what strips the metadata: the encoder writes pixels only, so a camera's EXIF
 * (the position it was taken at, the device, the owner) never leaves.
 *
 * Null for a picture that cannot be sent: one TREK cannot decode (WebP, a
 * header that says nothing), one over the pixel cap, or one that stays over
 * the byte cap at the smallest edge tried.
 */
export async function contribJpeg(data: Buffer): Promise<Buffer | null> {
  const header = readImageHeader(data);
  if (!header || header.mimeType === 'image/webp') return null;
  if (header.width * header.height > IMAGE_MAX_PIXELS) return null;
  try {
    const image = await Jimp.read(data, { 'image/jpeg': { maxResolutionInMP: IMAGE_MAX_PIXELS / 1_000_000 } });
    return await fitting(image, EDGES);
  } catch {
    return null;
  }
}

type Picture = Awaited<ReturnType<typeof Jimp.read>>;

/** The picture at the first of `edges` whose JPEG fits the byte cap, trying them largest first; null when none does. */
async function fitting(image: Picture, edges: readonly number[]): Promise<Buffer | null> {
  const [edge, ...smaller] = edges;
  if (edge === undefined) return null;
  const copy = image.clone();
  if (Math.max(copy.width, copy.height) > edge) {
    if (copy.width >= copy.height) copy.resize({ w: edge });
    else copy.resize({ h: edge });
  }
  const encoded = Buffer.from(await copy.getBuffer('image/jpeg', { quality: IMAGE_JPEG_QUALITY }));
  return encoded.length <= IMAGE_MAX_BYTES ? encoded : fitting(image, smaller);
}
