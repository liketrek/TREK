/**
 * What an image is and how large, read from its first bytes without decoding
 * it. Shared by the domains that take an image from outside and must check it
 * before anything decodes or sends it: the photo imports of AI parsing and
 * the Studio page images the assistant hands a model.
 */

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
  } else if (
    data.length >= 16 &&
    data.toString('latin1', 0, 4) === 'RIFF' &&
    data.toString('latin1', 8, 12) === 'WEBP'
  ) {
    const size = webpSize(data);
    found = size && { mimeType: 'image/webp', ...size };
  }
  // A zero edge is a header that defers its size (a JPEG's DNL), which says nothing.
  return found && found.width > 0 && found.height > 0 ? found : null;
}
