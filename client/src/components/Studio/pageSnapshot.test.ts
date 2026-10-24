/**
 * FE-STUDIO-SNAP-001 to FE-STUDIO-SNAP-005
 *
 * The page image the Studio sends the assistant (journey-studio.md 3.1, 3.4):
 * a sheet's size in CSS pixels, the filter that leaves out pictures from
 * other servers and hidden photos before anything is rasterised, the photos
 * the upload declares read off what is kept, and the JPEG at 1280 pixels
 * on its long edge. modern-screenshot is faked; a real browser draws the page
 * in the Playwright flows.
 */
import { ASSISTANT_PAGE_IMAGE, blankBook, bookPageSetupForPreset } from '@trek/shared';
import { domToBlob, type Options } from 'modern-screenshot';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { drawnPhotoIdsOf, keepNode, sheetSizePx, snapshotSpread } from './pageSnapshot';

vi.mock('modern-screenshot', () => ({ domToBlob: vi.fn() }));

const SVG = 'http://www.w3.org/2000/svg';

function picture(src: string): HTMLImageElement {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  return img;
}

function svgImage(href: string): Element {
  const image = document.createElementNS(SVG, 'image');
  image.setAttribute('href', href);
  return image;
}

/** A sheet holding an own photo twice, a hidden photo, a map tile and a stop's own photo. */
function sheet(): HTMLDivElement {
  const root = document.createElement('div');
  root.append(
    picture('/api/photos/7/thumbnail'),
    picture('/api/photos/7/thumbnail'),
    picture('/api/photos/31/thumbnail'),
    picture('https://tile.openstreetmap.org/5/16/10.png')
  );
  const svg = document.createElementNS(SVG, 'svg');
  svg.append(svgImage('/api/photos/8/thumbnail'), svgImage('/api/photos/32/thumbnail'));
  root.append(svg);
  return root;
}

const HIDDEN: ReadonlySet<number> = new Set([31, 32]);

/** The calls made to the fake, as the node and options form of domToBlob takes them. */
const blobCalls = () => vi.mocked(domToBlob).mock.calls as unknown as Array<[Node, Options | undefined]>;

afterEach(() => vi.clearAllMocks());

describe('pageSnapshot', () => {
  it('FE-STUDIO-SNAP-001: a cover is one page wide and an inner spread two, in CSS pixels', () => {
    const page = bookPageSetupForPreset('square-210');
    const [cover, , inner] = blankBook({ title: 'Lisbon', page }).spreads;
    if (!cover || !inner) throw new Error('blank book without a cover or an inner spread');
    const px = 210 * (96 / 25.4);

    expect(sheetSizePx(cover, page)).toEqual({ width: px, height: px });
    expect(sheetSizePx(inner, page)).toEqual({ width: px * 2, height: px });
  });

  it('FE-STUDIO-SNAP-002: leaves out pictures from other servers and hidden photos, keeps the rest', () => {
    expect(keepNode(picture('/api/photos/7/thumbnail'), HIDDEN)).toBe(true);
    expect(keepNode(picture('data:image/png;base64,AAAA'), HIDDEN)).toBe(true);
    expect(keepNode(picture('/api/photos/31/original'), HIDDEN)).toBe(false);
    expect(keepNode(picture('https://tile.openstreetmap.org/5/16/10.png'), HIDDEN)).toBe(false);
    expect(keepNode(svgImage('/api/photos/32/thumbnail'), HIDDEN)).toBe(false);
    expect(keepNode(svgImage('https://api.mapbox.com/styles/v1/x/static/0,0,1/400x300'), HIDDEN)).toBe(false);
    // Everything that is not a picture is drawn as it is.
    expect(keepNode(document.createElement('div'), HIDDEN)).toBe(true);
    expect(keepNode(document.createTextNode('Lisbon'), HIDDEN)).toBe(true);
  });

  it('FE-STUDIO-SNAP-003: declares each kept photo once, and none it left out', () => {
    expect(drawnPhotoIdsOf(sheet(), HIDDEN).sort((a, b) => a - b)).toEqual([7, 8]);
    expect(drawnPhotoIdsOf(sheet(), new Set()).sort((a, b) => a - b)).toEqual([7, 8, 31, 32]);
  });

  it('FE-STUDIO-SNAP-004: draws a JPEG with its long edge at 1280 pixels through the same filter', async () => {
    const image = new Blob(['jpeg'], { type: 'image/jpeg' });
    vi.mocked(domToBlob).mockResolvedValueOnce(image);
    const root = sheet();

    const shot = await snapshotSpread(root, { width: 1600, height: 800 }, HIDDEN);

    expect(shot).toEqual({ image, width: 1280, height: 640, drawnPhotoIds: [7, 8] });
    const [node, options] = blobCalls()[0] ?? [];
    expect(node).toBe(root);
    expect(options).toMatchObject({
      width: 1600,
      height: 800,
      scale: 0.8,
      type: 'image/jpeg',
      quality: ASSISTANT_PAGE_IMAGE.jpegQuality,
    });
    const filter = options?.filter;
    expect(filter?.(picture('/api/photos/31/thumbnail'))).toBe(false);
    expect(filter?.(picture('/api/photos/7/thumbnail'))).toBe(true);
  });

  it('FE-STUDIO-SNAP-005: an image too large for the server is not sent, a small sheet is drawn to the long edge', async () => {
    vi.mocked(domToBlob).mockResolvedValueOnce(new Blob([new Uint8Array(ASSISTANT_PAGE_IMAGE.maxBytes + 1)]));
    expect(await snapshotSpread(sheet(), { width: 1600, height: 800 }, HIDDEN)).toBeNull();

    vi.mocked(domToBlob).mockResolvedValueOnce(new Blob(['jpeg'], { type: 'image/jpeg' }));
    const small = await snapshotSpread(sheet(), { width: 400, height: 300 }, HIDDEN);
    expect(small).toMatchObject({ width: 1280, height: 960 });
    expect(blobCalls()[1]?.[1]).toMatchObject({ width: 400, height: 300, scale: 3.2 });
  });
});
