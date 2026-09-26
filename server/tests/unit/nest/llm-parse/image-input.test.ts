import { describe, it, expect } from 'vitest';
import { Jimp } from 'jimp';
import {
  capImage,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_EDGE,
  imageMimeType,
  ImageTooLargeError,
  readImageHeader,
  renderPdfPages,
} from '../../../../src/nest/llm-parse/image-input';

async function png(w: number, h: number): Promise<Buffer> {
  const image = new Jimp({ width: w, height: h, color: 0xffffffff });
  return Buffer.from(await image.getBuffer('image/png'));
}

/** A PNG that does not compress: every pixel from a fixed pseudo-random sequence. */
async function noisePng(w: number, h: number): Promise<Buffer> {
  const image = new Jimp({ width: w, height: h, color: 0xffffffff });
  let seed = 1;
  for (let i = 0; i < image.bitmap.data.length; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    image.bitmap.data[i] = i % 4 === 3 ? 255 : (seed >>> 16) & 0xff;
  }
  return Buffer.from(await image.getBuffer('image/png'));
}

/** The signature and IHDR of a PNG, and nothing after them. */
function pngHeader(w: number, h: number): Buffer {
  const out = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(out, 0);
  out.writeUInt32BE(13, 8);
  out.write('IHDR', 12, 'latin1');
  out.writeUInt32BE(w, 16);
  out.writeUInt32BE(h, 20);
  out.writeUInt8(8, 24);
  out.writeUInt8(6, 25);
  return out;
}

/** SOI, an APP0 segment to step over, and a baseline frame header. */
function jpegHeader(w: number, h: number): Buffer {
  const app0 = Buffer.alloc(18);
  app0.writeUInt16BE(0xffe0, 0);
  app0.writeUInt16BE(16, 2);
  app0.write('JFIF', 4, 'latin1');
  const sof = Buffer.alloc(19);
  sof.writeUInt16BE(0xffc0, 0);
  sof.writeUInt16BE(17, 2);
  sof.writeUInt8(8, 4);
  sof.writeUInt16BE(h, 5);
  sof.writeUInt16BE(w, 7);
  sof.writeUInt8(3, 9);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
}

/** A RIFF/WEBP container with the size field of one of the three chunk kinds. */
function webpHeader(chunk: 'VP8 ' | 'VP8L' | 'VP8X', w: number, h: number): Buffer {
  const out = Buffer.alloc(30);
  out.write('RIFF', 0, 'latin1');
  out.writeUInt32LE(22, 4);
  out.write('WEBP', 8, 'latin1');
  out.write(chunk, 12, 'latin1');
  out.writeUInt32LE(10, 16);
  if (chunk === 'VP8 ') {
    Buffer.from([0x9d, 0x01, 0x2a]).copy(out, 23);
    out.writeUInt16LE(w, 26);
    out.writeUInt16LE(h, 28);
  } else if (chunk === 'VP8L') {
    out.writeUInt8(0x2f, 20);
    out.writeUInt32LE(((w - 1) | ((h - 1) << 14)) >>> 0, 21);
  } else {
    out.writeUIntLE(w - 1, 24, 3);
    out.writeUIntLE(h - 1, 27, 3);
  }
  return out;
}

describe('imageMimeType', () => {
  it('knows the photo formats a provider reads, whatever the case', () => {
    expect(imageMimeType('a.jpg')).toBe('image/jpeg');
    expect(imageMimeType('A.JPEG')).toBe('image/jpeg');
    expect(imageMimeType('a.png')).toBe('image/png');
    expect(imageMimeType('a.webp')).toBe('image/webp');
  });

  it('is null for everything else, HEIC included', () => {
    for (const name of ['a.heic', 'a.pdf', 'a.txt', 'jpg', 'a.jpg.pdf']) expect(imageMimeType(name)).toBeNull();
  });
});

describe('capImage', () => {
  it('shrinks the long edge of a large photo to the cap, as a JPEG', async () => {
    const out = await capImage(await png(IMAGE_MAX_EDGE * 2, 1000), 'image/png');
    expect(out.mimeType).toBe('image/jpeg');
    const back = await Jimp.read(out.data);
    expect(back.width).toBe(IMAGE_MAX_EDGE);
    expect(back.height).toBe(500);
  });

  it('caps a portrait photo by its height', async () => {
    const back = await Jimp.read((await capImage(await png(800, IMAGE_MAX_EDGE * 2), 'image/png')).data);
    expect(back.height).toBe(IMAGE_MAX_EDGE);
    expect(back.width).toBe(400);
  });

  it('leaves a photo that is already small enough untouched', async () => {
    const data = await png(400, 300);
    expect(await capImage(data, 'image/png')).toEqual({ data, mimeType: 'image/png' });
  });

  it('passes bytes it cannot decode through unchanged', async () => {
    const data = Buffer.from('RIFF....WEBP');
    expect(await capImage(data, 'image/webp')).toEqual({ data, mimeType: 'image/webp' });
  });

  it('refuses a PNG whose header claims more than the pixel cap, before decoding a byte of it', async () => {
    // 33 bytes that would inflate to 1.6 GB: the header alone says so.
    await expect(capImage(pngHeader(20000, 20000), 'image/png')).rejects.toThrow(ImageTooLargeError);
    await expect(capImage(pngHeader(20000, 20000), 'image/png')).rejects.toThrow('20000 x 20000 pixels, more than the 40 megapixels');
  });

  it('refuses a JPEG and a WebP over the pixel cap the same way', async () => {
    await expect(capImage(jpegHeader(10000, 10000), 'image/jpeg')).rejects.toThrow(ImageTooLargeError);
    await expect(capImage(webpHeader('VP8X', 8000, 6000), 'image/webp')).rejects.toThrow(ImageTooLargeError);
  });

  it('types a photo by its bytes, not its name', async () => {
    const data = await png(400, 300);
    expect(await capImage(data, 'image/jpeg')).toEqual({ data, mimeType: 'image/png' });
  });

  it('re-encodes a photo that fits the edge but is too heavy to send', async () => {
    const heavy = await noisePng(1300, 1300);
    expect(heavy.length).toBeGreaterThan(IMAGE_MAX_BYTES);
    const out = await capImage(heavy, 'image/png');
    expect(out.mimeType).toBe('image/jpeg');
    expect(out.data.length).toBeLessThan(heavy.length);
    const back = await Jimp.read(out.data);
    expect([back.width, back.height]).toEqual([1300, 1300]);
  }, 30_000);

  it('sends a WebP as it came, since nothing here decodes one, and refuses it over the byte cap', async () => {
    const small = webpHeader('VP8 ', 640, 480);
    expect(await capImage(small, 'image/webp')).toEqual({ data: small, mimeType: 'image/webp' });
    const heavy = Buffer.concat([small, Buffer.alloc(IMAGE_MAX_BYTES)]);
    await expect(capImage(heavy, 'image/webp')).rejects.toThrow(/cannot be made smaller/);
  });
});

describe('readImageHeader', () => {
  it('reads the size of a PNG and a JPEG from their first bytes', async () => {
    expect(readImageHeader(await png(400, 300))).toEqual({ mimeType: 'image/png', width: 400, height: 300 });
    const jpg = Buffer.from(await new Jimp({ width: 320, height: 200, color: 0xffffffff }).getBuffer('image/jpeg'));
    expect(readImageHeader(jpg)).toEqual({ mimeType: 'image/jpeg', width: 320, height: 200 });
    expect(readImageHeader(jpegHeader(640, 480))).toEqual({ mimeType: 'image/jpeg', width: 640, height: 480 });
  });

  it('reads all three WebP flavours', () => {
    expect(readImageHeader(webpHeader('VP8 ', 640, 480))).toEqual({ mimeType: 'image/webp', width: 640, height: 480 });
    expect(readImageHeader(webpHeader('VP8L', 1024, 768))).toEqual({ mimeType: 'image/webp', width: 1024, height: 768 });
    expect(readImageHeader(webpHeader('VP8X', 4000, 3000))).toEqual({ mimeType: 'image/webp', width: 4000, height: 3000 });
  });

  it('is null for bytes that are none of the three, or say no size', () => {
    const noFrame = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    for (const data of [Buffer.from('not an image'), Buffer.from('RIFF....WEBP'), noFrame, pngHeader(0, 10)]) {
      expect(readImageHeader(data)).toBeNull();
    }
  });
});

/**
 * A PDF with no text layer: each page is one JPEG, as a scanner writes it. The
 * page box, and the size the image claims to have, can differ from the JPEG's.
 */
async function scannedPdf(pages: number, box = { w: 300, h: 400 }, claimed = { w: 300, h: 400 }): Promise<Buffer> {
  const jpg = Buffer.from(await new Jimp({ width: 300, height: 400, color: 0xddddddff }).getBuffer('image/jpeg'));
  const objects: Buffer[] = [];
  const kids = Array.from({ length: pages }, (_, i) => `${3 + i * 3} 0 R`).join(' ');
  objects.push(Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'));
  objects.push(Buffer.from(`<< /Type /Pages /Kids [${kids}] /Count ${pages} >>`));
  for (let i = 0; i < pages; i++) {
    const page = 3 + i * 3;
    const content = `q ${box.w} 0 0 ${box.h} 0 0 cm /Im0 Do Q`;
    objects.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${box.w} ${box.h}] /Resources << /XObject << /Im0 ${page + 2} 0 R >> >> /Contents ${page + 1} 0 R >>`));
    objects.push(Buffer.from(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    objects.push(Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${claimed.w} /Height ${claimed.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`),
      jpg,
      Buffer.from('\nendstream'),
    ]));
  }
  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets: number[] = [];
  let length = parts[0].length;
  objects.forEach((body, i) => {
    offsets.push(length);
    const obj = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), body, Buffer.from('\nendobj\n')]);
    parts.push(obj);
    length += obj.length;
  });
  const rows = offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  parts.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${rows}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`));
  return Buffer.concat(parts);
}

describe('renderPdfPages', () => {
  it('draws the first two pages of a scan as images no larger than a capped photo', async () => {
    const pages = await renderPdfPages(await scannedPdf(3));
    expect(pages).toHaveLength(2);
    for (const page of pages) {
      const image = await Jimp.read(page.data);
      expect(Math.max(image.width, image.height)).toBeLessThanOrEqual(IMAGE_MAX_EDGE);
    }
  }, 30_000);

  it('draws a page by its long edge, so a tall strip never becomes a huge canvas', async () => {
    // Scaled by its width alone, this page was a canvas of 1600 x 320000 pixels.
    const [page] = await renderPdfPages(await scannedPdf(1, { w: 10, h: 2000 }));
    const image = await Jimp.read(page.data);
    expect(image.height).toBeLessThanOrEqual(IMAGE_MAX_EDGE);
    expect(image.width).toBeLessThanOrEqual(10);
  }, 30_000);

  it('still draws a page whose embedded image claims more than the pixel cap, leaving that image out', async () => {
    const pages = await renderPdfPages(await scannedPdf(1, { w: 300, h: 400 }, { w: 20000, h: 20000 }));
    expect(pages).toHaveLength(1);
  }, 30_000);

  it('throws for bytes that are not a PDF, which the caller reports as unreadable', async () => {
    await expect(renderPdfPages(Buffer.from('not a pdf'))).rejects.toThrow();
  });
});
