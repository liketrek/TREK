import type { BookLineElement, BookPhotoElement, BookShapeElement, BookTextElement } from '@trek/shared';
import {
  bookLineElementSchema,
  bookMapElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookStatsElementSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
} from '@trek/shared';
import { describe, expect, it } from 'vitest';

import {
  edgeInUse,
  mapZoomInUse,
  maskInUse,
  ornamentInUse,
  photoEdgesInUse,
  positionInUse,
  selectionKey,
  shapeOutlineInUse,
  textEffectsInUse,
  textPlacementInUse,
  travelTypeInUse,
} from './inspectorModel';

/**
 * FE-STUDIO-INSPMODEL-001 to FE-STUDIO-INSPMODEL-008: which folded groups of
 * the inspector an element already uses, read off the element alone.
 */

const FRAME = { x: 10, y: 10, w: 40, h: 30 };
const text = (over: Record<string, unknown> = {}): BookTextElement =>
  bookTextElementSchema.parse({ id: 't', kind: 'text', frame: FRAME, text: 'Lisbon', ...over });
const photo = (over: Record<string, unknown> = {}): BookPhotoElement =>
  bookPhotoElementSchema.parse({ id: 'p', kind: 'photo', frame: FRAME, photoId: 3, ...over });
const shape = (over: Record<string, unknown> = {}): BookShapeElement =>
  bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame: FRAME, ...over });
const line = (over: Record<string, unknown> = {}): BookLineElement =>
  bookLineElementSchema.parse({ id: 'l', kind: 'line', frame: FRAME, ...over });

describe('the groups an element uses', () => {
  it('FE-STUDIO-INSPMODEL-001: opens the position on a turned, faded or sticker element only', () => {
    expect(positionInUse(shape())).toBe(false);
    expect(positionInUse(shape({ rotation: 4 }))).toBe(true);
    expect(positionInUse(shape({ opacity: 0.6 }))).toBe(true);
    const sticker = bookStickerElementSchema.parse({ id: 'k', kind: 'sticker', frame: FRAME, stickerId: 'sun' });
    expect(positionInUse(sticker)).toBe(true);
  });

  it('FE-STUDIO-INSPMODEL-002: reads case, the lines in the frame and fitting as the placement of a text', () => {
    expect(textPlacementInUse(text())).toBe(false);
    expect(textPlacementInUse(text({ transform: 'none', vAlign: 'top', fit: 'none' }))).toBe(false);
    expect(textPlacementInUse(text({ transform: 'upper' }))).toBe(true);
    expect(textPlacementInUse(text({ vAlign: 'bottom' }))).toBe(true);
    expect(textPlacementInUse(text({ fit: 'shrink' }))).toBe(true);
  });

  it('FE-STUDIO-INSPMODEL-003: counts any one effect as the effects of a text', () => {
    expect(textEffectsInUse(text())).toBe(false);
    expect(textEffectsInUse(text({ outline: { color: '#ffffff', width: 0.5 } }))).toBe(true);
    expect(textEffectsInUse(text({ curve: { type: 'arc', bend: 40, start: 0 } }))).toBe(true);
  });

  it('FE-STUDIO-INSPMODEL-004: reads a drawn or dashed stroke as the outline of a shape', () => {
    expect(shapeOutlineInUse(shape({ stroke: null, strokeWidth: 0 }))).toBe(false);
    expect(shapeOutlineInUse(shape({ stroke: '#141414', strokeWidth: 0 }))).toBe(false);
    expect(shapeOutlineInUse(shape({ stroke: '#141414', strokeWidth: 0.5 }))).toBe(true);
    expect(shapeOutlineInUse(shape({ strokeStyle: 'dashed' }))).toBe(true);
  });

  it('FE-STUDIO-INSPMODEL-005: reads the cut, the edge, the border and the ornament off the element', () => {
    expect(edgeInUse(undefined)).toBe(false);
    expect(edgeInUse('straight')).toBe(false);
    expect(edgeInUse('zigzag')).toBe(true);
    expect(maskInUse(photo())).toBe(false);
    expect(maskInUse(photo({ mask: 'rect' }))).toBe(false);
    expect(maskInUse(photo({ mask: 'heart' }))).toBe(true);
    expect(photoEdgesInUse(photo())).toBe(false);
    expect(photoEdgesInUse(photo({ border: { width: 3, color: '#ffffff' } }))).toBe(true);
    expect(ornamentInUse(line())).toBe(false);
    expect(ornamentInUse(line({ ornament: 'sun' }))).toBe(true);
  });

  it('FE-STUDIO-INSPMODEL-006: keys the groups by the selection, so another selection mounts them afresh', () => {
    expect(selectionKey(['a'])).toBe('a');
    expect(selectionKey(['a', 'b'])).toBe('a|b');
    expect(selectionKey(['a', 'b'])).not.toBe(selectionKey(['b', 'a']));
    expect(selectionKey([])).toBe('');
  });

  it('FE-STUDIO-INSPMODEL-007: reads a zoom of its own as the zoom of a map', () => {
    const map = (over: Record<string, unknown> = {}) =>
      bookMapElementSchema.parse({ id: 'm', kind: 'map', frame: FRAME, source: 'tiles', ...over });
    expect(mapZoomInUse(map())).toBe(false);
    expect(mapZoomInUse(map({ zoom: null }))).toBe(false);
    expect(mapZoomInUse(map({ zoom: 11 }))).toBe(true);
    expect(mapZoomInUse(map({ zoom: 0 }))).toBe(true);
  });

  it('FE-STUDIO-INSPMODEL-008: reads another face, weight or size as the type of a travel element', () => {
    const stats = (over: Record<string, unknown> = {}) =>
      bookStatsElementSchema.parse({ id: 'st', kind: 'stats', frame: FRAME, ...over });
    expect(travelTypeInUse(stats())).toBe(false);
    expect(travelTypeInUse(stats({ font: 'serif' }))).toBe(true);
    expect(travelTypeInUse(stats({ weight: 400 }))).toBe(true);
    expect(travelTypeInUse(stats({ textScale: 0.85 }))).toBe(true);
  });
});
