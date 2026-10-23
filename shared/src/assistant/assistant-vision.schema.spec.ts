import {
  ASSISTANT_PAGE_IMAGE,
  assistantPageRenderSchema,
  assistantPageViewSchema,
  assistantRenderUploadRequestSchema,
  drawnPhotoIdsOf,
  previewBookPageRequestSchema,
} from './assistant-vision.schema';
import { assistantMessagePartSchema, uiStreamChunkSchema } from './assistant.schema';

import { describe, expect, it } from 'vitest';

const RENDER = {
  requestId: '0b6f7c1e-3a52-4d8e-9a7b-2f1e0c9d8a76',
  threadId: 4,
  spreadId: 'sp-1',
  bookVersion: 7,
  hiddenPhotoIds: [12],
};

const VIEW = { spreadId: 'sp-1', bookVersion: 7, width: 1280, height: 640, bytes: 182_000, description: 'Page 2' };

describe('the Studio page image', () => {
  it('ASTVIS-001: a render request names the page, the version and the photos left out; a proposal its page', () => {
    expect(assistantPageRenderSchema.safeParse(RENDER).success).toBe(true);
    // A proposal comes as the page the server applied it to, for the Studio to draw as it is.
    const spread = { id: 'sp-1', role: 'inner', background: '#ffffff', elements: [], parked: [], entryId: null };
    expect(assistantPageRenderSchema.parse({ ...RENDER, spread }).spread).toEqual(spread);
    const notAPage = { ...spread, background: 'white' };
    expect(assistantPageRenderSchema.safeParse({ ...RENDER, spread: notAPage }).success).toBe(false);
    expect(assistantPageRenderSchema.safeParse({ ...RENDER, requestId: 'r1' }).success).toBe(false);
    expect(assistantPageRenderSchema.safeParse({ ...RENDER, spreadId: '../x' }).success).toBe(false);
  });

  it('ASTVIS-002: a page view keeps the size of the image and the description, never the image', () => {
    expect(assistantPageViewSchema.parse({ ...VIEW, data: 'aGVsbG8=' })).toEqual(VIEW);
    const textOnly = { ...VIEW, width: null, height: null, bytes: null };
    expect(assistantPageViewSchema.safeParse(textOnly).success).toBe(true);
  });

  it('ASTVIS-003: the page view is a stored part; the render request and the page view are stream chunks', () => {
    expect(assistantMessagePartSchema.safeParse({ type: 'data-trek-page-view', data: VIEW }).success).toBe(true);
    const request = { type: 'data-trek-render-request', data: RENDER, transient: true };
    expect(uiStreamChunkSchema.safeParse(request).success).toBe(true);
    expect(uiStreamChunkSchema.safeParse({ type: 'data-trek-page-view', data: VIEW }).success).toBe(true);
  });

  it('ASTVIS-004: an upload reads its text fields as multipart sends them, and its photo ids as a list', () => {
    const fields = { bookVersion: '7', spreadId: 'sp-1', drawnPhotoIds: '12,30' };
    expect(assistantRenderUploadRequestSchema.parse(fields)).toEqual({ ...fields, bookVersion: 7 });
    expect(drawnPhotoIdsOf('12,30')).toEqual([12, 30]);
    expect(drawnPhotoIdsOf('')).toEqual([]);
    expect(drawnPhotoIdsOf(undefined)).toEqual([]);
  });

  it('ASTVIS-006: a preview names a page and may carry the ops of a proposed edit, nothing else', () => {
    expect(previewBookPageRequestSchema.safeParse({ spreadId: 'sp-1' }).success).toBe(true);
    const ops = [{ op: 'background', color: '#ffffff' }];
    expect(previewBookPageRequestSchema.safeParse({ spreadId: 'sp-1', ops }).success).toBe(true);
    expect(previewBookPageRequestSchema.safeParse({ spreadId: 'sp-1', ops: [] }).success).toBe(false);
    expect(previewBookPageRequestSchema.safeParse({ spreadId: 'sp-1', journeyId: 3 }).success).toBe(false);
  });

  it('ASTVIS-005: an upload refuses ids that are no list of numbers, and fields it does not know', () => {
    const base = { bookVersion: '7', spreadId: 'sp-1' };
    expect(assistantRenderUploadRequestSchema.safeParse({ ...base, drawnPhotoIds: '12,,3' }).success).toBe(false);
    expect(assistantRenderUploadRequestSchema.safeParse({ ...base, drawnPhotoIds: '1;2' }).success).toBe(false);
    expect(assistantRenderUploadRequestSchema.safeParse({ ...base, data: 'x' }).success).toBe(false);
    expect(assistantRenderUploadRequestSchema.safeParse({ ...base, bookVersion: '-1' }).success).toBe(false);
  });

  it('ASTVIS-007: a page may name as many photos as its frames and map stops hold, up to the cap', () => {
    const many = Array.from({ length: ASSISTANT_PAGE_IMAGE.maxPagePhotos }, (_, i) => i + 1);
    expect(assistantPageRenderSchema.safeParse({ ...RENDER, hiddenPhotoIds: many }).success).toBe(true);
    const tooMany = [...many, ASSISTANT_PAGE_IMAGE.maxPagePhotos + 1];
    expect(assistantPageRenderSchema.safeParse({ ...RENDER, hiddenPhotoIds: tooMany }).success).toBe(false);
    const fields = { bookVersion: '7', spreadId: 'sp-1', drawnPhotoIds: many.join(',') };
    expect(assistantRenderUploadRequestSchema.safeParse(fields).success).toBe(true);
  });

  it('ASTVIS-008: a preview and a render request may name a design draft, by an id that is no path', () => {
    expect(previewBookPageRequestSchema.safeParse({ spreadId: 'sp-1', designId: 'd-1a2b' }).success).toBe(true);
    expect(previewBookPageRequestSchema.safeParse({ spreadId: 'sp-1', designId: '../d' }).success).toBe(false);
    expect(assistantPageRenderSchema.parse({ ...RENDER, designId: 'd-1a2b' }).designId).toBe('d-1a2b');
    expect(assistantPageRenderSchema.safeParse({ ...RENDER, designId: 'd/1' }).success).toBe(false);
  });
});
